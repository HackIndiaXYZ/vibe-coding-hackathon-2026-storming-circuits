import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { explainTerm } from "@/lib/ai.functions";

type TermType = "medicine" | "disease";
interface Explanation {
  type: TermType;
  summary: string;
  keyFact: string;
  bullets: string[];
  watchout: string;
}

const cache = new Map<string, Promise<Explanation>>();

function getExplanation(term: string, type: TermType): Promise<Explanation> {
  const key = `${type}:${term.toLowerCase()}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      explainTerm({ data: { term, type } })
        .then((r) => r as Explanation)
        .catch((e) => {
          cache.delete(key);
          throw e;
        }),
    );
  }
  return cache.get(key)!;
}

interface Props {
  term: string;
  type: TermType;
  children?: React.ReactNode;
  className?: string;
}

export function MedicalTerm({ term, type, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const handleEnter = () => {
    cancelTimers();
    openTimer.current = window.setTimeout(async () => {
      setOpen(true);
      if (!data) {
        setLoading(true);
        try {
          const r = await getExplanation(term, type);
          setData(r);
        } catch {
          /* ignore */
        } finally {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handleLeave = () => {
    cancelTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  };

  const isMed = type === "medicine";
  const badgeColor = isMed
    ? "bg-[color:var(--cyan-accent)]/15 text-[color:var(--cyan-accent)] border-[color:var(--cyan-accent)]/40"
    : "bg-[color:var(--purple-accent)]/15 text-[color:var(--purple-accent)] border-[color:var(--purple-accent)]/40";
  const underline = isMed ? "decoration-[color:var(--cyan-accent)]/60" : "decoration-[color:var(--purple-accent)]/60";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={handleEnter}
          onBlur={handleLeave}
          tabIndex={0}
          className={`cursor-help underline decoration-dotted underline-offset-4 ${underline} ${className || ""}`}
        >
          {children || term}
        </span>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={() => cancelTimers()}
        onMouseLeave={handleLeave}
        className="w-[280px] p-0 border-border bg-card/90 backdrop-blur-xl shadow-2xl animate-fade-in"
        sideOffset={6}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {isMed ? "💊 Medicine" : "🦠 Disease"}
            </span>
            <span className="font-semibold text-sm truncate">{term}</span>
          </div>
          {loading || !data ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2 mt-3" />
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <Section title="What is it?">{data.summary}</Section>
              <Section title="Key fact">{data.keyFact}</Section>
              <Section title={isMed ? "Common uses" : "Symptoms"}>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {data.bullets.slice(0, 2).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </Section>
              <Section title={isMed ? "Watch out for" : "Management"}>{data.watchout}</Section>
            </div>
          )}
          <div className="text-[10px] text-muted-foreground/70 mt-3 pt-3 border-t border-border">
            Powered by AI · Not medical advice
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-foreground leading-relaxed">{children}</div>
    </div>
  );
}