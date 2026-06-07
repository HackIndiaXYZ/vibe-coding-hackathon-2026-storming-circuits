import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import { HelpPanel } from "@/components/HelpPanel";
import { OnboardingTour } from "@/components/OnboardingTour";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/" }); return; }
    if (!profile) return;
    if (path.startsWith("/patient") && profile.role !== "patient") navigate({ to: "/researcher/campaigns" });
    if (path.startsWith("/researcher") && profile.role !== "researcher") navigate({ to: "/patient/vault" });
  }, [user, profile, loading, path, navigate]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1.5">
          <span className="pulse-dot w-2 h-2 rounded-full bg-accent" />
          <span className="pulse-dot w-2 h-2 rounded-full bg-accent" />
          <span className="pulse-dot w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-8 fade-up">
        <Outlet />
      </main>
      <HelpPanel />
      <OnboardingTour />
    </div>
  );
}
