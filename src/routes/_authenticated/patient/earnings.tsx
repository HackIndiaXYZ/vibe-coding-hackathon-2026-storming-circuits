import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Upload, Sparkles, Coins, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/earnings")({ component: Earnings });

interface Tx { id: string; amount: number; description: string; type: string; created_at: string; }

function Earnings() {
  const { user, profile } = useAuth();
  const [tx, setTx] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("token_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      const t = (data || []) as Tx[];
      setTx(t);
      const sum = t.filter((x) => x.type === "earned").reduce((s, x) => s + Number(x.amount), 0);
      setTotal(sum);
    });
  }, [user]);

  useEffect(() => {
    if (!total) return;
    const start = Date.now(); const dur = 1200;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setShown(Math.round(total * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [total]);

  const copy = () => { navigator.clipboard.writeText(profile?.wallet_address || ""); toast.success("Wallet copied"); };

  return (
    <>
      <PageHeader title="My Earnings" subtitle="Track rewards from research participation" />
      <div className="glass-card rounded-2xl p-10 text-center mb-8 animated-border">
        <div className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Total HLTH earned</div>
        <div className="text-7xl font-bold text-gradient">{shown}</div>
        <div className="mt-2 text-[color:var(--cyan-accent)]">HLTH tokens</div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Wallet address</div>
          <div className="font-mono text-sm mt-1">{profile?.wallet_address}</div>
        </div>
        <button onClick={copy} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:border-accent transition flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy</button>
      </div>

      <h2 className="text-xl font-semibold mb-3">Transactions</h2>
      <div className="glass-card rounded-2xl overflow-hidden mb-10">
        {tx.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet — grant access in the Marketplace.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-right p-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {tx.map((t) => {
                  const earned = t.type === "earned";
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{t.description}</td>
                      <td className={`p-3 text-right font-semibold whitespace-nowrap ${earned ? "text-[color:var(--success)]" : "text-destructive"}`}>
                        {earned ? "+" : "−"}{t.amount} HLTH
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-xs px-2 py-1 rounded-full border capitalize ${earned ? "bg-success/10 text-[color:var(--success)] border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`}>
                          {t.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {tx.map((t) => {
                const earned = t.type === "earned";
                return (
                  <div key={t.id} className="p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{t.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-sm font-semibold whitespace-nowrap ${earned ? "text-[color:var(--success)]" : "text-destructive"}`}>
                      {earned ? "+" : "−"}{t.amount}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">How it works</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { i: Upload, t: "Upload", d: "Add your medical documents to your private vault." },
          { i: Sparkles, t: "Match", d: "Researchers create campaigns matching your conditions." },
          { i: Coins, t: "Earn", d: "Grant access — earn HLTH when the campaign completes." },
        ].map(({ i: Icon, t, d }, idx) => (
          <div key={t} className="glass-card rounded-2xl p-6">
            <div className="text-xs text-muted-foreground">Step {idx + 1}</div>
            <Icon className="w-7 h-7 text-accent my-3" />
            <div className="font-semibold">{t}</div>
            <div className="text-sm text-muted-foreground mt-1">{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}
