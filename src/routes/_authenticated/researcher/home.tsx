import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/researcher/home")({ component: Home });

function Home() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("*").eq("researcher_id", user.id).then(({ data }) => setCamps(data || []));
  }, [user]);

  const active = camps.filter(c => c.status === "OPEN").length;
  const reached = camps.reduce((s, c) => s + (c.consented_count || 0), 0);
  const budget = camps.reduce((s, c) => s + Number(c.escrowed_amount || 0), 0);

  return (
    <>
      <PageHeader title="Researcher Overview" subtitle="Your studies at a glance" right={
        <Link to="/researcher/create" className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Quick launch</Link>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active campaigns" value={active} accent="primary" />
        <StatCard label="Patients reached" value={reached} accent="success" />
        <StatCard label="Avg quality" value="86/100" accent="cyan" />
        <StatCard label="Escrow locked" value={`${budget} HLTH`} accent="purple" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Campaign health</h3>
          <div className="space-y-3">
            {camps.map((c) => {
              const pct = Math.min(100, Math.round((c.consented_count / c.sample_size) * 100));
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium truncate">{c.name}</span><span className="text-muted-foreground">{pct}%</span></div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full btn-gradient" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {camps.length === 0 && <div className="text-sm text-muted-foreground">No campaigns yet.</div>}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Recent activity</h3>
          <div className="space-y-2 text-sm">
            {["23 new consents for Diabetes Cohort", "Campaign 'Hypertension Study' filled", "5 high-quality records added", "Escrow released for Settled study"].map((a, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 flex justify-between"><span>{a}</span><span className="text-xs text-muted-foreground">{i + 1}h ago</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}