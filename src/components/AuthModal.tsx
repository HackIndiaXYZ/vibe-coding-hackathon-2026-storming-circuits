import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type { Role } from "@/lib/auth-context";
import { Eye, EyeOff, Mail, Sparkles, Stethoscope, Microscope } from "lucide-react";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; defaultRole?: Role; }

function strength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-[color:var(--success)]", "bg-[color:var(--success)]"];
  return { score: s, label: labels[s], color: colors[s] };
}

export function AuthModal({ open, onOpenChange, defaultRole = "patient" }: Props) {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>(defaultRole);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);
  const navigate = useNavigate();
  const pwMeter = strength(password);

  const go = (r: Role) => navigate({ to: r === "patient" ? "/patient/vault" : "/researcher/campaigns" });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role }, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to Sovereign Health");
    onOpenChange(false); go(role);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    toast.success("Signed in");
    onOpenChange(false); go((p?.role as Role) || "patient");
  };

  const sendMagicLink = async () => {
    if (!email) return toast.error("Enter your email first");
    setMagicBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMagicBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox for a sign-in link");
  };

  const sendReset = async () => {
    if (!email) return toast.error("Enter your email above first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-accent/20 via-[color:var(--purple-accent)]/10 to-transparent p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⬡</span>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sovereign Health</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {tab === "signup" ? "Own your health data" : "Welcome back"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "signup" ? "Create an account in seconds — no credit card required." : "Sign in to your encrypted vault."}
          </p>
        </div>
        <div className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "login")}>
          <TabsList className="grid grid-cols-2 w-full bg-muted">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Log In</TabsTrigger>
          </TabsList>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 mt-4">
              <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${pwMeter.color} transition-all duration-300`} style={{ width: `${(pwMeter.score / 5) * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{pwMeter.label}</div>
                  </div>
                )}
              </div>
              <div>
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(["patient","researcher"] as Role[]).map((r) => {
                    const Icon = r === "patient" ? Stethoscope : Microscope;
                    return (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        className={`rounded-lg border px-3 py-2 text-sm capitalize transition inline-flex items-center justify-center gap-1.5 ${role===r ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        <Icon className="w-4 h-4" /> {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full btn-gradient rounded-lg">
                {busy ? "Creating…" : <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Create account</span>}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">By signing up you agree to our terms and privacy notice.</p>
            </form>
          </TabsContent>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <button type="button" onClick={sendReset} className="text-[11px] text-accent hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full btn-gradient rounded-lg">{busy ? "Signing in…" : "Sign in"}</Button>
              <div className="relative my-2">
                <div className="h-px bg-border" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
              </div>
              <Button type="button" variant="outline" disabled={magicBusy} onClick={sendMagicLink} className="w-full rounded-lg inline-flex items-center justify-center gap-1.5">
                <Mail className="w-4 h-4" /> {magicBusy ? "Sending…" : "Email me a sign-in link"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
