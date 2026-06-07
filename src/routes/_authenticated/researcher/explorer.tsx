import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/researcher/explorer")({ component: Explorer });

const GEO_DATA = [{ name: "South Asia", value: 412, color: "#1A73E8" }, { name: "Europe", value: 298, color: "#00BCD4" }, { name: "N. America", value: 256, color: "#7C4DFF" }, { name: "Africa", value: 134, color: "#00C853" }];
const AGE_DATA = [{ band: "18-30", count: 80 }, { band: "31-45", count: 180 }, { band: "46-60", count: 240 }, { band: "61+", count: 120 }];
const PREVIEW = [
  { id: "P-4821", age: 52, sex: "F", condition: "T2DM", region: "South Asia", hba1c: 7.2 },
  { id: "P-3192", age: 48, sex: "M", condition: "T2DM + HTN", region: "Europe", hba1c: 6.8 },
  { id: "P-7745", age: 60, sex: "F", condition: "T2DM", region: "N. America", hba1c: 7.5 },
];

function Explorer() {
  const navigate = useNavigate();
  const [age, setAge] = useState<[number, number]>([35, 65]);
  const [cond, setCond] = useState("Type 2 Diabetes");
  const estimated = Math.max(60, Math.round(1100 * (cond ? 0.7 : 1)));

  return (
    <>
      <PageHeader title="Patient Cohort Explorer" subtitle="Build and preview a target cohort before launching a campaign" />
      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="glass-card rounded-2xl p-5 space-y-4 h-fit">
          <div><label className="text-xs uppercase text-muted-foreground">Condition</label><input value={cond} onChange={(e) => setCond(e.target.value)} className="mt-1 w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm" /></div>
          <div><label className="text-xs uppercase text-muted-foreground">Age range: {age[0]}–{age[1]}</label><div className="mt-2"><Slider min={18} max={90} value={age} onValueChange={(v) => setAge([v[0], v[1]] as [number, number])} /></div></div>
          <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm">Estimated matching: <span className="text-[color:var(--cyan-accent)] font-bold">{estimated}</span></div>
          <button onClick={() => navigate({ to: "/researcher/create" })} className="btn-gradient rounded-lg w-full py-2 text-sm font-medium">Save as campaign</button>
        </aside>
        <section className="lg:col-span-3 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5"><h3 className="font-semibold mb-3">Geography</h3>
              <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={GEO_DATA} dataKey="value" innerRadius={50} outerRadius={90}>{GEO_DATA.map(d => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D" }} /></PieChart></ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-5"><h3 className="font-semibold mb-3">Age distribution</h3>
              <ResponsiveContainer width="100%" height={220}><BarChart data={AGE_DATA}><CartesianGrid stroke="#30363D" strokeDasharray="3 3" /><XAxis dataKey="band" stroke="#8B949E" fontSize={11} /><YAxis stroke="#8B949E" fontSize={11} /><Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D" }} /><Bar dataKey="count" fill="#00BCD4" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Sample preview <span className="text-xs text-muted-foreground font-normal">(actual data released after consent)</span></h3>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-muted-foreground uppercase"><tr><th className="text-left py-2">ID</th><th className="text-left">Age</th><th className="text-left">Sex</th><th className="text-left">Condition</th><th className="text-left">Region</th><th className="text-right">HbA1c</th></tr></thead><tbody>{PREVIEW.map(p => <tr key={p.id} className="border-t border-border"><td className="py-2 font-mono">{p.id}</td><td>{p.age}</td><td>{p.sex}</td><td>{p.condition}</td><td>{p.region}</td><td className="text-right text-[color:var(--cyan-accent)]">{p.hba1c}%</td></tr>)}</tbody></table></div>
          </div>
        </section>
      </div>
    </>
  );
}