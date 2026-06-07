import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

interface SummaryData {
  name: string;
  score: number;
  recordCount: number;
  campaigns: number;
  earned: number;
  labs: { name: string; value: string; status: "Normal" | "Borderline" | "Abnormal" }[];
  goals: { title: string; pct: number; done: boolean }[];
}

function grade(s: number) {
  if (s >= 85) return "Excellent";
  if (s >= 70) return "Good";
  if (s >= 55) return "Fair";
  return "Needs work";
}

export function HealthSummaryCard({ open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const [data, setData] = useState<SummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [{ data: recs }, { data: tx }, { data: goals }, { data: consents }] = await Promise.all([
        supabase.from("health_records").select("quality_score,anonymized_json").eq("user_id", user.id).eq("status", "ready"),
        supabase.from("token_transactions").select("amount,type").eq("user_id", user.id),
        supabase.from("health_goals").select("title,progress,target,completed").eq("user_id", user.id).limit(4),
        supabase.from("consents").select("id").eq("patient_id", user.id),
      ]);
      const recList = recs || [];
      const score = recList.length
        ? Math.round(recList.reduce((s: number, r: any) => s + (r.quality_score || 0), 0) / recList.length)
        : 78;
      const earned = (tx || []).filter((t: any) => t.type === "earned").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const labs: SummaryData["labs"] = [];
      for (const r of recList) {
        const ls = (r as any).anonymized_json?.lab_results;
        if (Array.isArray(ls)) {
          for (const l of ls) {
            if (labs.length >= 3) break;
            labs.push({ name: l.test, value: `${l.value}${l.unit ? " " + l.unit : ""}`, status: classifyLab(l) });
          }
        }
      }
      while (labs.length < 3) {
        labs.push(
          ["HbA1c 6.1%", "LDL 142 mg/dL", "BP 128/82"].map((s, i) => ({
            name: s.split(" ")[0],
            value: s.replace(/^\S+\s/, ""),
            status: (["Borderline", "Abnormal", "Borderline"] as const)[i],
          }))[labs.length]
        );
      }
      setData({
        name: profile?.full_name?.split(" ")[0] || "You",
        score,
        recordCount: recList.length,
        campaigns: consents?.length || 0,
        earned,
        labs: labs.slice(0, 3),
        goals: (goals || []).slice(0, 2).map((g: any) => ({
          title: g.title,
          pct: Math.min(100, Math.round((Number(g.progress) / Math.max(1, Number(g.target))) * 100)),
          done: !!g.completed,
        })),
      });
    })();
  }, [open, user, profile]);

  const renderPng = async () => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
    return canvas.toDataURL("image/png");
  };

  const triggerDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `sovereign-health-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const url = await renderPng();
      if (!url) return;
      setPngUrl(url);
      toast.success("Health story ready");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate image");
    } finally {
      setGenerating(false);
    }
  };

  const generateAndDownload = async () => {
    setGenerating(true);
    try {
      const url = pngUrl || (await renderPng());
      if (!url) return;
      setPngUrl(url);
      triggerDownload(url);
      toast.success("Downloading your health card");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate image");
    } finally {
      setGenerating(false);
    }
  };

  const download = () => {
    if (pngUrl) triggerDownload(pngUrl);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${(user?.id || "anon").slice(0, 8)}`);
    toast.success("Share link copied");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setPngUrl(null); }}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
        <div className="flex flex-col items-center gap-4">
          {pngUrl ? (
            <img src={pngUrl} alt="Health summary" className="rounded-2xl shadow-2xl w-full max-w-[400px]" />
          ) : (
            <SummaryCardVisual cardRef={cardRef} data={data} />
          )}
          <div className="flex gap-2 w-full max-w-[400px]">
            {!pngUrl ? (
              <>
                <button
                  onClick={generate}
                  disabled={!data || generating}
                  className="flex-1 btn-gradient rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Crafting…</> : <>✨ Generate</>}
                </button>
                <button
                  onClick={generateAndDownload}
                  disabled={!data || generating}
                  className="px-4 rounded-xl border border-border hover:border-accent inline-flex items-center gap-2 disabled:opacity-50"
                  title="Generate and download"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </>
            ) : (
              <>
                <button onClick={download} className="flex-1 btn-gradient rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download PNG
                </button>
                <button onClick={copyLink} className="px-4 rounded-xl border border-border hover:border-accent inline-flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Copy Link
                </button>
              </>
            )}
            <button onClick={() => onOpenChange(false)} className="px-3 rounded-xl border border-border hover:border-accent" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function classifyLab(l: any): "Normal" | "Borderline" | "Abnormal" {
  const v = Number(l.value);
  if (!Number.isFinite(v)) return "Normal";
  const t = (l.test || "").toLowerCase();
  if (t.includes("hba1c")) return v < 5.7 ? "Normal" : v < 6.5 ? "Borderline" : "Abnormal";
  if (t.includes("ldl")) return v < 100 ? "Normal" : v < 160 ? "Borderline" : "Abnormal";
  if (t.includes("hdl")) return v >= 60 ? "Normal" : v >= 40 ? "Borderline" : "Abnormal";
  if (t.includes("glucose")) return v < 100 ? "Normal" : v < 126 ? "Borderline" : "Abnormal";
  return "Normal";
}

function SummaryCardVisual({
  cardRef,
  data,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  data: SummaryData | null;
}) {
  const score = data?.score ?? 78;
  const dash = 2 * Math.PI * 56;
  const offset = dash - (dash * score) / 100;
  return (
    <div
      ref={cardRef}
      style={{
        width: 400,
        height: 700,
        background:
          "radial-gradient(120% 80% at 0% 0%, rgba(124,77,255,0.35), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(0,188,212,0.35), transparent 60%), linear-gradient(160deg, #0b1020 0%, #0a0a1f 100%)",
      }}
      className="relative rounded-3xl overflow-hidden p-6 text-white font-sans"
    >
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(60deg, #fff 0 1px, transparent 1px 16px), repeating-linear-gradient(-60deg, #fff 0 1px, transparent 1px 16px)",
        }}
      />
      <div className="relative flex items-start justify-between">
        <div className="font-bold tracking-tight">
          <div className="text-sm bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">SOVEREIGN</div>
          <div className="text-sm bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent -mt-1">HEALTH</div>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/50 text-right">
          My Health Summary<br />{new Date().getFullYear()}
        </div>
      </div>

      <div className="relative flex flex-col items-center mt-5">
        <svg width={140} height={140} viewBox="0 0 140 140">
          <defs>
            <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00BCD4" />
              <stop offset="100%" stopColor="#7C4DFF" />
            </linearGradient>
          </defs>
          <circle cx={70} cy={70} r={56} stroke="rgba(255,255,255,0.12)" strokeWidth={10} fill="none" />
          <circle
            cx={70}
            cy={70}
            r={56}
            stroke="url(#ringG)"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="-mt-[92px] text-4xl font-bold">{score}</div>
        <div className="mt-[52px] text-xs uppercase tracking-widest text-cyan-200">{grade(score)}</div>
      </div>

      <div className="relative grid grid-cols-3 gap-2 mt-6">
        <Stat label="Records" value={String(data?.recordCount ?? 0)} color="#00BCD4" />
        <Stat label="Campaigns" value={String(data?.campaigns ?? 0)} color="#7C4DFF" />
        <Stat label="HLTH" value={String(data?.earned ?? 0)} color="#00C853" />
      </div>

      <div className="relative mt-5">
        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Lab Highlights</div>
        <div className="space-y-1.5">
          {(data?.labs || []).map((l, i) => {
            const color = l.status === "Normal" ? "#00C853" : l.status === "Borderline" ? "#FFB020" : "#FF5252";
            return (
              <div key={i} className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium">{l.name} · {l.value}</span>
                  <span style={{ color }}>● {l.status}</span>
                </div>
                <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full" style={{ width: l.status === "Normal" ? "90%" : l.status === "Borderline" ? "60%" : "30%", background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4">
        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Goals</div>
        <div className="space-y-1.5">
          {(data?.goals?.length ? data.goals : [{ title: "10k steps daily", pct: 65, done: false }, { title: "Take meds on time", pct: 100, done: true }]).map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="flex-1 truncate">{g.done ? "✅" : "•"} {g.title}</span>
              <div className="w-20 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full" style={{ width: `${g.pct}%`, background: "linear-gradient(90deg,#00BCD4,#7C4DFF)" }} />
              </div>
              <span className="w-8 text-right text-white/60">{g.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-end justify-between mt-5">
        <div className="text-[9px] text-white/40 max-w-[200px] leading-tight">
          Data owned by me · Sovereign Health {new Date().getFullYear()}
        </div>
        <div
          className="w-12 h-12 rounded-md grid grid-cols-5 grid-rows-5 gap-px p-1 bg-white/10 border border-white/20"
          aria-hidden
        >
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{ background: ((i * 7 + 3) % 3) === 0 ? "rgba(255,255,255,0.8)" : "transparent" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-2 py-3 text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-white/50 mt-0.5">{label}</div>
    </div>
  );
}