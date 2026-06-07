import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Copy, Flame, History, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patient/data-nft")({ component: NftPage });

function NftPage() {
  const { user } = useAuth();
  const tokenId = "0x" + (user?.id || "").replace(/-/g, "").slice(0, 24);
  const [burnOpen, setBurnOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const explorer = `https://polygonscan.com/token/${tokenId}`;

  const HISTORY = [
    { date: "2025-01-15", event: "Token minted", tx: "0x9a3f…b2c1" },
    { date: "2025-03-02", event: "Metadata updated (record count: 4)", tx: "0xa7e2…d104" },
    { date: "2025-04-18", event: "Consent #1 granted (Diabetes 2025)", tx: "0xfd11…0091" },
  ];

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <>
      <PageHeader title="Data NFT" subtitle="Your Soulbound Token — non-transferable proof of identity" />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="relative animated-border rounded-3xl">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1A0B3A] via-[#0D1117] to-[#062B36] p-8 text-center">
            <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto mb-6">
              <defs>
                <linearGradient id="hex" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7C4DFF" />
                  <stop offset="1" stopColor="#00BCD4" />
                </linearGradient>
              </defs>
              <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="url(#hex)" strokeWidth="2" style={{ filter: "drop-shadow(0 0 8px rgba(124,77,255,0.6))" }} />
              <polygon points="50,20 75,33.75 75,66.25 50,80 25,66.25 25,33.75" fill="url(#hex)" opacity=".15" />
              <text x="50" y="56" textAnchor="middle" fontSize="22" fill="#00BCD4" fontFamily="Inter" fontWeight="700">⬡</text>
            </svg>
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--cyan-accent)] mb-2">Soulbound Token</div>
            <div className="text-2xl font-bold text-foreground mb-1">Sovereign Identity</div>
            <div className="text-sm text-muted-foreground mb-6">Non-transferable medical identity</div>
            <div className="space-y-2 text-left bg-black/30 rounded-xl p-4 border border-border">
              <Row k="Token ID" v={
                <button onClick={() => copy(tokenId)} className="inline-flex items-center gap-1.5 hover:text-accent">
                  {tokenId.slice(0, 14) + "…"} <Copy className="w-3 h-3" />
                </button>
              } />
              <Row k="Chain" v="Polygon PoS" />
              <Row k="Standard" v="ERC-5484" />
              <Row k="Status" v={<span className="text-[color:var(--success)]">● Minted</span>} />
              <Row k="Records linked" v="4" />
              <Row k="Consents active" v="3" />
              <Row k="HLTH earned" v="150" />
            </div>
            <div className="mt-4 flex gap-2">
              <a href={explorer} target="_blank" rel="noreferrer" className="flex-1 text-xs rounded-lg border border-border hover:border-accent py-2 inline-flex items-center justify-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View on Polygonscan
              </a>
              <Dialog open={burnOpen} onOpenChange={setBurnOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 py-2 px-3 inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Burn</button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle className="text-destructive">Burn Sovereign Identity</DialogTitle></DialogHeader>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>This permanently revokes all consents, deletes your linked health records, and burns your Soulbound Token. <strong className="text-destructive">This cannot be undone.</strong></p>
                    <p>Type <code className="text-foreground">BURN</code> to confirm:</p>
                    <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg bg-muted border border-border px-3 py-2 mt-2" />
                  </div>
                  <DialogFooter>
                    <button onClick={() => setBurnOpen(false)} className="text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
                    <button disabled={confirm !== "BURN"} onClick={() => { setBurnOpen(false); setConfirm(""); toast.error("Token burn simulated (demo)"); }} className="text-sm px-4 py-2 rounded-lg bg-destructive text-destructive-foreground disabled:opacity-40">Burn forever</button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><QrCode className="w-4 h-4 text-accent" /> Share with provider</h3>
            <div className="flex items-center gap-5">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={`https://sovereign.health/v/${tokenId}`} size={128} bgColor="#ffffff" fgColor="#0D1117" level="M" />
              </div>
              <div className="text-sm text-muted-foreground">
                Show this QR to your physician for read-only access to your verified medical identity. Expires in 24h.
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><History className="w-4 h-4 text-accent" /> On-chain history</h3>
            <div className="space-y-2">
              {HISTORY.map((h) => (
                <div key={h.tx} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <div className="text-sm">{h.event}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{h.date}</div>
                  </div>
                  <code className="text-xs text-[color:var(--cyan-accent)] font-mono">{h.tx}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>;
}
