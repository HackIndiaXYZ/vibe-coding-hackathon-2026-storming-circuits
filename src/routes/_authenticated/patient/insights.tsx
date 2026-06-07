import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { Send, FileText, Sparkles, Bookmark, Globe2, Baby, Copy, ThumbsUp, ThumbsDown, Plus, Trash2, Mic, FileDown } from "lucide-react";
import { toast } from "sonner";
import { askHealthAI } from "@/lib/ai.functions";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/patient/insights")({ component: Insights });

interface Msg { role: "user" | "ai"; content: string; }
interface SavedChat { id: string; title: string; msgs: Msg[]; date: string; }

const STORAGE_KEY = "sovereign_chats";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ta", label: "தமிழ்" },
  { code: "es", label: "Español" },
];

const STARTERS = [
  "Explain my HbA1c result",
  "What does eGFR mean for my kidneys?",
  "Am I at risk for diabetes complications?",
  "Summarize my health records",
  "What questions should I ask my doctor?",
];

const INTRO: Msg = { role: "ai", content: "Hi! I'm your AI health assistant. Select records on the left and ask me anything about your data." };

function Insights() {
  const { user } = useAuth();
  const [records, setRecords] = useState<{ id: string; file_name: string; anonymized_json: any }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msgs, setMsgs] = useState<Msg[]>([INTRO]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState("en");
  const [eli5, setEli5] = useState(false);
  const [saved, setSaved] = useState<SavedChat[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = (next: SavedChat[]) => {
    setSaved(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("health_records").select("id,file_name,anonymized_json").eq("user_id", user.id).eq("status", "ready").then(({ data }) => {
      setRecords((data || []) as any);
      setSelected(new Set((data || []).map((r) => r.id)));
    });
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setTyping(true);
    try {
      const payload = records
        .filter((r) => selected.has(r.id))
        .map((r) => ({ file_name: r.file_name, data: r.anonymized_json }));
      const { reply } = await askHealthAI({
        data: { question: text, records: payload, eli5, language: lang },
      });
      setMsgs((m) => [...m, { role: "ai", content: reply }]);
    } catch (e: any) {
      toast.error(e?.message || "AI request failed");
      setMsgs((m) => [...m, { role: "ai", content: "Sorry — I couldn't reach the AI service just now. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  const saveCurrent = () => {
    if (msgs.length < 2) return null;
    const title = msgs.find((m) => m.role === "user")?.content?.slice(0, 50) || "Conversation";
    const id = currentId || crypto.randomUUID();
    const entry: SavedChat = { id, title, msgs, date: new Date().toISOString() };
    const next = [entry, ...saved.filter((s) => s.id !== id)];
    persist(next);
    setCurrentId(id);
    return id;
  };

  const newChat = () => {
    saveCurrent();
    setMsgs([INTRO]);
    setCurrentId(null);
    setFeedback({});
  };

  const openChat = (c: SavedChat) => {
    saveCurrent();
    setMsgs(c.msgs);
    setCurrentId(c.id);
    setFeedback({});
  };

  const deleteChat = (id: string) => {
    persist(saved.filter((s) => s.id !== id));
    if (id === currentId) { setMsgs([INTRO]); setCurrentId(null); }
  };

  const copyMsg = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const userExchanges = msgs.filter((m) => m.role === "user").length;

  const generateReport = async () => {
    setTyping(true);
    try {
      const transcript = msgs.map((m) => `${m.role === "user" ? "Patient" : "Assistant"}: ${m.content}`).join("\n\n");
      const { reply } = await askHealthAI({
        data: {
          question:
            "Based on the conversation above, generate a structured health summary the patient can bring to their doctor. Include: Key concerns discussed, Questions to ask, Action items. Format as plain text with clear section headers.",
          records: [{ file_name: "conversation.txt", data: { transcript } as any }],
          eli5: false,
          language: lang,
        },
      });
      const blob = new Blob([reply], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-report-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch (e: any) {
      toast.error(e?.message || "Could not generate report");
    } finally {
      setTyping(false);
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const t = e.target;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  };

  return (
    <>
      <PageHeader title="AI Health Assistant" subtitle="Ask questions about your records in plain language" right={
        <div className="flex gap-2">
          <button onClick={() => { saveCurrent(); toast.success("Chat saved"); }} className="text-xs px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Save</button>
          {userExchanges >= 3 && (
            <button onClick={generateReport} className="text-xs px-3 py-2 rounded-lg btn-gradient inline-flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> Health Report</button>
          )}
        </div>
      } />
      <div className="grid lg:grid-cols-10 gap-6 h-[calc(100vh-260px)]">
        <aside className="lg:col-span-3 glass-card rounded-2xl p-4 overflow-y-auto">
          <button onClick={newChat} className="w-full mb-4 btn-gradient rounded-lg py-2 text-sm font-medium inline-flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Records in context</div>
          {records.length === 0 && <div className="text-sm text-muted-foreground">No ready records yet. Upload some in the Vault.</div>}
          <div className="space-y-2">
            {records.map((r) => {
              const on = selected.has(r.id);
              return (
                <button key={r.id} onClick={() => { const n = new Set(selected); on ? n.delete(r.id) : n.add(r.id); setSelected(n); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition ${on ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{r.file_name}</span>
                </button>
              );
            })}
          </div>
          {saved.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-3">Past chats</div>
              <div className="space-y-1">
                {saved.map((s) => (
                  <div key={s.id} className={`group flex items-center gap-1 rounded-lg ${currentId === s.id ? "bg-accent/10" : "hover:bg-muted"}`}>
                    <button onClick={() => openChat(s)} className="flex-1 text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground truncate">
                      <div className="truncate">{s.title}</div>
                      <div className="text-[10px] opacity-60">{new Date(s.date).toLocaleDateString()}</div>
                    </button>
                    <button onClick={() => deleteChat(s.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive" aria-label="Delete chat">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="lg:col-span-7 glass-card rounded-2xl flex flex-col">
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe2 className="w-3.5 h-3.5" />
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-muted border border-border rounded px-2 py-1 text-xs">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <button onClick={() => setEli5(!eli5)} className={`text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition ${eli5 ? "border-[color:var(--purple-accent)] bg-[color:var(--purple-accent)]/10 text-[color:var(--purple-accent)]" : "border-border text-muted-foreground hover:text-foreground"}`}>
              <Baby className="w-3 h-3" /> ELI5 mode
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "ai" && (
                  <div className="w-7 h-7 shrink-0 rounded-full btn-gradient grid place-items-center text-[11px] font-bold text-white">S</div>
                )}
                <div className={`max-w-[80%] ${m.role === "user" ? "" : "flex flex-col items-start gap-1.5"}`}>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "btn-gradient rounded-br-sm text-white" : "bg-muted border border-border rounded-bl-sm"}`}>
                    {m.role === "ai" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:my-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === "ai" && i > 0 && (
                    <div className="flex gap-1 text-muted-foreground">
                      <button onClick={() => setFeedback({ ...feedback, [i]: "up" })} className={`p-1 rounded hover:text-foreground hover:bg-muted ${feedback[i] === "up" ? "text-[color:var(--success)]" : ""}`} aria-label="Helpful">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setFeedback({ ...feedback, [i]: "down" })} className={`p-1 rounded hover:text-foreground hover:bg-muted ${feedback[i] === "down" ? "text-destructive" : ""}`} aria-label="Not helpful">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => copyMsg(m.content)} className="p-1 rounded hover:text-foreground hover:bg-muted" aria-label="Copy">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { copyMsg(m.content); toast.success("Saved to clipboard for notes"); }} className="p-1 rounded hover:text-foreground hover:bg-muted" aria-label="Save note">
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-muted border border-border flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-4 border-t border-border">
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-accent transition flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {s}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 items-end">
              <textarea
                ref={taRef}
                value={input}
                onChange={onInput}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about your health…"
                rows={1}
                className="flex-1 resize-none rounded-lg bg-muted border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-accent max-h-[120px]"
              />
              <button type="button" title="Voice input — coming soon" className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground cursor-not-allowed">
                <Mic className="w-4 h-4" />
              </button>
              <button type="submit" disabled={!input.trim() || typing} className="btn-gradient px-4 py-2.5 rounded-lg disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
