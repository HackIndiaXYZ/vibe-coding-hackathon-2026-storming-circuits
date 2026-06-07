import { useState } from "react";
import { HelpCircle, X, Send } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = [
  { q: "How is my data anonymized?", a: "All personally identifying information (name, contact, IDs) is stripped before your data is stored. Researchers only ever see aggregated, anonymized metrics." },
  { q: "How do I earn HLTH tokens?", a: "When you grant a research campaign access to your data, HLTH tokens are released from escrow to your wallet automatically." },
  { q: "What is a Data NFT?", a: "A non-transferable (Soulbound) token on Polygon that proves you own your medical identity. It cannot be sold or transferred." },
  { q: "Can I revoke access later?", a: "Yes — from the Privacy Control Center you can revoke any campaign's access at any time. Past payments remain yours." },
  { q: "Is there a fee?", a: "Patients pay zero fees. Researchers pay a 5% platform fee on top of escrowed rewards." },
];

export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<{ role: "user" | "bot"; text: string }[]>([{ role: "bot", text: "Hi! I'm the Sovereign Health support bot. Ask me anything." }]);
  const [input, setInput] = useState("");

  const send = (t: string) => {
    if (!t.trim()) return;
    setChat((c) => [...c, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      const lower = t.toLowerCase();
      let reply = "Thanks! A human will follow up via email within 24 hours.";
      if (lower.includes("hlth") || lower.includes("token")) reply = "HLTH is our utility token. Earn it by sharing data with research campaigns.";
      else if (lower.includes("privacy") || lower.includes("anonym")) reply = "Your data is anonymized client-side before upload. Researchers never see PII.";
      else if (lower.includes("delete") || lower.includes("remove")) reply = "You can delete any record or revoke any consent from the Privacy Control Center.";
      setChat((c) => [...c, { role: "bot", text: reply }]);
    }, 600);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full btn-gradient shadow-lg flex items-center justify-center" aria-label="Help">
        <HelpCircle className="w-5 h-5" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="bg-card border-border w-full sm:max-w-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Help &amp; Support</h2>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">FAQ</h3>
              <Accordion type="single" collapsible>
                {FAQ.map((f, i) => (
                  <AccordionItem key={i} value={`f${i}`}>
                    <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Chat with Support</h3>
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 max-h-64 overflow-y-auto">
                {chat.map((m, i) => (
                  <div key={i} className={`text-sm rounded-lg px-3 py-1.5 max-w-[85%] ${m.role === "user" ? "ml-auto btn-gradient" : "bg-background border border-border"}`}>{m.text}</div>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 mt-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question…" className="flex-1 rounded-lg bg-muted border border-border px-3 py-2 text-sm" />
                <button type="submit" className="btn-gradient px-3 rounded-lg"><Send className="w-4 h-4" /></button>
              </form>
            </div>
            <a href="#" className="block text-center text-sm text-accent hover:underline">Read the Documentation →</a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}