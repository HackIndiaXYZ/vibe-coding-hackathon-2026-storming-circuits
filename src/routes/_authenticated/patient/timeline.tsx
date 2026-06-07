import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/timeline")({ component: Timeline });

interface Event { id: string; date: string; event_type: string; title: string; description: string | null; severity: string; }

const TYPES = ["Lab Result", "Prescription", "Diagnosis", "Hospitalization", "Vaccination"];
const SEVERITY_COLOR: Record<string, string> = { low: "bg-[color:var(--success)]", medium: "bg-orange-400", high: "bg-destructive" };

function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [type, setType] = useState("");
  const [year, setYear] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ date: "", event_type: "Lab Result", title: "", description: "", severity: "low" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("health_timeline").select("*").eq("user_id", user.id).order("date", { ascending: false });
    setEvents((data || []) as Event[]);
  };
  useEffect(() => { load(); }, [user]);

  const filtered = events.filter((e) => (!type || e.event_type === type) && (!year || e.date.startsWith(year)));
  const years = Array.from(new Set(events.map((e) => e.date.slice(0, 4))));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("health_timeline").insert({ ...draft, user_id: user.id });
    if (error) return toast.error(error.message);
    setOpen(false); toast.success("Event added"); load();
    setDraft({ date: "", event_type: "Lab Result", title: "", description: "", severity: "low" });
  };

  const summary = events.length ? `In ${new Date().getFullYear()}, you logged ${events.length} health events across ${new Set(events.map(e => e.event_type)).size} categories.` : "";

  return (
    <>
      <PageHeader title="Health Timeline" subtitle="Your chronological medical history" right={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="btn-gradient rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add event</button></DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Health Event</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <select value={draft.event_type} onChange={(e) => setDraft({ ...draft, event_type: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input required placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2" />
              <textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2 min-h-[80px]" />
              <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} className="w-full rounded-lg bg-muted border border-border px-3 py-2">
                <option value="low">Low severity</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              <button type="submit" className="btn-gradient rounded-lg w-full py-2 font-medium">Add event</button>
            </form>
          </DialogContent>
        </Dialog>
      } />
      {summary && <div className="glass-card rounded-xl p-4 mb-6 text-sm text-muted-foreground">{summary}</div>}
      <div className="flex flex-wrap gap-2 mb-6">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm"><option value="">All years</option>{years.map(y => <option key={y}>{y}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm"><option value="">All types</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
        {filtered.map((e) => (
          <div key={e.id} className="relative mb-6">
            <div className={`absolute -left-[22px] top-3 w-3 h-3 rounded-full ${SEVERITY_COLOR[e.severity]} ring-4 ring-background`} />
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">{e.event_type}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
              </div>
              <div className="font-medium">{e.title}</div>
              {e.description && <div className="text-sm text-muted-foreground mt-1">{e.description}</div>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-muted-foreground text-sm">No events match these filters.</div>}
        {events.length === 0 && (
          <div className="glass-card rounded-xl p-6 text-sm text-muted-foreground">
            No timeline events yet. Click <strong>Add event</strong> to log your first one, or upload reports in the Vault — diagnoses get pulled in automatically.
          </div>
        )}
      </div>
    </>
  );
}