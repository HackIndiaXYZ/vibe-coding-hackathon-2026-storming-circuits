import { useEffect, useState } from "react";
import { Bell, Coins, FlaskConical, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notif { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string; }

const ICONS: Record<string, any> = { reward: Coins, match: FlaskConical, alert: AlertTriangle, system: Info };
const COLORS: Record<string, string> = { reward: "text-[color:var(--cyan-accent)]", match: "text-primary", alert: "text-orange-400", system: "text-muted-foreground" };

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setItems((data || []) as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) === 0) {
        await supabase.from("notifications").insert([
          { user_id: user.id, title: "🎉 New campaign matches your profile", message: "Diabetes Longitudinal Study is looking for participants like you.", type: "match" },
          { user_id: user.id, title: "💰 You earned 40 HLTH", message: "Your data was used in the Hypertension Cohort.", type: "reward" },
          { user_id: user.id, title: "⚠️ HbA1c flagged", message: "Your latest reading (7.2%) is above the normal range.", type: "alert" },
        ]);
      }
      load();
    })();
  }, [user]);

  const unread = items.filter((i) => !i.is_read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    load();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
          <Bell className="w-4 h-4" />
          {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-card border-border p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold text-sm">Notifications</div>
          <button onClick={markAll} className="text-xs text-accent hover:underline">Mark all read</button>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>}
          {items.map((n) => {
            const Icon = ICONS[n.type] || Info;
            return (
              <div key={n.id} className={`p-3 flex gap-3 ${!n.is_read ? "bg-accent/5" : ""}`}>
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${COLORS[n.type] || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}