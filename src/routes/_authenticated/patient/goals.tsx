import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/goals")({ component: Goals });

interface Goal { id: string; goal_type: string; target_value: string; current_value: string | null; deadline: string | null; status: string; }

const SEED: Omit<Goal, "id">[] = [
  { goal_type: "Bring HbA1c below 6.5%", target_value: "6.5%", current_value: "7.2%", deadline: "2025-12-31", status: "active" },
  { goal_type: "Blood pressure below 130/80", target_value: "130/80", current_value: "138/86", deadline: "2025-09-30", status: "active" },
  { goal_type: "Walk 8,000 steps/day", target_value: "8000", current_value: "8420", deadline: "2025-08-15", status: "completed" },
];

const TIPS: Record<string, string> = {
  "Bring HbA1c below 6.5%": "Reducing daily carb intake by 20% and adding 30 min of brisk walking could help you reach this goal 2 months earlier.",
  "Blood pressure below 130/80": "Cutting sodium to <2g/day and practicing daily breathwork has shown 8–10mmHg systolic reduction in studies.",
  "Walk 8,000 steps/day": "You're already exceeding your target — set a stretch goal of 10,000 to maintain momentum.",
};

function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ goal_type: "", target_value: "", current_value: "", deadline: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("health_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if ((data || []).length === 0) {
      await supabase.from("health_goals").insert(SEED.map((g) => ({ ...g, user_id: user.id })));
      const { data: d2 } = await supabase.from("health_goals").select("*").eq("user_id", user.id);
      setGoals((d2 || []) as Goal[]);
    } else setGoals((data || []) as Goal[]);
  };
  useEffect(() => { load(); }, [user]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("health_goals").insert({ ...d, user_id: user.id, status: "active" });
    if (error) return toast.error(error.message);
    setOpen(false); toast.success("Goal set"); load();
  };

  return (
    <>
      <PageHeader title="Health Goals" subtitle="Set targets, track progress, get AI coaching" right={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Set new goal</button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <input required placeholder="Goal (e.g. Lower HbA1c)" value={d.goal_type} onChange={(e) => setD({ ...d, goal_type: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <input required placeholder="Target value" value={d.target_value} onChange={(e) => setD({ ...d, target_value: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <input placeholder="Current value" value={d.current_value} onChange={(e) => setD({ ...d, current_value: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <input type="date" value={d.deadline} onChange={(e) => setD({ ...d, deadline: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <button type="submit" className="btn-gradient rounded-lg w-full py-2 font-medium">Create goal</button>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {goals.map((g) => {
            const isDone = g.status === "completed";
            const daysLeft = g.deadline ? Math.max(0, Math.round((new Date(g.deadline).getTime() - Date.now()) / 86400000)) : 0;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 relative overflow-hidden">
                {isDone && <div className="absolute top-2 right-3 text-2xl select-none">🎉</div>}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-semibold">{g.goal_type}</div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${isDone ? "bg-success/10 text-[color:var(--success)] border-[color:var(--success)]/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                    {isDone ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span> : `${daysLeft}d left`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div><div className="text-muted-foreground text-xs">Current</div><div className="font-medium">{g.current_value || "—"}</div></div>
                  <div><div className="text-muted-foreground text-xs">Target</div><div className="font-medium text-[color:var(--cyan-accent)]">{g.target_value}</div></div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full btn-gradient" style={{ width: isDone ? "100%" : "62%" }} />
                </div>
              </motion.div>
            );
          })}
        </div>
        <aside className="glass-card rounded-2xl p-5 h-fit">
          <h3 className="font-semibold flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-accent" /> AI Goal Coach</h3>
          <div className="space-y-3">
            {goals.filter(g => g.status === "active").map((g) => (
              <div key={g.id} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs font-medium text-accent mb-1">{g.goal_type}</div>
                <div className="text-sm text-muted-foreground">{TIPS[g.goal_type] || "Stay consistent and track weekly. Small daily wins compound."}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}