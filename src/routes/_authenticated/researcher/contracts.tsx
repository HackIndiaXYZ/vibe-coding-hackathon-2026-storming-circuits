import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/researcher/contracts")({ component: Contracts });

const STATES = ["OPEN", "FILLED", "PROCESSING", "SETTLED"];

function Contracts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("campaigns").select("*").eq("researcher_id", user.id).then(({ data }) => setRows(data || []));
  }, [user]);

  const active = rows[0];
  const stateIdx = active ? Math.max(0, STATES.indexOf(active.status)) : 0;

  return (
    <>
      <PageHeader title="Smart Contract Monitor" subtitle="On-chain escrow status for every campaign" />
      {active && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">{active.name} — Lifecycle</h3>
          <div className="flex items-center gap-2">
            {STATES.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`px-3 py-2 rounded-lg text-xs font-semibold flex-1 text-center border ${i <= stateIdx ? "btn-gradient border-transparent" : "bg-muted text-muted-foreground border-border"}`}>{s}</div>
                {i < STATES.length - 1 && <div className={`h-px flex-1 ${i < stateIdx ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => alert("48-hour timelock will be initiated.")}>Emergency Withdraw (48h timelock)</button>
        </div>
      )}
      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Campaign</th><th className="text-right p-3">Locked</th><th className="text-left p-3">Status</th><th className="text-left p-3">Tx Hash</th><th className="text-left p-3">Date</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-right text-[color:var(--cyan-accent)]">{r.escrowed_amount} HLTH</td>
              <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-muted border border-border">{r.status === "SETTLED" ? "Released" : r.status === "OPEN" ? "Locked" : "Pending"}</span></td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{r.metadata_hash}…</td>
              <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}