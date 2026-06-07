import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Pill, Plus, X, AlertTriangle, ShieldCheck, Share2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { checkInteractions } from "@/lib/ai.functions";
import { MedicalTerm } from "@/components/MedicalTerm";

export const Route = createFileRoute("/_authenticated/patient/interactions")({ component: Interactions });

interface Interaction {
  drugA: string;
  drugB: string;
  severity: "minor" | "moderate" | "major";
  mechanism?: string;
  effect: string;
  recommendation: string;
}

function Interactions() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [vaultMeds, setVaultMeds] = useState<string[]>([]);
  const [result, setResult] = useState<{ summary: string; interactions: Interaction[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("health_records")
      .select("anonymized_json")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .then(({ data }) => {
        const set = new Set<string>();
        for (const r of data || []) {
          const ms = (r as any).anonymized_json?.medications;
          if (Array.isArray(ms)) for (const m of ms) if (m?.name) set.add(String(m.name));
        }
        setVaultMeds(Array.from(set));
      });
  }, [user]);

  const add = (name: string) => {
    const n = name.trim();
    if (!n) return;
    if (meds.some((m) => m.toLowerCase() === n.toLowerCase())) return;
    setMeds([...meds, n]);
    setInput("");
    setResult(null);
  };

  const remove = (m: string) => {
    setMeds(meds.filter((x) => x !== m));
    setResult(null);
  };

  const run = async () => {
    if (meds.length < 2) {
      toast.error("Add at least 2 medications");
      return;
    }
    setLoading(true);
    try {
      const r = await checkInteractions({ data: { medications: meds } });
      setResult(r as any);
    } catch (e: any) {
      toast.error(e?.message || "Could not check interactions");
    } finally {
      setLoading(false);
    }
  };

  const share = () => {
    if (!result) return;
    const text = [
      `Medication interaction report (${new Date().toLocaleDateString()})`,
      `Medications: ${meds.join(", ")}`,
      ``,
      `Summary: ${result.summary}`,
      ``,
      ...result.interactions.map(
        (i, idx) =>
          `${idx + 1}. [${i.severity.toUpperCase()}] ${i.drugA} + ${i.drugB}\n   Effect: ${i.effect}\n   Recommendation: ${i.recommendation}`,
      ),
      ``,
      `Not medical advice. Discuss with your doctor.`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Report copied — paste to share with your doctor");
  };

  const suggestions = useMemo(
    () => vaultMeds.filter((v) => !meds.some((m) => m.toLowerCase() === v.toLowerCase())).slice(0, 8),
    [vaultMeds, meds],
  );

  const counts = useMemo(() => {
    const c = { minor: 0, moderate: 0, major: 0 };
    for (const i of result?.interactions || []) c[i.severity]++;
    return c;
  }, [result]);

  return (
    <>
      <PageHeader
        title="Medicine Interaction Checker"
        subtitle="See how your medications interact — powered by AI"
        right={
          result && (
            <button onClick={share} className="text-sm px-3 py-2 rounded-lg btn-gradient inline-flex items-center gap-1.5">
              <Share2 className="w-4 h-4" /> Share with Doctor
            </button>
          )
        }
      />

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-4 min-h-[44px]">
          <AnimatePresence>
            {meds.map((m) => (
              <motion.span
                key={m}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/40 text-sm text-accent"
              >
                <Pill className="w-3.5 h-3.5" />
                <MedicalTerm term={m} type="medicine">{m}</MedicalTerm>
                <button onClick={() => remove(m)} className="ml-1 hover:text-foreground" aria-label={`Remove ${m}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {meds.length === 0 && (
            <div className="text-sm text-muted-foreground">Add at least 2 medications to check interactions.</div>
          )}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); add(input); }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a medication name (e.g. Metformin)"
            className="flex-1 rounded-lg bg-muted border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
          <button type="submit" className="px-4 py-2.5 rounded-lg border border-border hover:border-accent inline-flex items-center justify-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
          <button
            type="button"
            onClick={run}
            disabled={meds.length < 2 || loading}
            className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Sparkles className="w-4 h-4" /> Check</>}
          </button>
        </form>
        {suggestions.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">From your vault</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => add(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-accent inline-flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {[0, 1, 2].map((i) => <div key={i} className="glass-card rounded-xl h-28 animate-pulse" />)}
        </div>
      )}

      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <SeverityStat label="Major" count={counts.major} color="#FF5252" Icon={AlertTriangle} />
            <SeverityStat label="Moderate" count={counts.moderate} color="#FFB020" Icon={AlertTriangle} />
            <SeverityStat label="Minor" count={counts.minor} color="var(--success)" Icon={ShieldCheck} />
          </div>

          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">AI summary</div>
            <div className="text-base">{result.summary}</div>
          </div>

          {result.interactions.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <ShieldCheck className="w-10 h-10 text-[color:var(--success)] mx-auto mb-3" />
              <div className="font-medium">No significant interactions found</div>
              <div className="text-sm text-muted-foreground mt-1">Always confirm with your pharmacist or doctor.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {result.interactions.map((i, idx) => (
                <motion.div
                  key={`${i.drugA}-${i.drugB}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card rounded-xl p-5"
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MedicalTerm term={i.drugA} type="medicine">{i.drugA}</MedicalTerm>
                      <span className="text-muted-foreground">+</span>
                      <MedicalTerm term={i.drugB} type="medicine">{i.drugB}</MedicalTerm>
                    </div>
                    <SeverityBadge severity={i.severity} />
                  </div>
                  {i.mechanism && (
                    <Row label="Mechanism" value={i.mechanism} />
                  )}
                  <Row label="Effect" value={i.effect} />
                  <Row label="Recommendation" value={i.recommendation} highlight />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div className="text-xs text-muted-foreground text-center mt-8">
        Information is AI-generated and may be incomplete. Not a substitute for professional medical advice.
      </div>
    </>
  );
}

function SeverityStat({ label, count, color, Icon }: { label: string; count: number; color: string; Icon: any }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{count}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "minor" | "moderate" | "major" }) {
  const map = {
    major: { color: "#FF5252", label: "Major" },
    moderate: { color: "#FFB020", label: "Moderate" },
    minor: { color: "var(--success)", label: "Minor" },
  } as const;
  const m = map[severity];
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full border font-medium"
      style={{ color: m.color, borderColor: m.color, background: `color-mix(in oklab, ${m.color} 12%, transparent)` }}
    >
      {m.label}
    </span>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>{value}</div>
    </div>
  );
}