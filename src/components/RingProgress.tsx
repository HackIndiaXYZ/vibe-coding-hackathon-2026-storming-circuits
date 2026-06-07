export function RingProgress({ value, size = 160, label, sublabel, color }: { value: number; size?: number; label?: string; sublabel?: string; color?: string }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const stroke = color || (value >= 75 ? "var(--success)" : value >= 50 ? "#FFB020" : "#EF4444");
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={stroke} strokeWidth={10} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{Math.round(value)}</div>
        {label && <div className="text-xs text-muted-foreground mt-0.5">{label}</div>}
        {sublabel && <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}