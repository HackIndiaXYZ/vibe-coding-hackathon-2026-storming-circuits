import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { GIFT_CARDS, type GiftCard } from "@/data/gift-cards";
import { Coins, Gift, Check, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/redeem")({ component: Redeem });

interface Tx { id: string; amount: number; description: string; type: string; created_at: string; }

const CATS = ["All", "Shopping", "Pharmacy", "Healthcare", "Lifestyle"] as const;

function Redeem() {
  const { user } = useAuth();
  const [tx, setTx] = useState<Tx[]>([]);
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [picked, setPicked] = useState<GiftCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("token_transactions").select("*").eq("user_id", user.id);
    setTx((data || []) as Tx[]);
  };
  useEffect(() => { load(); }, [user]);

  const balance = useMemo(() => {
    let b = 0;
    for (const t of tx) b += t.type === "earned" ? Number(t.amount) : -Number(t.amount);
    return Math.max(0, Math.round(b));
  }, [tx]);

  const filtered = GIFT_CARDS.filter((g) => cat === "All" || g.category === cat);

  const redeem = async (g: GiftCard) => {
    if (!user) return;
    if (balance < g.cost) return toast.error("Not enough HLTH tokens.");
    setBusy(true);
    const { error } = await supabase
      .from("token_transactions")
      .insert({ user_id: user.id, amount: g.cost, type: "spent", description: `Redeemed ${g.brand} ₹${g.amount} gift card` });
    setBusy(false);
    if (error) return toast.error(error.message);
    const generated = `${g.brand.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    setCode(generated);
    toast.success("Gift card redeemed!");
    load();
  };

  const redemptions = tx.filter((t) => t.type === "spent");

  return (
    <>
      <PageHeader title="Redeem Rewards" subtitle="Convert HLTH tokens into popular gift cards" />

      <div className="glass-card rounded-2xl p-6 mb-6 animated-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Available balance</div>
          <div className="text-4xl sm:text-5xl font-bold text-gradient mt-1">{balance.toLocaleString()}</div>
          <div className="text-[color:var(--cyan-accent)] text-sm mt-1 flex items-center gap-1.5"><Coins className="w-4 h-4" /> HLTH tokens</div>
        </div>
        <div className="text-xs text-muted-foreground sm:text-right max-w-sm">
          1 HLTH ≈ ₹1. Codes are simulated for this preview and would be issued via partner APIs in production.
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto mb-5">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${cat === c ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => {
          const affordable = balance >= g.cost;
          return (
            <div key={g.id} className="glass-card rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform">
              <div className={`bg-gradient-to-br ${g.color} p-5 text-white flex items-center justify-between`}>
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-80">{g.brand}</div>
                  <div className="text-3xl font-bold">₹{g.amount}</div>
                </div>
                <div className="text-4xl">{g.logo}</div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-muted-foreground mb-2">{g.category}</div>
                <p className="text-sm flex-1">{g.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="text-sm font-semibold text-[color:var(--cyan-accent)]">{g.cost} HLTH</div>
                  <button
                    onClick={() => { setPicked(g); setCode(null); }}
                    disabled={!affordable}
                    className="text-xs px-3 py-1.5 rounded-lg btn-gradient inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Gift className="w-3.5 h-3.5" /> {affordable ? "Redeem" : "Not enough"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-10 mb-3">Recent redemptions</h2>
          <div className="glass-card rounded-2xl divide-y divide-border">
            {redemptions.slice(0, 8).map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="truncate">{r.description}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="text-destructive font-semibold shrink-0 ml-3">−{r.amount} HLTH</div>
              </div>
            ))}
          </div>
        </>
      )}

      {picked && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPicked(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl max-w-sm w-full p-6">
            {!code ? (
              <>
                <div className={`bg-gradient-to-br ${picked.color} rounded-xl p-5 text-white mb-4`}>
                  <div className="text-xs uppercase opacity-80">{picked.brand}</div>
                  <div className="text-4xl font-bold">₹{picked.amount}</div>
                </div>
                <h3 className="text-lg font-semibold mb-1">Confirm redemption</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will deduct <strong>{picked.cost} HLTH</strong> from your balance and issue a gift card code.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPicked(null)} className="flex-1 rounded-lg border border-border py-2 text-sm">Cancel</button>
                  <button disabled={busy} onClick={() => redeem(picked)} className="flex-1 btn-gradient rounded-lg py-2 text-sm font-medium">{busy ? "Processing…" : "Confirm"}</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[color:var(--success)] mb-2"><Check className="w-5 h-5" /> <span className="font-semibold">Success!</span></div>
                <h3 className="text-lg font-semibold">Your {picked.brand} ₹{picked.amount} code</h3>
                <div className="mt-4 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4 font-mono text-center text-lg tracking-wider">{code}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { navigator.clipboard.writeText(code); toast.success("Code copied"); }} className="flex-1 rounded-lg border border-border py-2 text-sm inline-flex items-center justify-center gap-1.5">
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  <button onClick={() => { setPicked(null); setCode(null); }} className="flex-1 btn-gradient rounded-lg py-2 text-sm">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
