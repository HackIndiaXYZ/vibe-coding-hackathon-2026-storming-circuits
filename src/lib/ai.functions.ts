import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: any) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up in Settings → Workspace → Usage.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export const askHealthAI = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      question: z.string().min(1).max(2000),
      records: z.array(z.object({ file_name: z.string(), data: z.any().nullable() })).max(20),
      eli5: z.boolean().optional(),
      language: z.string().min(2).max(8).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const context = data.records
      .map((r, i) => `Record ${i + 1} (${r.file_name}):\n${JSON.stringify(r.data ?? {}, null, 2)}`)
      .join("\n\n");
    const system = [
      "You are an AI health assistant analyzing a patient's anonymized medical records.",
      "Give clear, accurate, evidence-based answers grounded ONLY in the records below.",
      "If the records do not contain the answer, say so plainly.",
      "Never invent values. Cite specific labs/medications when relevant.",
      data.eli5
        ? "Explain like the patient is 5: short, friendly, no jargon, simple analogies."
        : "Use a professional, calm tone suitable for an informed patient.",
      data.language && data.language !== "en"
        ? `Reply in language code: ${data.language}.`
        : "Reply in English.",
      "",
      "PATIENT RECORDS:",
      context || "(no records selected)",
    ].join("\n");

    const result = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: data.question },
      ],
    });
    const reply: string = result?.choices?.[0]?.message?.content ?? "(no reply)";
    return { reply };
  });

export const analyzeReport = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fileName: z.string().min(1).max(300),
      mimeType: z.string().min(1).max(120),
      // base64-encoded file contents (without data: prefix); capped to ~6MB
      base64: z.string().min(1).max(8_500_000),
    }),
  )
  .handler(async ({ data }) => {
    const isPdf = data.mimeType.includes("pdf");
    const isImage = data.mimeType.startsWith("image/");
    const isText = data.mimeType.startsWith("text/") || /json|xml|csv/.test(data.mimeType);

    const userContent: any[] = [
      {
        type: "text",
        text:
          `Extract structured medical data from the attached file "${data.fileName}". ` +
          `Anonymize all PII (remove names, addresses, IDs, dates of birth). ` +
          `Return ONLY a JSON object via the provided tool. If a field is unknown, omit it. ` +
          `Estimate a quality_score 0-100 based on completeness and clarity.`,
      },
    ];

    if (isImage || isPdf) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${data.mimeType};base64,${data.base64}` },
      });
    } else if (isText) {
      const decoded = Buffer.from(data.base64, "base64").toString("utf8").slice(0, 30_000);
      userContent.push({ type: "text", text: `\n\nFILE CONTENTS:\n${decoded}` });
    } else {
      userContent.push({
        type: "text",
        text: `\n\n(Binary file type ${data.mimeType} — infer plausible structure from the filename only.)`,
      });
    }

    const tool = {
      type: "function",
      function: {
        name: "save_medical_record",
        description: "Persist extracted, anonymized medical record data.",
        parameters: {
          type: "object",
          properties: {
            conditions: { type: "array", items: { type: "string" } },
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dosage: { type: "string" },
                  frequency: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
            lab_results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test: { type: "string" },
                  value: { type: "string" },
                  unit: { type: "string" },
                  reference_range: { type: "string" },
                },
                required: ["test", "value"],
                additionalProperties: false,
              },
            },
            diagnoses: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
            quality_score: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["quality_score"],
          additionalProperties: false,
        },
      },
    };

    const result = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical data extraction assistant. Output structured, anonymized data only via the tool. Never include real names, addresses, or identifiers.",
        },
        { role: "user", content: userContent },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "save_medical_record" } },
    });

    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      throw new Error("AI did not return structured data");
    }
    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch {
      throw new Error("AI returned malformed JSON");
    }
    return {
      data: parsed,
      quality_score: Math.round(Number(parsed.quality_score) || 75),
    };
  });

export const explainTerm = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      term: z.string().min(1).max(120),
      type: z.enum(["medicine", "disease"]),
    }),
  )
  .handler(async ({ data }) => {
    const tool = {
      type: "function",
      function: {
        name: "explain",
        description: "Patient-friendly explanation of a medical term.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["medicine", "disease"] },
            summary: { type: "string", description: "Two-sentence plain English explanation." },
            keyFact: { type: "string", description: "One important clinical fact." },
            bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2, description: "For medicine: common uses. For disease: symptoms." },
            watchout: { type: "string", description: "For medicine: a notable side effect. For disease: a management tip." },
          },
          required: ["type", "summary", "keyFact", "bullets", "watchout"],
          additionalProperties: false,
        },
      },
    };
    try {
      const result = await callAI({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a medical explainer for patients. Always use simple, warm language. Never give diagnosis or dosing instructions." },
          { role: "user", content: `Explain "${data.term}" for a patient in simple English. Type: ${data.type}.` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "explain" } },
      });
      const call = result?.choices?.[0]?.message?.tool_calls?.[0];
      if (call?.function?.arguments) {
        return JSON.parse(call.function.arguments);
      }
    } catch {
      /* fall through to OpenFDA */
    }
    if (data.type === "medicine") {
      try {
        const r = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(data.term)}&limit=1`,
        );
        const j: any = await r.json();
        const rec = j?.results?.[0];
        if (rec) {
          return {
            type: "medicine",
            summary: (rec.purpose?.[0] || rec.description?.[0] || "Prescription medication.").slice(0, 280),
            keyFact: (rec.indications_and_usage?.[0] || "Use only as directed by a clinician.").slice(0, 200),
            bullets: [
              (rec.indications_and_usage?.[0] || "See prescribing information").slice(0, 80),
              (rec.dosage_and_administration?.[0] || "Follow your prescription").slice(0, 80),
            ],
            watchout: (rec.warnings?.[0] || rec.adverse_reactions?.[0] || "Discuss side effects with your doctor.").slice(0, 200),
          };
        }
      } catch {
        /* ignore */
      }
    }
    return {
      type: data.type,
      summary: `Information about ${data.term} is currently unavailable.`,
      keyFact: "Please consult a qualified clinician for personalised advice.",
      bullets: ["No data available", "Try again later"],
      watchout: "This is not medical advice.",
    };
  });

export const checkInteractions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      medications: z.array(z.string().min(1).max(120)).min(2).max(15),
    }),
  )
  .handler(async ({ data }) => {
    const tool = {
      type: "function",
      function: {
        name: "report_interactions",
        description: "Report clinically significant drug-drug interactions.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "One-sentence overall risk summary." },
            interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drugA: { type: "string" },
                  drugB: { type: "string" },
                  severity: { type: "string", enum: ["minor", "moderate", "major"] },
                  mechanism: { type: "string", description: "Short plain-English mechanism." },
                  effect: { type: "string", description: "Likely clinical effect on the patient." },
                  recommendation: { type: "string", description: "What the patient should do." },
                },
                required: ["drugA", "drugB", "severity", "effect", "recommendation"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "interactions"],
          additionalProperties: false,
        },
      },
    };
    const result = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical pharmacology assistant. Identify ONLY clinically significant interactions between the provided medications. Be accurate; if no significant interaction exists, return an empty interactions array. Never invent drugs.",
        },
        {
          role: "user",
          content: `Check interactions between: ${data.medications.join(", ")}.`,
        },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "report_interactions" } },
    });
    const call = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      throw new Error("AI did not return structured data");
    }
    try {
      return JSON.parse(call.function.arguments);
    } catch {
      throw new Error("AI returned malformed JSON");
    }
  });