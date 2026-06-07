import { useEffect, useState } from "react";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { FileText, FlaskConical, LayoutDashboard, Search } from "lucide-react";

const PATIENT_PAGES = [
  { label: "Dashboard", to: "/patient/dashboard" },
  { label: "Vault", to: "/patient/vault" },
  { label: "Timeline", to: "/patient/timeline" },
  { label: "Goals", to: "/patient/goals" },
  { label: "Insights", to: "/patient/insights" },
  { label: "Marketplace", to: "/patient/marketplace" },
  { label: "Earnings", to: "/patient/earnings" },
  { label: "Privacy", to: "/patient/privacy" },
  { label: "Data NFT", to: "/patient/data-nft" },
  { label: "Referrals", to: "/patient/referrals" },
  { label: "Leaderboard", to: "/patient/leaderboard" },
];
const RESEARCHER_PAGES = [
  { label: "Home", to: "/researcher/home" },
  { label: "Campaigns", to: "/researcher/campaigns" },
  { label: "Create Campaign", to: "/researcher/create" },
  { label: "Cohort Explorer", to: "/researcher/explorer" },
  { label: "Data Downloads", to: "/researcher/downloads" },
  { label: "Analytics", to: "/researcher/analytics" },
  { label: "Contracts", to: "/researcher/contracts" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<{ id: string; file_name: string }[]>([]);
  const [camps, setCamps] = useState<{ id: string; name: string }[]>([]);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const pages = profile?.role === "researcher" ? RESEARCHER_PAGES : PATIENT_PAGES;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("health_records").select("id,file_name").eq("user_id", user.id).then(({ data }) => setRecords(data || []));
    supabase.from("campaigns").select("id,name").limit(10).then(({ data }) => setCamps((data || []) as any));
  }, [open, user]);

  const go = (to: string) => { setOpen(false); navigate({ to }); };

  return (
    <>
      <button onClick={() => setOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground border border-border transition min-w-[180px]">
        <Search className="w-3.5 h-3.5" /> Search…
        <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-background border border-border">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-card border-border max-w-xl">
          <Command className="bg-card">
            <CommandInput placeholder="Search pages, records, campaigns…" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup heading="Pages">
                {pages.map((p) => <CommandItem key={p.to} onSelect={() => go(p.to)}><LayoutDashboard className="w-4 h-4 mr-2" />{p.label}</CommandItem>)}
              </CommandGroup>
              {records.length > 0 && <CommandGroup heading="Records">
                {records.map((r) => <CommandItem key={r.id} onSelect={() => go("/patient/vault")}><FileText className="w-4 h-4 mr-2" />{r.file_name}</CommandItem>)}
              </CommandGroup>}
              {camps.length > 0 && <CommandGroup heading="Campaigns">
                {camps.map((c) => <CommandItem key={c.id} onSelect={() => go(profile?.role === "researcher" ? "/researcher/campaigns" : "/patient/marketplace")}><FlaskConical className="w-4 h-4 mr-2" />{c.name}</CommandItem>)}
              </CommandGroup>}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}