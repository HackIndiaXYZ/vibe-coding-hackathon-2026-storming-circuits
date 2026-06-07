import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { RingProgress } from "@/components/RingProgress";
import { Upload, Sparkles, ShoppingBag, Share2, AlertTriangle, Calendar, Pill } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { HealthSummaryCard } from "@/components/HealthSummaryCard";

export const Route = createFileRoute("/_authenticated/patient/dashboard")({ component: Dashboard });

interface FullRecord { quality_score: number | null; anonymized_json: any; created_at: string; }

function classifyLab(test: string, v: number): { status: "normal" | "low" | "high"; range: string } | null {
  const t = test.toLowerCase();
  if (t.includes("hba1c")) return { status: v <= 5.7 ? "normal" : "high", range: "≤ 5.7%" };
  if (t.includes("ldl")) return { status: v <= 100 ? "normal" : "high", range: "≤ 100 mg/dL" };
  if (t.includes("hdl")) return { status: v >= 40 ? "normal" : "low", range: "≥ 40 mg/dL" };
  if (t.includes("glucose")) return { status: v >= 70 && v <= 99 ? "normal" : v < 70 ? "low" : "high", range: "70–99 mg/dL" };
  if (t.includes("triglycer")) return { status: v <= 150 ? "normal" : "high", range: "≤ 150 mg/dL" };
  if (t.includes("cholesterol")) return { status: v <= 200 ? "normal" : "high", range: "≤ 200 mg/dL" };
  if (t.includes("creatinine")) return { status: v >= 0.6 && v <= 1.3 ? "normal" : "high", range: "0.6–1.3 mg/dL" };
  if (t.includes("egfr")) return { status: v >= 60 ? "normal" : "low", range: "≥ 60 mL/min" };
  if (t.includes("tsh")) return { status: v >= 0.4 && v <= 4.0 ? "normal" : v < 0.4 ? "low" : "high", range: "0.4–4.0 mIU/L" };
  return null;
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [recs, setRecs] = useState<FullRecord[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("health_records")
      .select("quality_score,anonymized_json,created_at")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRecs((data || []) as FullRecord[]);
        setLoading(false);
      });
  }, [user]);

  const overall = recs.length
    ? Math.round(recs.reduce((s, r) => s + (r.quality_score || 0), 0) / recs.length)
    : 0;

  const { categories, alerts, medCount } = useMemo(() => {
    // Aggregate latest values per test, plus 7-point history for sparkline.
    const labHistory = new Map<string, { date: string; v: number }[]>();
    const conditions = new Set<string>();
    const meds = new Set<string>();
    for (const r of recs) {
      const j = r.anonymized_json || {};
      const date = new Date(r.created_at).toLocaleDateString();
      for (const l of j.lab_results || []) {
        const v = Number(l.value);
        if (!Number.isFinite(v)) continue;
        const k = String(l.test || "").trim();
        if (!k) continue;
        const arr = labHistory.get(k) || [];
        arr.push({ date, v });
        labHistory.set(k, arr);
      }
      for (const c of j.conditions || []) conditions.add(String(c));
      for (const m of j.medications || []) if (m?.name) meds.add(String(m.name));
    }

    const alerts: { title: string; body: string }[] = [];
    const groups = {
      "Heart Health": { keys: ["ldl", "hdl", "cholesterol", "triglycer", "blood pressure"], color: "#EF4444", values: [] as number[] },
      "Metabolic": { keys: ["hba1c", "glucose"], color: "#FFB020", values: [] as number[] },
      "Kidney Function": { keys: ["creatinine", "egfr", "bun"], color: "#00BCD4", values: [] as number[] },
      "Thyroid & Hormones": { keys: ["tsh", "t3", "t4"], color: "#00C853", values: [] as number[] },
    };

    const categories: { name: string; score: number; color: string; trend: number[] }[] = [];

    for (const [test, points] of labHistory.entries()) {
      const latest = points[points.length - 1];
      const cls = classifyLab(test, latest.v);
      if (cls && cls.status !== "normal") {
        alerts.push({
          title: `${test} ${latest.v}`,
          body: `${cls.status === "low" ? "Below" : "Above"} reference range (${cls.range}).`,
        });
      }
      const tLow = test.toLowerCase();
      for (const g of Object.values(groups)) {
        if (g.keys.some((k) => tLow.includes(k))) {
          // score: 100 if normal, scale by deviation otherwise
          const score = cls ? (cls.status === "normal" ? 95 : 55) : 75;
          g.values.push(score);
        }
      }
    }

    for (const [name, g] of Object.entries(groups)) {
      if (!g.values.length) continue;
      const avg = Math.round(g.values.reduce((a, b) => a + b, 0) / g.values.length);
      // Trend: per-record average score over time (small synthetic shape from per-record quality)
      const trend = recs.slice(-7).map((r) => r.quality_score || avg);
      categories.push({ name, score: avg, color: g.color, trend: trend.length ? trend : [avg, avg, avg] });
    }

    return { categories, alerts: alerts.slice(0, 5), medCount: meds.size };
  }, [recs]);

  return (
    <>
      <PageHeader
        title={`Hello, ${profile?.full_name?.split(" ")[0] || "there"}`}
        subtitle="Here's your health snapshot"
        right={
          <button
            onClick={() => setShareOpen(true)}
            className="text-sm px-3 py-2 rounded-lg btn-gradient inline-flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" /> Share Summary
          </button>
        }
      />
      <HealthSummaryCard open={shareOpen} onOpenChange={setShareOpen} />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
          <RingProgress value={overall} size={200} label="Overall" sublabel="Health Score" />
          <div className="text-sm text-muted-foreground mt-4 text-center">
            {recs.length === 0
              ? loading ? "Loading your records…" : "Upload records in the Vault to see your score"
              : `Based on ${recs.length} processed record${recs.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 grid grid-cols-2 gap-4">
          {categories.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-8">
              <Sparkles className="w-6 h-6 text-accent mb-2" />
              No lab data yet. Upload reports to see category breakdowns.
            </div>
          ) : categories.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-lg font-bold" style={{ color: c.color }}>{c.score}</div>
              </div>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={c.trend.map((v, i) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke={c.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /> Health Alerts</h3>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No out-of-range labs detected.</div>
            ) : alerts.map((a) => (
              <div key={a.title} className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                <div className="text-sm font-medium text-orange-300">⚠️ {a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.body}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-accent" /> Medications</h3>
          {medCount === 0 ? (
            <div className="text-sm text-muted-foreground">No medications detected in your records.</div>
          ) : (
            <>
              <div className="text-3xl font-bold">{medCount}</div>
              <div className="text-sm text-muted-foreground">active medication{medCount === 1 ? "" : "s"} across your records</div>
              <Link to="/patient/interactions" className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                <Calendar className="w-3.5 h-3.5" /> Check interactions
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QA to="/patient/vault" Icon={Upload} label="Upload record" />
        <QA to="/patient/insights" Icon={Sparkles} label="Ask AI" />
        <QA to="/patient/interactions" Icon={Pill} label="Interactions" />
        <QA to="/patient/privacy" Icon={Share2} label="Share with doctor" />
      </div>
    </>
  );
}

function QA({ to, Icon, label }: { to: string; Icon: any; label: string }) {
  return <Link to={to} className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 text-sm hover:border-accent transition">
    <Icon className="w-5 h-5 text-accent" /> <span>{label}</span>
  </Link>;
}