import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Shield, Download, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/privacy")({ component: Privacy });

interface PS { share_conditions: boolean; share_medications: boolean; share_lab_results: boolean; share_demographics: boolean; marketplace_enabled: boolean; data_retention_days: number; }
const DEFAULT: PS = { share_conditions: true, share_medications: true, share_lab_results: true, share_demographics: true, marketplace_enabled: true, data_retention_days: 365 };
const RETENTION = [30, 90, 180, 365, 9999];

function Privacy() {
  const { user } = useAuth();
  const [s, setS] = useState<PS>(DEFAULT);
  const [consents, setConsents] = useState<any[]>([]);
  const [txs, setTxs] = useState<{ amount: number; type: string; description: string | null; created_at: string }[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: ps }, { data: cs }, { data: tt }] = await Promise.all([
      supabase.from("privacy_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("consents").select("*, campaigns(name, researcher_name)").eq("patient_id", user.id),
      supabase.from("token_transactions").select("amount,type,description,created_at").eq("user_id", user.id),
    ]);
    if (ps) setS(ps as PS); else await supabase.from("privacy_settings").insert({ ...DEFAULT, user_id: user.id });
    setConsents(cs || []);
    setTxs((tt || []) as any);
  };
  useEffect(() => { load(); }, [user]);

  const update = async (patch: Partial<PS>) => {
    if (!user) return;
    const next = { ...s, ...patch };
    setS(next);
    await supabase.from("privacy_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  };

  const earnedFor = (c: any) => {
    const name = c.campaigns?.name;
    if (!name) return 0;
    return txs
      .filter((t) => t.type === "earned" && t.description === name && new Date(t.created_at) >= new Date(c.created_at))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const redeemedAfter = (c: any) =>
    txs.some((t) => t.type === "spent" && new Date(t.created_at) > new Date(c.created_at));

  const revoke = async (c: any) => {
    if (!user) return;
    if (redeemedAfter(c)) {
      toast.error("You've already redeemed tokens since granting this access. Revoking is no longer available.");
      return;
    }
    const refund = earnedFor(c);
    const ok = window.confirm(
      refund > 0
        ? `Revoke access to "${c.campaigns?.name}"? This will deduct ${refund} HLTH earned from this campaign.`
        : `Revoke access to "${c.campaigns?.name}"?`
    );
    if (!ok) return;
    setBusyId(c.id);
    try {
      if (refund > 0) {
        const { error: txErr } = await supabase.from("token_transactions").insert({
          user_id: user.id,
          amount: refund,
          type: "spent",
          description: `Revoked consent: ${c.campaigns?.name}`,
        });
        if (txErr) throw txErr;
      }
      const { error } = await supabase.from("consents").delete().eq("id", c.id);
      if (error) throw error;
      toast.success(refund > 0 ? `Access revoked. ${refund} HLTH deducted.` : "Access revoked");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Could not revoke access");
    } finally {
      setBusyId(null);
    }
  };

  const exportData = async () => {
    if (!user) return;
    const [{ data: recs }, { data: tx }] = await Promise.all([
      supabase.from("health_records").select("*").eq("user_id", user.id),
      supabase.from("token_transactions").select("*").eq("user_id", user.id),
    ]);
    const blob = new Blob([JSON.stringify({ records: recs, transactions: tx, consents, privacy: s }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sovereign-health-export.json";
    a.click();
    toast.success("Data export downloaded");
  };

  const fields = [s.share_conditions, s.share_medications, s.share_lab_results, s.share_demographics];
  const privacyScore = Math.round(100 - (fields.filter(Boolean).length / fields.length) * 60);

  return (
    <>
      <PageHeader title="Privacy Control Center" subtitle="You decide what gets shared, and with whom" />
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold">Marketplace Participation</h3><div className="text-xs text-muted-foreground">Master switch for all data sharing</div></div>
            <Switch checked={s.marketplace_enabled} onCheckedChange={(v) => update({ marketplace_enabled: v })} />
          </div>
          <div className="h-px bg-border my-4" />
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Granular sharing</h4>
          <div className="space-y-3">
            <Row label="Share Conditions" hint="Diagnosed conditions like diabetes, hypertension" v={s.share_conditions} on={(v) => update({ share_conditions: v })} />
            <Row label="Share Medications" hint="Prescribed drugs and dosages" v={s.share_medications} on={(v) => update({ share_medications: v })} />
            <Row label="Share Lab Results" hint="Numeric lab values (HbA1c, LDL, etc.)" v={s.share_lab_results} on={(v) => update({ share_lab_results: v })} />
            <Row label="Share Demographics" hint="Age band, geography" v={s.share_demographics} on={(v) => update({ share_demographics: v })} />
          </div>
          <div className="h-px bg-border my-4" />
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Data retention: {s.data_retention_days >= 9999 ? "Never delete" : `${s.data_retention_days} days`}</h4>
          <Slider min={0} max={4} step={1} value={[RETENTION.indexOf(s.data_retention_days)]} onValueChange={(v) => update({ data_retention_days: RETENTION[v[0]] })} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>30d</span><span>90d</span><span>180d</span><span>1y</span><span>Never</span></div>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center flex flex-col items-center justify-center">
          <Shield className="w-16 h-16 text-[color:var(--cyan-accent)] mb-3" />
          <div className="text-4xl font-bold">{privacyScore}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Privacy Score</div>
          <div className="text-xs text-muted-foreground mt-3">{fields.filter(Boolean).length}/{fields.length} fields shared</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3">Who has my data?</h3>
          <div className="space-y-2">
            {consents.length === 0 && <div className="text-sm text-muted-foreground">No active consents.</div>}
            {consents.map((c) => {
              const locked = redeemedAfter(c);
              const refund = earnedFor(c);
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.campaigns?.name || "Unknown campaign"}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.campaigns?.researcher_name}</div>
                    {refund > 0 && !locked && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">Revoking deducts {refund} HLTH</div>
                    )}
                  </div>
                  {locked ? (
                    <span
                      title="You've already redeemed tokens after granting this access"
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground inline-flex items-center gap-1 shrink-0"
                    >
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  ) : (
                    <button
                      disabled={busyId === c.id}
                      onClick={() => revoke(c)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition shrink-0 disabled:opacity-50"
                    >
                      {busyId === c.id ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /> Audit Log</h3>
          <div className="text-xs font-mono space-y-1.5 max-h-48 overflow-y-auto">
            {[
              ["2026-05-30 14:22", "Diabetes Cohort", "conditions, lab_results"],
              ["2026-05-28 09:15", "Hypertension Study", "lab_results"],
              ["2026-05-25 18:40", "Kidney Function Panel", "demographics, lab_results"],
            ].map(([d, c, f], i) => (
              <div key={i} className="rounded border border-border bg-muted/40 p-2">
                <div className="text-muted-foreground">{d}</div>
                <div>{c} <span className="text-accent">→</span> {f}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={exportData} className="btn-gradient rounded-lg px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2"><Download className="w-4 h-4" /> Request full data export (GDPR)</button>
    </>
  );
}

function Row({ label, hint, v, on }: { label: string; hint: string; v: boolean; on: (v: boolean) => void }) {
  return <div className="flex items-center justify-between gap-3">
    <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{hint}</div></div>
    <Switch checked={v} onCheckedChange={on} />
  </div>;
}