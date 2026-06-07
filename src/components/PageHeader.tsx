export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "cyan" | "purple" | "success" | "primary" }) {
  const color = accent === "cyan" ? "text-[color:var(--cyan-accent)]" :
                accent === "purple" ? "text-[color:var(--purple-accent)]" :
                accent === "success" ? "text-[color:var(--success)]" :
                accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
