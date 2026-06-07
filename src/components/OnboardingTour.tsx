import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const STEPS = [
  { title: "Welcome to your Vault", body: "Upload medical records — we anonymize them automatically." },
  { title: "Meet your AI Assistant", body: "Ask plain-language questions about your health records." },
  { title: "Browse the Marketplace", body: "Find research campaigns and earn HLTH for sharing data." },
  { title: "Track your Earnings", body: "See every HLTH you've earned and from whom." },
  { title: "Your Data NFT", body: "Cryptographic proof that you — and only you — own your medical identity." },
];

export function OnboardingTour() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== "patient") return;
    if (!localStorage.getItem("sh-tour-done")) setOpen(true);
  }, [user, profile]);

  const close = () => { localStorage.setItem("sh-tour-done", "1"); setOpen(false); };

  if (!open) return null;
  const s = STEPS[step];
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-xs uppercase tracking-widest text-accent mb-3">Step {step + 1} of {STEPS.length}</div>
          <h2 className="text-2xl font-bold mb-2">{s.title}</h2>
          <p className="text-muted-foreground">{s.body}</p>
          <div className="flex gap-1 justify-center mt-6 mb-6">
            {STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : "w-1.5 bg-muted"}`} />)}
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={close} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Skip tour</button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium">Next</button>
            ) : (
              <button onClick={close} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium">Get started</button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
