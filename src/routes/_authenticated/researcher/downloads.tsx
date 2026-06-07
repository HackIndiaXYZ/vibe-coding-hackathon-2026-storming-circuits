import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Download, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/researcher/downloads")({ component: Downloads });

const MOCK_DATA = [
  { resourceType: "Bundle", patientId: "anon_7f3a9c", demographics: { ageRange: "45-50", geography: "South Asia" }, conditions: ["Type 2 Diabetes", "Hypertension"], labResults: [{ test: "HbA1c", value: 7.2, unit: "%" }], qualityScore: 87 },
  { resourceType: "Bundle", patientId: "anon_3b2e8d", demographics: { ageRange: "50-55", geography: "South Asia" }, conditions: ["Type 2 Diabetes"], labResults: [{ test: "HbA1c", value: 6.8, unit: "%" }, { test: "LDL", value: 130, unit: "mg/dL" }], qualityScore: 92 },
  { resourceType: "Bundle", patientId: "anon_f12a55", demographics: { ageRange: "40-45", geography: "Global" }, conditions: ["Type 2 Diabetes", "Obesity"], labResults: [{ test: "HbA1c", value: 8.1, unit: "%" }], qualityScore: 79 },
];

function Downloads() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("*").eq("researcher_id", user.id).in("status", ["FILLED", "SETTLED", "OPEN"]).then(({ data }) => {
      setRows(data || []); setLoading(false);
    });
  }, [user]);

  const download = (camp: any) => {
    const blob = new Blob([JSON.stringify(MOCK_DATA, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${camp.name.replace(/\s+/g, "_")}_dataset.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Dataset downloaded");
  };

  return (
    <>
      <PageHeader title="Secure Data Downloads" subtitle="FHIR R4 JSON exports for completed campaigns" />
      {loading ? <div className="glass-card h-40 rounded-2xl animate-pulse" /> : rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground"><Database className="w-12 h-12 text-accent mx-auto mb-3" />No campaigns ready for download yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-6">
              <div className="font-semibold text-lg">{c.name}</div>
              <div className="text-sm text-muted-foreground mb-4">{c.condition} · {c.geography}</div>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between"><span className="text-muted-foreground">Records ready</span><span className="font-semibold">{c.consented_count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span>FHIR R4 JSON</span></div>
                <div className="flex items-center gap-1.5 text-[color:var(--success)]"><ShieldCheck className="w-4 h-4" /> Anonymization verified</div>
              </div>
              <button onClick={() => download(c)} className="w-full btn-gradient rounded-lg py-2.5 font-medium inline-flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download dataset</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
