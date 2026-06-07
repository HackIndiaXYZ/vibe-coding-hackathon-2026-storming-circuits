import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { Upload, FileText, CheckCircle2, Loader2, Search, Trash2, Share2, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { analyzeReport } from "@/lib/ai.functions";
import { MedicalTerm } from "@/components/MedicalTerm";
import { LabSparkline, buildLabHistory } from "@/components/LabSparkline";

export const Route = createFileRoute("/_authenticated/patient/vault")({ component: Vault });

interface Record { id: string; file_name: string; status: string; quality_score: number | null; created_at: string; anonymized_json: any; }

const CATEGORIES = ["All", "Labs", "Imaging", "Prescriptions", "Notes"] as const;
type Cat = typeof CATEGORIES[number];

function inferCategory(name: string): Exclude<Cat, "All"> {
  const n = name.toLowerCase();
  if (/lab|hba1c|panel|blood|cbc|lipid/.test(n)) return "Labs";
  if (/x-?ray|mri|ct|scan|ultrasound|imag/.test(n)) return "Imaging";
  if (/rx|prescrip|med/.test(n)) return "Prescriptions";
  return "Notes";
}

function Vault() {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState(0);
  const [drawerRec, setDrawerRec] = useState<Record | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: recs }, { data: tx }] = await Promise.all([
      supabase.from("health_records").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("token_transactions").select("amount,type").eq("user_id", user.id),
    ]);
    setRecords((recs || []) as Record[]);
    setEarned((tx || []).filter((t: any) => t.type === "earned").reduce((s: number, t: any) => s + Number(t.amount), 0));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !user) return;
    for (const f of Array.from(files)) {
      if (f.size > 6 * 1024 * 1024) { toast.error(`${f.name} exceeds 6MB limit`); continue; }
      const { data, error } = await supabase.from("health_records").insert({
        user_id: user.id, file_name: f.name, status: "processing", quality_score: 0,
      }).select().single();
      if (error) { toast.error(error.message); continue; }
      toast.success(`Analyzing ${f.name} with AI…`);
      setRecords((r) => [data as Record, ...r]);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] || "");
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        const ai = await analyzeReport({
          data: { fileName: f.name, mimeType: f.type || "application/octet-stream", base64 },
        });
        await supabase.from("health_records").update({
          status: "ready",
          anonymized_json: ai.data,
          quality_score: ai.quality_score,
        }).eq("id", data.id);
        toast.success(`${f.name} analyzed`);
      } catch (e: any) {
        await supabase.from("health_records").update({
          status: "failed",
          anonymized_json: { error: e?.message || "AI analysis failed" },
          quality_score: 0,
        }).eq("id", data.id);
        toast.error(`${f.name}: ${e?.message || "AI analysis failed"}`);
      }
      load();
    }
  };

  const ready = records.filter((r) => r.status === "ready").length;
  const avgQ = ready ? Math.round(records.filter((r) => r.status === "ready").reduce((s, r) => s + (r.quality_score || 0), 0) / ready) : 0;

  const labHistory = useMemo(
    () => buildLabHistory(
      records
        .filter((r) => r.status === "ready" && r.anonymized_json)
        .map((r) => ({ created_at: r.created_at, anonymized_json: r.anonymized_json })),
    ).filter((s) => s.points.length >= 1).slice(0, 6),
    [records],
  );

  const filtered = useMemo(() => records.filter((r) => {
    const matchCat = cat === "All" || inferCategory(r.file_name) === cat;
    const matchSearch = !search || r.file_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [records, cat, search]);

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const removeOne = async (id: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    await supabase.from("health_records").delete().eq("id", id);
    toast.success("Record deleted");
    load();
  };

  const removeSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} record(s)?`)) return;
    await supabase.from("health_records").delete().in("id", Array.from(selected));
    setSelected(new Set());
    toast.success("Records deleted");
    load();
  };

  const shareOne = (r: Record) => {
    const link = `${window.location.origin}/share/${r.id.slice(0, 8)}`;
    navigator.clipboard.writeText(link);
    toast.success("Shareable link copied (24h)");
  };

  return (
    <>
      <PageHeader title="My Health Vault" subtitle="Upload and manage your medical documents" right={
        selected.size > 0 ? (
          <button onClick={removeSelected} className="text-sm px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 inline-flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> Delete {selected.size}
          </button>
        ) : null
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total records" value={records.length} />
        <StatCard label="Ready" value={ready} accent="success" />
        <StatCard label="Avg quality" value={`${avgQ}/100`} accent="cyan" />
        <StatCard label="HLTH earned" value={earned} accent="primary" />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        onClick={() => fileInput.current?.click()}
        className="glass-card rounded-2xl border-2 border-dashed border-border hover:border-accent cursor-pointer p-10 text-center transition mb-6">
        <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
        <div className="font-medium">Drop PDFs, lab reports, or prescriptions here</div>
        <div className="text-sm text-muted-foreground mt-1">Batch upload supported · or click to browse</div>
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records…" className="w-full rounded-lg bg-muted border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition ${cat === c ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card rounded-xl h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {records.length === 0 ? "No records yet — upload your first document above." : "No records match your filters."}
        </div>
      ) : (
        <>
        {labHistory.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Lab trends</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {labHistory.map((s) => (
                <LabSparkline key={s.test} test={s.test} history={s.points} unit={s.unit} />
              ))}
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className={`glass-card rounded-xl p-5 transition ${selected.has(r.id) ? "ring-2 ring-accent" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-[color:var(--cyan-accent)] w-4 h-4" />
                  <FileText className="w-7 h-7 text-accent shrink-0" />
                </div>
                {r.status === "ready" ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success/10 text-[color:var(--success)] border border-[color:var(--success)]/30"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                ) : r.status === "failed" ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30">Failed</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30"><Loader2 className="w-3 h-3 animate-spin" /> Processing</span>
                )}
              </div>
              <div className="font-medium truncate">{r.file_name}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                <span className="px-1.5 py-0.5 rounded bg-muted border border-border">{inferCategory(r.file_name)}</span>
              </div>
              {r.status === "ready" && (
                <>
                  <div className="text-xs text-muted-foreground mt-3">Quality score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full btn-gradient" style={{ width: `${r.quality_score}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{r.quality_score}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setDrawerRec(r)} className="flex-1 text-sm rounded-lg btn-gradient py-2 font-medium">View</button>
                    <button onClick={() => shareOne(r)} title="Share" className="p-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-foreground"><Share2 className="w-4 h-4" /></button>
                    <button onClick={() => removeOne(r.id)} title="Delete" className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      <Sheet open={!!drawerRec} onOpenChange={(o) => !o && setDrawerRec(null)}>
        <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{drawerRec?.file_name}</SheetTitle></SheetHeader>
          {drawerRec?.anonymized_json && (
            <Tabs defaultValue="insights" className="mt-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="fhir"><Code2 className="w-3.5 h-3.5 mr-1" />FHIR R4</TabsTrigger>
              </TabsList>
              <TabsContent value="insights"><InsightView data={drawerRec.anonymized_json} /></TabsContent>
              <TabsContent value="fhir">
                <pre className="mt-4 text-xs bg-muted/60 border border-border rounded-lg p-3 overflow-x-auto max-h-[60vh]">
{JSON.stringify({ resourceType: "Bundle", type: "collection", entry: [{ resource: { resourceType: "Patient", id: "anon" } }, ...((drawerRec.anonymized_json.lab_results || []).map((l: any, i: number) => ({ resource: { resourceType: "Observation", id: `obs-${i}`, code: { text: l.test }, valueQuantity: { value: Number(l.value), unit: l.unit } } })))] }, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function InsightView({ data }: { data: any }) {
  return (
    <div className="mt-4 space-y-6">
      {data.conditions && (
        <Section title="Conditions">
          <div className="flex flex-wrap gap-2">
            {data.conditions.map((c: string) => (
              <span key={c} className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/30 text-sm">
                <MedicalTerm term={c} type="disease">{c}</MedicalTerm>
              </span>
            ))}
          </div>
        </Section>
      )}
      {data.medications && (
        <Section title="Medications">
          <div className="space-y-2">
            {data.medications.map((m: any) => (
              <div key={m.name} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="font-medium"><MedicalTerm term={m.name} type="medicine">{m.name}</MedicalTerm></div>
                <div className="text-sm text-muted-foreground">{m.dosage} · {m.frequency}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.lab_results && (
        <Section title="Lab results">
          <div className="space-y-2">
            {data.lab_results.map((l: any) => (
              <div key={l.test} className="rounded-lg border border-border bg-muted/40 p-3 flex items-center justify-between">
                <div><div className="font-medium">{l.test}</div><div className="text-xs text-muted-foreground">Range {l.reference_range}</div></div>
                <div className="text-lg font-semibold text-[color:var(--cyan-accent)]">{l.value} <span className="text-xs text-muted-foreground">{l.unit}</span></div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.diagnoses && (
        <Section title="Diagnoses">
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            {data.diagnoses.map((d: string) => (
              <li key={d}><MedicalTerm term={d.replace(/^[A-Z0-9.]+\s*-\s*/, "")} type="disease">{d}</MedicalTerm></li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>{children}</div>;
}
