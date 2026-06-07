import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  Copy, LogOut, Menu, X, Moon, Sun,
  LayoutDashboard, FolderLock, Clock, Target, Sparkles, ShoppingBag,
  Coins, ShieldCheck, BadgeCheck, UserPlus, Trophy,
  Home, Megaphone, PlusSquare, Compass, Download, BarChart3, FileSignature, Pill,
  MapPin, Gift,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { useTheme } from "@/lib/theme";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Item { to: string; label: string; Icon: any; }

const patientNav: Item[] = [
  { to: "/patient/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/patient/vault", label: "Vault", Icon: FolderLock },
  { to: "/patient/timeline", label: "Timeline", Icon: Clock },
  { to: "/patient/goals", label: "Goals", Icon: Target },
  { to: "/patient/insights", label: "Insights", Icon: Sparkles },
  { to: "/patient/interactions", label: "Interactions", Icon: Pill },
  { to: "/patient/places", label: "Nearby", Icon: MapPin },
  { to: "/patient/marketplace", label: "Marketplace", Icon: ShoppingBag },
  { to: "/patient/earnings", label: "Earnings", Icon: Coins },
  { to: "/patient/redeem", label: "Redeem", Icon: Gift },
  { to: "/patient/privacy", label: "Privacy", Icon: ShieldCheck },
  { to: "/patient/data-nft", label: "Data NFT", Icon: BadgeCheck },
  { to: "/patient/referrals", label: "Refer", Icon: UserPlus },
  { to: "/patient/leaderboard", label: "Top", Icon: Trophy },
];
const researcherNav: Item[] = [
  { to: "/researcher/home", label: "Home", Icon: Home },
  { to: "/researcher/campaigns", label: "Campaigns", Icon: Megaphone },
  { to: "/researcher/create", label: "Create", Icon: PlusSquare },
  { to: "/researcher/explorer", label: "Explorer", Icon: Compass },
  { to: "/researcher/downloads", label: "Downloads", Icon: Download },
  { to: "/researcher/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/researcher/contracts", label: "Contracts", Icon: FileSignature },
];

export function TopNav() {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = profile?.role === "researcher" ? researcherNav : patientNav;
  const wallet = profile?.wallet_address || "0x0000...0000";
  const initial = (profile?.full_name?.[0] || "U").toUpperCase();

  const copyWallet = () => { navigator.clipboard.writeText(wallet); toast.success("Wallet copied"); };
  const out = async () => { await signOut(); navigate({ to: "/" }); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="text-accent font-semibold text-lg flex items-center gap-1.5 shrink-0">
            <span className="text-xl">⬡</span> <span className="hidden sm:inline">Sovereign Health</span>
          </Link>
          <TooltipProvider delayDuration={150}>
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0">
              {items.map((i) => {
                const { Icon } = i;
                const base = "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:-translate-y-0.5 shrink-0";
                const active = "p-2 rounded-lg text-accent bg-accent/10 shrink-0";
                return (
                  <Tooltip key={i.to}>
                    <TooltipTrigger asChild>
                      <Link to={i.to} aria-label={i.label} className={base} activeProps={{ className: active }}>
                        <Icon className="w-4 h-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{i.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden 2xl:block"><GlobalSearch /></div>
            <NotificationBell />
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={copyWallet} className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-mono text-muted-foreground hover:text-foreground transition border border-border">
              {wallet} <Copy className="w-3 h-3" />
            </button>
            <Link to="/profile" aria-label="Profile" className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-xs font-semibold shrink-0 hover:brightness-110 transition" title="Profile">{initial}</Link>
            <button onClick={out} className="hidden sm:flex p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Sign out"><LogOut className="w-4 h-4" /></button>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition">{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
          </div>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto bg-background animate-fade-in">
          {items.map((i) => {
            const { Icon } = i;
            return (
              <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Icon className="w-4 h-4" /> {i.label}
              </Link>
            );
          })}
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <span className="w-4 h-4 inline-flex items-center justify-center">👤</span> Profile
          </Link>
          <button onClick={out} className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">Sign out</button>
        </div>
      )}
    </header>
  );
}
