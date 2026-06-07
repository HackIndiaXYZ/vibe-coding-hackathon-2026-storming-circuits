import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/_authenticated/researcher/create")({ component: Create });

const GEOS = ["Global", "South Asia", "East Asia", "North America", "Europe", "Africa", "Middle East"];
const SEVERITIES = ["Mild", "Moderate", "Severe"];
const MEDS = ["Metformin", "Insulin", "Lisinopril", "Atorvastatin", "Aspirin", "Warfarin"];

const AI_SUGGESTIONS: { name: string; cond: string; meds: string[]; sev: string[]; reward: number; sample: number; }[] = [
  { name: "Metformin Long-Term Outcomes", cond: "Type 2 Diabetes", meds: ["Metformin"], sev: ["Moderate"], reward: 55, sample: 250 },
  { name: "Statin Adherence in 50+", cond: "Hyperlipidemia", meds: ["Atorvastatin"], sev: ["Mild", "Moderate"], reward: 40, sample: 500 },
  { name: "Resistant Hypertension Cohort", cond: "Hypertension", meds: ["Lisinopril"], sev: ["Severe"], reward: 75, sample: 150 },
];

function Create() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [cond, setCond] = useState("");
  const [age, setAge] = useState<[number, number]>([35, 65]);
  const [geo, setGeo] = useState<string[]>(["Global"]);
  const [sample, setSample] = useState(100);
  const [reward, setReward] = useState(40);
  const [sev, setSev] = useState<string[]>([]);
  const [meds, setMeds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const total = reward * sample;
  const fee = total * 0.05;
  const grand = total + fee;
  const estimated = Math.max(10, Math.round(
    12400
    * (geo.includes("Global") ? 1 : 0.3)
    * (cond ? 0.4 : 1)
    * (sev.length ? sev.length / 3 : 1)
    * (meds.length ? 0.6 : 1)
  ));

  const applySuggestion = (s: typeof AI_SUGGESTIONS[number]) => {
    setName(s.name); setCond(s.cond); setMeds(s.meds); setSev(s.sev);
    setReward(s.reward); setSample(s.sample);
    toast.success("AI suggestion applied");
  };

  useEffect(() => {
    if (done) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: ["#1A73E8", "#00BCD4", "#7C4DFF", "#00C853"] });
    }
  }, [done]);

  const launch = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("campaigns").insert({
      researcher_id: user.id,
      researcher_name: profile?.full_name || "Researcher",
      name, condition: cond, age_min: age[0], age_max: age[1],
      geography: geo.join(", "), sample_size: sample, reward_per_record: reward,
      escrowed_amount: grand, status: "OPEN",
      metadata_hash: "0x" + Math.random().toString(16).slice(2, 14),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDone(true);
    toast.success("Campaign launched!");
    setTimeout(() => navigate({ to: "/researcher/campaigns" }), 1500);
  };

  if (done) return <Confetti />;

  return (
    <>
      <PageHeader title="Launch Research Campaign" subtitle="Define cohort, fund escrow, launch" />
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? "btn-gradient" : "bg-muted text-muted-foreground border border-border"}`}>{s}</div>
            <div className={`text-sm ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>{["Define Cohort", "Set Rewards", "Review & Fund"][s - 1]}</div>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-accent" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-3xl">
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[color:var(--purple-accent)]/30 bg-[color:var(--purple-accent)]/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--purple-accent)] mb-2">
                <Sparkles className="w-4 h-4" /> AI Campaign Suggester
              </div>
              <div className="text-xs text-muted-foreground mb-3">Pre-fill from a high-yield template based on current cohort availability.</div>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((s) => (
                  <button key={s.name} type="button" onClick={() => applySuggestion(s)} className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--purple-accent)]/40 text-[color:var(--purple-accent)] hover:bg-[color:var(--purple-accent)]/10 transition">{s.name}</button>
                ))}
              </div>
            </div>
            <Field label="Campaign name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-muted border border-border px-3 py-2" /></Field>
            <Field label="Medical condition"><input value={cond} onChange={(e) => setCond(e.target.value)} placeholder="e.g. Type 2 Diabetes" className="w-full rounded-lg bg-muted border border-border px-3 py-2" /></Field>
            <Field label="Severity filter">
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((s) => {
                  const on = sev.includes(s);
                  return <button key={s} type="button" onClick={() => setSev(on ? sev.filter(x => x !== s) : [...sev, s])}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>{s}</button>;
                })}
              </div>
            </Field>
            <Field label="Medication filter (any of)">
              <div className="flex flex-wrap gap-2">
                {MEDS.map((m) => {
                  const on = meds.includes(m);
                  return <button key={m} type="button" onClick={() => setMeds(on ? meds.filter(x => x !== m) : [...meds, m])}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>{m}</button>;
                })}
              </div>
            </Field>
            <Field label={`Age range: ${age[0]} – ${age[1]}`}>
              <Slider min={18} max={90} step={1} value={age} onValueChange={(v) => setAge([v[0], v[1]] as [number, number])} />
            </Field>
            <Field label="Geography">
              <div className="flex flex-wrap gap-2">
                {GEOS.map((g) => {
                  const on = geo.includes(g);
                  return <button key={g} type="button" onClick={() => setGeo(on ? geo.filter((x) => x !== g) : [...geo, g])}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>{g}</button>;
                })}
              </div>
            </Field>
            <Field label="Sample size"><input type="number" min={10} value={sample} onChange={(e) => setSample(Math.max(10, Number(e.target.value)))} className="w-full rounded-lg bg-muted border border-border px-3 py-2" /></Field>
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border">
              Estimated matching profiles: <span className="text-[color:var(--cyan-accent)] font-semibold">{estimated.toLocaleString()}</span>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <Field label="Reward per record (HLTH)"><input type="number" min={1} value={reward} onChange={(e) => setReward(Math.max(1, Number(e.target.value)))} className="w-full rounded-lg bg-muted border border-border px-3 py-2" /></Field>
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2">
              <Row k="Total escrow" v={`${total} HLTH`} />
              <Row k="Platform fee (5%)" v={`${fee} HLTH`} />
              <div className="h-px bg-border my-2" />
              <Row k={<span className="font-semibold">Grand total</span>} v={<span className="text-xl font-bold text-[color:var(--cyan-accent)]">{grand} HLTH</span>} />
            </div>
            <p className="text-xs text-muted-foreground">Funds are locked in smart contract escrow until the campaign completes.</p>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <Row k="Name" v={name || "—"} />
            <Row k="Condition" v={cond || "—"} />
            <Row k="Age range" v={`${age[0]}–${age[1]}`} />
            <Row k="Geography" v={geo.join(", ")} />
            <Row k="Sample size" v={sample} />
            <Row k="Reward/record" v={`${reward} HLTH`} />
            <Row k="Total cost" v={<span className="font-semibold text-[color:var(--cyan-accent)]">{grand} HLTH</span>} />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-30">Back</button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && (!name || !cond)} className="btn-gradient rounded-lg px-5 py-2 text-sm font-medium">Continue</button>
          ) : (
            <button onClick={launch} disabled={busy} className="btn-gradient rounded-lg px-5 py-2 text-sm font-medium">{busy ? "Launching…" : "Fund Escrow & Launch"}</button>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm text-muted-foreground mb-2 block">{label}</label>{children}</div>;
}
function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}

function Confetti() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-full btn-gradient flex items-center justify-center mb-6 animate-bounce">
        <Check className="w-10 h-10 text-white" />
      </div>
      <div className="text-3xl font-bold">Campaign launched! 🎉</div>
      <div className="text-muted-foreground mt-2">Escrow funded — redirecting…</div>
    </div>
  );
}
