import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/patient/leaderboard")({ component: Leaderboard });

interface Row { id: string; user_id: string; display_name: string | null; total_earned: number; records_count: number; campaigns_joined: number; rank: number | null; badge: string | null; }

const BADGE_COLOR: Record<string, string> = {
  Legend: "bg-gradient-to-r from-[#7C4DFF] to-[#00BCD4] text-white",
  Champion: "bg-[color:var(--purple-accent)]/20 text-[color:var(--purple-accent)] border-[color:var(--purple-accent)]/40",
  Contributor: "bg-primary/20 text-primary border-primary/40",
  Rookie: "bg-muted text-muted-foreground border-border",
};
const BADGE_EMOJI: Record<string, string> = { Legend: "👑", Champion: "🏆", Contributor: "⚡", Rookie: "🌱" };

function Leaderboard() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const sync = async () => {
      if (user) {
        // Pull live totals for the current user from real tables
        const [{ data: tx }, { count: rc }, { count: cc }] = await Promise.all([
          supabase.from("token_transactions").select("amount,type").eq("user_id", user.id),
          supabase.from("health_records").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("consents").select("*", { count: "exact", head: true }).eq("patient_id", user.id),
        ]);
        const earned = (tx || []).reduce((s, t: any) => s + (t.type === "earned" ? Number(t.amount) : 0), 0);
        const badge = earned >= 1000 ? "Legend" : earned >= 500 ? "Champion" : earned >= 100 ? "Contributor" : "Rookie";
        await supabase.from("leaderboard").upsert(
          {
            user_id: user.id,
            display_name: profile?.full_name?.split(" ")[0] || "You",
            total_earned: earned,
            records_count: rc || 0,
            campaigns_joined: cc || 0,
            badge,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .order("total_earned", { ascending: false })
        .limit(50);
      setRows((data || []) as Row[]);
    };
    sync();
  }, [user, profile?.full_name]);

  return (
    <>
      <PageHeader title="Global Leaderboard" subtitle="Top contributors to medical research worldwide" />

      {/* Desktop table */}
      <div className="hidden md:block glass-card rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Patient</th>
              <th className="text-right p-3">Records</th>
              <th className="text-right p-3">Campaigns</th>
              <th className="text-right p-3">Earned</th>
              <th className="text-left p-3">Badge</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isMe = r.user_id === user?.id;
              return (
                <tr key={r.id} className={`border-t border-border ${isMe ? "bg-accent/5 ring-1 ring-accent" : ""}`}>
                  <td className="p-3 font-bold">{r.rank ?? i + 1}</td>
                  <td className="p-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full btn-gradient flex items-center justify-center text-xs">{r.display_name?.[0] || "P"}</div>
                    <span>{isMe ? "You" : r.display_name}</span>
                  </td>
                  <td className="p-3 text-right">{r.records_count}</td>
                  <td className="p-3 text-right">{r.campaigns_joined}</td>
                  <td className="p-3 text-right text-[color:var(--cyan-accent)] font-semibold">{r.total_earned} HLTH</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${BADGE_COLOR[r.badge || "Rookie"]}`}>
                      {BADGE_EMOJI[r.badge || "Rookie"]} {r.badge}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r, i) => {
          const isMe = r.user_id === user?.id;
          return (
            <div key={r.id} className={`glass-card rounded-xl p-3 flex items-center gap-3 ${isMe ? "ring-1 ring-accent" : ""}`}>
              <div className="text-lg font-bold w-7 text-center text-muted-foreground">{r.rank ?? i + 1}</div>
              <div className="w-9 h-9 rounded-full btn-gradient flex items-center justify-center text-xs font-semibold shrink-0">
                {r.display_name?.[0] || "P"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{isMe ? "You" : r.display_name}</div>
                <div className="text-xs text-muted-foreground">{r.records_count} records · {r.campaigns_joined} campaigns</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-[color:var(--cyan-accent)]">{r.total_earned}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${BADGE_COLOR[r.badge || "Rookie"]}`}>
                  {BADGE_EMOJI[r.badge || "Rookie"]} {r.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}