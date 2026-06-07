import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { ShieldCheck, Sparkles, Wallet, Upload, FileCheck2, Coins, Microscope, Database, LineChart, Quote, ArrowRight } from "lucide-react";
import type { Role } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sovereign Health — Own Your Medical Identity" },
    { name: "description", content: "Decentralized health data platform. Control your records, earn HLTH from medical research." },
  ]}),
  component: Landing,
});

const TICKER = [
  "Anon-3F2A earned 12 HLTH · Diabetes Study",
  "Anon-7C91 granted access · Cardio Cohort 2026",
  "Anon-B4D2 earned 25 HLTH · Long COVID Registry",
  "Anon-19EE uploaded HbA1c panel",
  "Anon-AA02 earned 8 HLTH · Sleep Apnea Index",
  "Anon-44FE granted access · Oncology Phase II",
  "Anon-D811 earned 40 HLTH · Rare Disease Atlas",
  "Anon-9920 uploaded lipid panel",
];
const STATS = [
  { v: 12480, l: "Patients onboarded" },
  { v: 217, l: "Active campaigns" },
  { v: 1840000, l: "HLTH paid out", prefix: "", suffix: "" },
  { v: 96, l: "Avg quality score", suffix: "/100" },
];
const TESTIMONIALS = [
  { q: "Finally my records belong to me. The Vault makes uploads dead simple — and getting paid for research feels overdue.", n: "Aisha M.", r: "Patient · T2 Diabetes" },
  { q: "We filled a 500-patient cohort in 72 hours. The consent UX is the cleanest I've seen in healthtech.", n: "Dr. Patel", r: "Principal Investigator, Stanford" },
  { q: "AI insights helped me actually understand my labs. Worth the switch.", n: "Marcus T.", r: "Patient · Hypertension" },
];

function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const start = Date.now(), dur = 1400;
        const tick = () => {
          const p = Math.min(1, (Date.now() - start) / dur);
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <div ref={ref} className="text-4xl sm:text-5xl font-bold text-gradient">{prefix}{n.toLocaleString()}{suffix}</div>;
}

function Landing() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("patient");

  useEffect(() => {
    if (!loading && profile) navigate({ to: profile.role === "patient" ? "/patient/vault" : "/researcher/campaigns" });
  }, [loading, profile, navigate]);

  const openAs = (r: Role) => { setRole(r); setOpen(true); };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-accent font-semibold text-lg flex items-center gap-1.5"><span className="text-xl">⬡</span> Sovereign Health</div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#stats" className="hover:text-foreground transition">Impact</a>
          <a href="#researchers" className="hover:text-foreground transition">For researchers</a>
          <a href="#voices" className="hover:text-foreground transition">Voices</a>
        </nav>
        <button onClick={() => openAs("patient")} className="text-sm px-4 py-1.5 rounded-lg border border-border hover:border-accent transition">Sign in</button>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 text-center fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Powered by zero-knowledge anonymization
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
          Own Your<br/>Medical Identity
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-[color:var(--cyan-accent)] max-w-2xl mx-auto font-light">
          Control your health data. Earn from medical innovation.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => openAs("patient")} className="animated-border rounded-xl">
            <span className="block px-8 py-4 rounded-[10px] btn-gradient font-semibold">I'm a Patient</span>
          </button>
          <button onClick={() => openAs("researcher")} className="px-8 py-4 rounded-xl border border-border bg-card hover:border-accent transition font-semibold">
            I'm a Researcher
          </button>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-4">
          {[
            { i: ShieldCheck, t: "Anonymized by default", d: "Names and identifiers never leave your device." },
            { i: Wallet, t: "Tokenized incentives", d: "Earn HLTH when researchers access your data." },
            { i: Sparkles, t: "AI-assisted insights", d: "Understand your records in plain language." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="glass-card rounded-2xl p-6 text-left">
              <Icon className="w-6 h-6 text-accent mb-3" />
              <div className="font-semibold mb-1">{t}</div>
              <div className="text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live activity ticker */}
      <section className="relative z-10 border-y border-border bg-card/40 backdrop-blur-sm overflow-hidden py-3">
        <div className="flex gap-12 marquee-track whitespace-nowrap text-sm text-muted-foreground" style={{ width: "max-content" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)] animate-pulse" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-3">How it works</div>
          <h2 className="text-3xl sm:text-5xl font-bold">From upload to payout in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { i: Upload, t: "Upload privately", d: "Drop PDFs, labs, prescriptions. We anonymize on-device before anything syncs." },
            { i: FileCheck2, t: "Grant access", d: "Browse campaigns that match your conditions and toggle consent — revocable any time." },
            { i: Coins, t: "Earn HLTH", d: "When a study settles, rewards land in your wallet automatically." },
          ].map(({ i: Icon, t, d }, idx) => (
            <div key={t} className="glass-card rounded-2xl p-7 relative">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-sm font-bold">{idx + 1}</div>
              <Icon className="w-8 h-8 text-accent mb-4 mt-2" />
              <div className="font-semibold text-lg mb-1">{t}</div>
              <div className="text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="glass-card rounded-3xl p-10 sm:p-14 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.l}>
              <Counter to={s.v} suffix={s.suffix} prefix={s.prefix} />
              <div className="mt-2 text-sm text-muted-foreground uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* For researchers */}
      <section id="researchers" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--purple-accent)] mb-3">For researchers</div>
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">Cohorts that used to take months — built in days.</h2>
            <p className="mt-5 text-lg text-muted-foreground">Define a campaign with the conditions, demographics, and geography you need. Escrow HLTH up front. Get verifiable, anonymized, FHIR-ready records as patients consent.</p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => openAs("researcher")} className="animated-border rounded-xl">
                <span className="block px-6 py-3 rounded-[10px] btn-gradient font-semibold inline-flex items-center gap-2">Start a campaign <ArrowRight className="w-4 h-4" /></span>
              </button>
              <a href="#how" className="px-6 py-3 rounded-xl border border-border hover:border-accent transition font-semibold">See workflow</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { i: Microscope, t: "Verified cohorts", d: "Quality-scored records only." },
              { i: Database, t: "FHIR R4 exports", d: "Direct CSV / JSON download." },
              { i: LineChart, t: "Live analytics", d: "Heatmaps, scatter, demographics." },
              { i: ShieldCheck, t: "Auditable consent", d: "Hash-anchored on-chain trail." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="glass-card rounded-2xl p-5">
                <Icon className="w-6 h-6 text-[color:var(--purple-accent)] mb-3" />
                <div className="font-semibold">{t}</div>
                <div className="text-xs text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="voices" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Voices</div>
          <h2 className="text-3xl sm:text-5xl font-bold">Patients and PIs, side by side.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <figure key={t.n} className="glass-card rounded-2xl p-7">
              <Quote className="w-7 h-7 text-accent/60 mb-3" />
              <blockquote className="text-sm leading-relaxed">"{t.q}"</blockquote>
              <figcaption className="mt-5 pt-4 border-t border-border">
                <div className="font-semibold text-sm">{t.n}</div>
                <div className="text-xs text-muted-foreground">{t.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="glass-card rounded-3xl p-12 animated-border">
          <h2 className="text-3xl sm:text-4xl font-bold">Your data. Your terms. Your rewards.</h2>
          <p className="mt-3 text-muted-foreground">Join thousands reshaping how medical research gets done.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => openAs("patient")} className="px-8 py-4 rounded-xl btn-gradient font-semibold">Claim your vault</button>
            <button onClick={() => openAs("researcher")} className="px-8 py-4 rounded-xl border border-border hover:border-accent transition font-semibold">Launch a campaign</button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
        ⬡ Sovereign Health · Built on zero-knowledge primitives · © 2026
      </footer>

      <AuthModal open={open} onOpenChange={setOpen} defaultRole={role} />
    </main>
  );
}
