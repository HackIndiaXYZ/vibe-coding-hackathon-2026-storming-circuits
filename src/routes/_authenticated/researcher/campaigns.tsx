import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { Plus, FileBarChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/researcher/campaigns")({ component: Campaigns });

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-primary/10 text-primary border-primary/30",
  FILLED: "bg-success/10 text-[color:var(--success)] border-[color:var(--success)]/30",
  SETTLED: "bg-purple-500/10 text-[color:var(--purple-accent)] border-[color:var(--purple-accent)]/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

function Campaigns() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("*").eq("researcher_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setRows(data || []); setLoading(false);
    });
  }, [user]);

  const active = rows.filter((r) => r.status === "OPEN").length;
  const escrow = rows.reduce((s, r) => s + Number(r.escrowed_amount || 0), 0);
  const consents = rows.reduce((s, r) => s + (r.consented_count || 0), 0);

  return (
    <>
      <PageHeader title="My Research Campaigns" subtitle="Manage open studies and data acquisition" right={
        <Link to="/researcher/create" className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> New campaign</Link>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active campaigns" value={active} accent="primary" />
        <StatCard label="Total escrowed" value={`${escrow} HLTH`} accent="cyan" />
        <StatCard label="Total consents" value={consents} accent="success" />
        <StatCard label="Datasets downloaded" value={rows.filter((r) => r.status === "SETTLED").length} accent="purple" />
      </div>

      {loading ? <div className="glass-card rounded-2xl h-64 animate-pulse" /> : rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileBarChart className="w-12 h-12 text-accent mx-auto mb-3" />
          <div className="font-semibold">No campaigns yet</div>
          <div className="text-sm text-muted-foreground mt-1 mb-4">Launch your first study to start gathering anonymized data.</div>
          <Link to="/researcher/create" className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5">Create your first campaign →</Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Condition</th>
                <th className="text-left p-3">Geography</th>
                <th className="text-left p-3">Progress</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Reward</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = Math.min(100, Math.round((r.consented_count / r.sample_size) * 100));
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 text-muted-foreground">{r.condition}</td>
                    <td className="p-3 text-muted-foreground">{r.geography}</td>
                    <td className="p-3 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full btn-gradient" style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs text-muted-foreground">{r.consented_count}/{r.sample_size}</span>
                      </div>
                    </td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="p-3 text-right text-[color:var(--cyan-accent)]">{r.reward_per_record} HLTH</td>
                    <td className="p-3 text-right font-semibold">{r.escrowed_amount} HLTH</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
