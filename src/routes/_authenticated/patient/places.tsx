import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { NEARBY_PLACES, type PlaceCategory } from "@/data/nearby-places";
import { MapPin, Phone, Star, ExternalLink, Search, Globe, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/patient/places")({ component: Places });

const CATEGORIES: ("All" | PlaceCategory)[] = ["All", "Hospital", "Clinic", "Pharmacy", "Diagnostic", "Dentist"];

const ICON: Record<PlaceCategory, string> = {
  Hospital: "🏥", Clinic: "🩺", Pharmacy: "💊", Diagnostic: "🧪", Dentist: "🦷",
};

function Places() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return NEARBY_PLACES.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (q && !`${p.name} ${p.address}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [cat, q]);

  return (
    <>
      <PageHeader title="Nearby Medical Places" subtitle="Hospitals, clinics, pharmacies and diagnostics around you" />

      <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or area…"
            className="w-full rounded-lg bg-muted border border-border pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${
                cat === c ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          No places match. Add entries in <code>src/data/nearby-places.ts</code>.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-5 flex flex-col hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ICON[p.category]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30">{p.category}</span>
              </div>
              {p.rating != null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                  {p.reviewCount != null && <span>({p.reviewCount.toLocaleString()})</span>}
                </div>
              )}
            </div>
            <h3 className="font-semibold leading-tight">{p.name}</h3>
            <div className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {p.address}
            </div>
            {p.hours && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {p.hours}
              </div>
            )}
            {p.topReview && (
              <p className="text-xs italic text-muted-foreground mt-3 border-l-2 border-accent/40 pl-2 line-clamp-3">
                “{p.topReview}”
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {p.mapsUrl && (
                <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-lg btn-gradient inline-flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Directions
                </a>
              )}
              {p.website && (
                <a href={p.website} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent inline-flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
