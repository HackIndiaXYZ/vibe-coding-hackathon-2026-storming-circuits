import { LineChart, Line, ReferenceArea, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RangeDef { low: number; high: number; unit: string; }

// Common clinical reference ranges (adult). Conservative defaults.
const RANGES: Record<string, RangeDef> = {
  hba1c: { low: 4.0, high: 5.7, unit: "%" },
  ldl: { low: 0, high: 100, unit: "mg/dL" },
  hdl: { low: 40, high: 100, unit: "mg/dL" },
  cholesterol: { low: 0, high: 200, unit: "mg/dL" },
  triglycerides: { low: 0, high: 150, unit: "mg/dL" },
  glucose: { low: 70, high: 99, unit: "mg/dL" },
  egfr: { low: 90, high: 200, unit: "mL/min" },
  creatinine: { low: 0.6, high: 1.3, unit: "mg/dL" },
  hemoglobin: { low: 12, high: 17, unit: "g/dL" },
  tsh: { low: 0.4, high: 4.0, unit: "mIU/L" },
  vitamin_d: { low: 30, high: 100, unit: "ng/mL" },
  potassium: { low: 3.5, high: 5.0, unit: "mEq/L" },
  sodium: { low: 135, high: 145, unit: "mEq/L" },
};

function matchRange(test: string): RangeDef | null {
  const t = test.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const k of Object.keys(RANGES)) {
    if (t.includes(k.replace(/_/g, ""))) return RANGES[k];
  }
  return null;
}

function status(value: number, range: RangeDef): "normal" | "low" | "high" {
  if (value < range.low) return "low";
  if (value > range.high) return "high";
  return "normal";
}

interface Point { date: string; value: number; }

export function LabSparkline({ test, history, unit }: { test: string; history: Point[]; unit?: string }) {
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const range = matchRange(test);
  const latest = sorted[sorted.length - 1].value;
  const prev = sorted.length > 1 ? sorted[sorted.length - 2].value : latest;
  const delta = latest - prev;
  const trendDir = Math.abs(delta) < 0.01 ? "flat" : delta > 0 ? "up" : "down";
  const s = range ? status(latest, range) : "normal";
  const color =
    s === "normal" ? "var(--success)" : s === "low" ? "#FFB020" : "#FF5252";

  const data = sorted.map((p) => ({ ...p, value: p.value }));
  const vals = sorted.map((p) => p.value);
  const min = Math.min(...vals, range?.low ?? Infinity);
  const max = Math.max(...vals, range?.high ?? -Infinity);
  const pad = (max - min) * 0.15 || 1;

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">{test}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold" style={{ color }}>
            {latest}{unit || range?.unit ? ` ${unit || range!.unit}` : ""}
          </span>
          {sorted.length > 1 && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              {trendDir === "up" ? <TrendingUp className="w-3 h-3" /> : trendDir === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trendDir !== "flat" && <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>}
            </span>
          )}
        </div>
      </div>
      {range && (
        <div className="text-[10px] text-muted-foreground mb-1">
          Reference {range.low}–{range.high} {range.unit} ·{" "}
          <span style={{ color }}>{s === "normal" ? "in range" : s === "low" ? "below range" : "above range"}</span>
        </div>
      )}
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            {range && (
              <ReferenceArea y1={range.low} y2={range.high} fill="var(--success)" fillOpacity={0.08} stroke="none" />
            )}
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} isAnimationActive />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(l: any, p: any) => p?.[0]?.payload?.date || ""}
              formatter={(v: any) => [`${v} ${unit || range?.unit || ""}`, test]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Build per-test history from a flat list of records' lab_results.
export function buildLabHistory(records: { created_at: string; anonymized_json: any }[]) {
  const map = new Map<string, { date: string; value: number; unit?: string }[]>();
  for (const r of records) {
    const labs = r.anonymized_json?.lab_results;
    if (!Array.isArray(labs)) continue;
    for (const l of labs) {
      const v = Number(l.value);
      if (!Number.isFinite(v)) continue;
      const key = String(l.test || "").trim();
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push({ date: new Date(r.created_at).toLocaleDateString(), value: v, unit: l.unit });
      map.set(key, arr);
    }
  }
  return Array.from(map.entries()).map(([test, points]) => ({ test, points, unit: points[0]?.unit }));
}