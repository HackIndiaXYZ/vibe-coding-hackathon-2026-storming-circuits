import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { Copy, Twitter, MessageCircle, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/referrals")({ component: Referrals });

const TIERS = [
  { invites: 1, reward: 10, label: "First friend" },
  { invites: 5, reward: 75, label: "Squad" },
  { invites: 10, reward: 200, label: "Champion" },
  { invites: 25, reward: 600, label: "Legend" },
];

const LEADERS = [
  { rank: "🥇", name: "Patient #4821", count: 28 },
  { rank: "🥈", name: "Patient #3192", count: 19 },
  { rank: "🥉", name: "Patient #7745", count: 14 },
  { rank: "4️⃣", name: "Patient #2003", count: 9 },
  { rank: "5️⃣", name: "Patient #6610", count: 7 },
];

function Referrals() {
  const { user, profile } = useAuth();
  const [refs, setRefs] = useState<any[]>([]);
  const link = `sovereign.health/join?ref=${(profile?.wallet_address || "0x000").replace("...", "")}`;

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("*").eq("referrer_id", user.id).then(({ data }) => setRefs(data || []));
  }, [user]);

  const invited = refs.length;
  const joined = refs.filter(r => r.status === "joined").length;
  const earned = refs.reduce((s, r) => s + Number(r.reward_amount || 0), 0);

  const copy = () => { navigator.clipboard.writeText(link); toast.success("Link copied"); };
  const tw = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("I own my health data with @SovereignHealth — and earn from it. " + link)}`, "_blank");
  const wa = () => window.open(`https://wa.me/?text=${encodeURIComponent("Own your medical records and earn from research. Join me: " + link)}`, "_blank");

  return (
    <>
      <PageHeader title="Refer & Earn" subtitle="Get 10 HLTH for every friend who joins" />
      <div className="glass-card rounded-2xl p-6 mb-6 animated-border">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your referral link</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <code className="flex-1 rounded-lg bg-muted border border-border px-3 py-2.5 text-sm font-mono truncate">{link}</code>
          <button onClick={copy} className="btn-gradient rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-1.5"><Copy className="w-4 h-4" /> Copy</button>
          <button onClick={tw} className="rounded-lg px-4 py-2.5 text-sm border border-border hover:border-accent inline-flex items-center gap-1.5"><Twitter className="w-4 h-4" /> Twitter</button>
          <button onClick={wa} className="rounded-lg px-4 py-2.5 text-sm border border-border hover:border-accent inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Invited" value={invited} accent="primary" />
        <StatCard label="Joined" value={joined} accent="success" />
        <StatCard label="HLTH Earned" value={earned} accent="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Reward ladder</h3>
          <div className="space-y-3">
            {TIERS.map((t) => {
              const reached = invited >= t.invites;
              return (
                <div key={t.invites} className={`flex items-center gap-3 rounded-lg border p-3 ${reached ? "border-[color:var(--success)]/40 bg-success/5" : "border-border bg-muted/30"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${reached ? "btn-gradient" : "bg-muted border border-border text-muted-foreground"}`}>{t.invites}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">Invite {t.invites} friend{t.invites > 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-lg font-bold text-[color:var(--cyan-accent)]">+{t.reward} HLTH</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-[color:var(--cyan-accent)]" /> Top referrers</h3>
          <div className="space-y-2">
            {LEADERS.map((l) => (
              <div key={l.name} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3"><span className="text-2xl">{l.rank}</span><span className="text-sm font-medium">{l.name}</span></div>
                <span className="text-sm text-muted-foreground">{l.count} invites</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}