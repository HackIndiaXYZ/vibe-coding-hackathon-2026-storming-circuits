import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Wallet, Shield, Copy, LogOut, Save, Loader2, Phone, Cake } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters")
    .regex(/^[\p{L}\p{M}'’\-.\s]+$/u, "Only letters, spaces, hyphens and apostrophes allowed"),
  age: z
    .number({ invalid_type_error: "Age is required" })
    .int("Age must be a whole number")
    .min(1, "Age must be at least 1")
    .max(120, "Age must be 120 or less"),
  contact_number: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^\+?[0-9\s\-()]{7,20}$/.test(v),
      "Enter a valid phone number (7–20 digits, may include +, spaces, -)"
    ),
});

type FieldErrors = Partial<Record<"full_name" | "age" | "contact_number" | "pw", string>>;

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [age, setAge] = useState<string>(profile?.age != null ? String(profile.age) : "");
  const [contact, setContact] = useState<string>(profile?.contact_number ?? "");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAge(profile?.age != null ? String(profile.age) : "");
    setContact(profile?.contact_number ?? "");
  }, [profile?.full_name, profile?.age, profile?.contact_number]);

  const save = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({
      full_name: fullName,
      age: age === "" ? Number.NaN : Number(age),
      contact_number: contact || undefined,
    });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.full_name,
        age: parsed.data.age,
        contact_number: parsed.data.contact_number ?? null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Profile saved successfully");
  };

  const changePw = async () => {
    if (pw.length < 8) {
      setErrors((e) => ({ ...e, pw: "Password must be at least 8 characters" }));
      return toast.error("Password must be at least 8 characters");
    }
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
      setErrors((e) => ({ ...e, pw: "Use both letters and numbers" }));
      return toast.error("Password must contain letters and numbers");
    }
    setErrors((e) => ({ ...e, pw: undefined }));
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated successfully");
  };

  const copyWallet = () => {
    if (!profile?.wallet_address) return;
    navigator.clipboard.writeText(profile.wallet_address);
    toast.success("Wallet copied");
  };

  const out = async () => { await signOut(); navigate({ to: "/" }); };

  const initial = (profile?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const dirty =
    fullName !== (profile?.full_name ?? "") ||
    age !== (profile?.age != null ? String(profile.age) : "") ||
    contact !== (profile?.contact_number ?? "");

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 glass-card rounded-2xl p-5 sm:p-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full btn-gradient flex items-center justify-center text-2xl sm:text-3xl font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">{profile?.full_name || "Unnamed"}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
            <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{user?.email}</span>
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">
            <Shield className="w-3 h-3" /> {profile?.role}
          </div>
        </div>
      </div>

      <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2"><User className="w-4 h-4 text-accent" /> Personal Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled className="opacity-70" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age" className="flex items-center gap-1.5">
              <Cake className="w-3.5 h-3.5" /> Age <span className="text-destructive">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              aria-invalid={!!errors.age}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact" className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contact Number
            </Label>
            <Input
              id="contact"
              type="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+91 98765 43210"
              maxLength={20}
              aria-invalid={!!errors.contact_number}
            />
            {errors.contact_number && <p className="text-xs text-destructive">{errors.contact_number}</p>}
          </div>
        </div>
        <Button onClick={save} disabled={saving || !dirty} className="btn-gradient">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
        </Button>
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-accent" /> Wallet</h2>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-muted border border-border font-mono text-xs sm:text-sm break-all">{profile?.wallet_address || "—"}</code>
          <Button variant="outline" size="sm" onClick={copyWallet}><Copy className="w-4 h-4 mr-1.5" /> Copy</Button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-accent" /> Security</h2>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New Password</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Min 8 chars, letters + numbers"
              aria-invalid={!!errors.pw}
            />
            <Button onClick={changePw} disabled={pwBusy || pw.length < 8} variant="outline">
              {pwBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Update
            </Button>
          </div>
          {errors.pw && <p className="text-xs text-destructive">{errors.pw}</p>}
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="outline" onClick={out} className="text-destructive hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
