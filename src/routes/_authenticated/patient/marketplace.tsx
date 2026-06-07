import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Shield, MapPin } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/_authenticated/patient/marketplace")({ component: Marketplace });

interface Campaign { id: string; name: string; researcher_name: string | null; condition: string; geography: string; age_min: number; age_max: number; reward_per_record: number; sample_size: number; consented_count: number; status: string; }

function Marketplace() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [consents, setConsents] = useState<Set<string>>(new Set());
  const [filterCond, setFilterCond] = useState("");
  const [filterGeo, setFilterGeo] = useState("");
  const [minReward, setMinReward] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: c }, { data: cs }] = await Promise.all([
      supabase.from("campaigns").select("*").eq("status", "OPEN").order("created_at", { ascending: false }),
      supabase.from("consents").select("campaign_id").eq("patient_id", user.id),
    ]);
    setCampaigns((c || []) as Campaign[]);
    setConsents(new Set((cs || []).map((x: any) => x.campaign_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const toggle = async (camp: Campaign, on: boolean) => {
    if (!user) return;
    if (on) {
      const { error } = await supabase.from("consents").insert({ patient_id: user.id, campaign_id: camp.id, status: "approved", data_hash: "0x" + Math.random().toString(16).slice(2, 10) });
      if (error) return toast.error(error.message);
      await supabase.from("token_transactions").insert({ user_id: user.id, amount: camp.reward_per_record, type: "earned", description: camp.name });
      toast.success(`Access granted — you'll earn ${camp.reward_per_record} HLTH when complete`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ["#1A73E8", "#00BCD4", "#7C4DFF", "#00C853"] });
      setConsents((s) => new Set(s).add(camp.id));
    } else {
      await supabase.from("consents").delete().match({ patient_id: user.id, campaign_id: camp.id });
      toast.success("Access revoked");
      const n = new Set(consents); n.delete(camp.id); setConsents(n);
    }
  };

  const filtered = campaigns.filter((c) =>
    (!filterCond || c.condition.toLowerCase().includes(filterCond.toLowerCase())) &&
    (!filterGeo || c.geography.toLowerCase().includes(filterGeo.toLowerCase())) &&
    Number(c.reward_per_record) >= minReward
  );

  return (
    <>
      <PageHeader title="Data Marketplace" subtitle="Choose which research campaigns can access your anonymized data" />
      <div className="glass-card rounded-xl p-4 mb-6 grid sm:grid-cols-3 gap-3">
        <input placeholder="Condition" value={filterCond} onChange={(e) => setFilterCond(e.target.value)} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm" />
        <input placeholder="Geography" value={filterGeo} onChange={(e) => setFilterGeo(e.target.value)} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm" />
        <input type="number" placeholder="Min reward (HLTH)" value={minReward || ""} onChange={(e) => setMinReward(Number(e.target.value) || 0)} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3].map((i) => <div key={i} className="glass-card rounded-2xl h-64 animate-pulse" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const on = consents.has(c.id);
            const pct = Math.min(100, Math.round((c.consented_count / c.sample_size) * 100));
            return (
              <div key={c.id} className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-semibold text-lg">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.researcher_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[color:var(--cyan-accent)]">{c.reward_per_record}</div>
                    <div className="text-xs text-muted-foreground">HLTH</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">{c.condition}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/30 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.geography}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">Ages {c.age_min}–{c.age_max}</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progress</span><span>{c.consented_count}/{c.sample_size}</span></div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full btn-gradient" style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground mb-4 p-2 rounded-lg bg-muted/40 border border-border">
                  <Shield className="w-4 h-4 text-[color:var(--success)] shrink-0 mt-0.5" />
                  Privacy Shield: name, contact, and ID are never shared — only anonymized health metrics.
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${on ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>{on ? "Access granted" : "Grant access"}</span>
                  <Switch checked={on} onCheckedChange={(v) => toggle(c, v)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
