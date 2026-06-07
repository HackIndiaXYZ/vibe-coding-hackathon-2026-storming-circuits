import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/researcher/analytics")({ component: Analytics });

const growth = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  diabetes: Math.round(50 + i * 8 + Math.random() * 20),
  hypertension: Math.round(30 + i * 12 + Math.random() * 25),
  kidney: Math.round(10 + i * 1.5 + Math.random() * 8),
}));
const geo = [
  { name: "South Asia", value: 412 }, { name: "Europe", value: 298 },
  { name: "North America", value: 256 }, { name: "Africa", value: 134 },
];
const status = [
  { name: "OPEN", value: 8, color: "#1A73E8" },
  { name: "FILLED", value: 4, color: "#00C853" },
  { name: "SETTLED", value: 3, color: "#7C4DFF" },
];

// HbA1c vs LDL scatter
const scatter = Array.from({ length: 60 }, () => ({
  hba1c: +(5 + Math.random() * 4).toFixed(1),
  ldl: Math.round(70 + Math.random() * 120),
  z: 10 + Math.round(Math.random() * 30),
}));

// Quality-by-region heatmap data (rows = condition, cols = region)
const HEAT_ROWS = ["Diabetes", "Hypertension", "Kidney", "Cardiac"];
const HEAT_COLS = ["S.Asia", "Europe", "N.America", "Africa", "MENA"];
const HEAT_VALUES: number[][] = [
  [82, 90, 88, 71, 76],
  [78, 86, 84, 68, 73],
  [70, 81, 79, 62, 65],
  [85, 92, 90, 74, 78],
];
const heatColor = (v: number) => {
  // 60..95 → cyan ramp
  const t = Math.min(1, Math.max(0, (v - 60) / 35));
  const a = 0.15 + t * 0.75;
  return `rgba(0, 188, 212, ${a.toFixed(2)})`;
};

const ROI_ROWS = [
  { name: "Diabetes 2025", cost: 12000, value: 38400, roi: 220 },
  { name: "Hypertension EU", cost: 7500, value: 18750, roi: 150 },
  { name: "Kidney Risk APAC", cost: 5200, value: 9100, roi: 75 },
];

function Analytics() {
  const exportCSV = () => {
    const rows = [
      ["day", "diabetes", "hypertension", "kidney"],
      ...growth.map((g) => [g.day, g.diabetes, g.hypertension, g.kidney]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <>
      <PageHeader title="Campaign Analytics" subtitle="Track consent growth, geography, and outcomes" right={
        <button onClick={exportCSV} className="text-sm px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Avg consent rate" value="68%" accent="cyan" />
        <StatCard label="Avg quality score" value="86/100" accent="success" />
        <StatCard label="Avg time to fill" value="12 days" accent="primary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Consent growth — 30 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="day" stroke="#8B949E" fontSize={12} />
              <YAxis stroke="#8B949E" fontSize={12} />
              <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="diabetes" stroke="#1A73E8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="hypertension" stroke="#00BCD4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="kidney" stroke="#7C4DFF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Records by geography</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={geo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="name" stroke="#8B949E" fontSize={11} />
              <YAxis stroke="#8B949E" fontSize={12} />
              <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8 }} />
              <Bar dataKey="value" fill="#00BCD4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Campaign status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={status} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {status.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold mb-1">HbA1c vs LDL — patient distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Each point is an anonymized patient. Bubble size = sample weight.</p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis type="number" dataKey="hba1c" name="HbA1c %" domain={[4.5, 10]} stroke="#8B949E" fontSize={12} />
              <YAxis type="number" dataKey="ldl" name="LDL mg/dL" domain={[60, 210]} stroke="#8B949E" fontSize={12} />
              <ZAxis type="number" dataKey="z" range={[40, 200]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8 }} />
              <Scatter data={scatter} fill="#7C4DFF" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Quality heatmap — condition × region</h3>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr><th className="text-left p-2 text-muted-foreground"></th>{HEAT_COLS.map((c) => <th key={c} className="p-2 font-medium text-muted-foreground">{c}</th>)}</tr>
              </thead>
              <tbody>
                {HEAT_ROWS.map((row, i) => (
                  <tr key={row}>
                    <td className="p-2 text-muted-foreground font-medium">{row}</td>
                    {HEAT_VALUES[i].map((v, j) => (
                      <td key={j} className="p-1">
                        <div className="rounded-md text-center py-3 font-semibold text-foreground" style={{ background: heatColor(v) }}>{v}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[color:var(--success)]" /> Campaign ROI</h3>
          <div className="space-y-2">
            {ROI_ROWS.map((r) => (
              <div key={r.name} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className={`text-xs font-bold ${r.roi >= 150 ? "text-[color:var(--success)]" : r.roi >= 75 ? "text-[color:var(--cyan-accent)]" : "text-orange-400"}`}>+{r.roi}%</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1.5">${r.cost.toLocaleString()} spent · ${r.value.toLocaleString()} value</div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full btn-gradient" style={{ width: `${Math.min(100, r.roi / 3)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
