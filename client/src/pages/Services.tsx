import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useCity } from "@/lib/city";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui";
import { ServiceCard, ServiceCardSkeleton } from "@/components/ServiceCard";
import { EmptyState } from "@/components/ui";
import { expandQuery, INTENT_KEYWORDS } from "@/lib/utils";
import type { Category, ServiceSummary } from "@/types";

export function Services() {
  const [params, setParams] = useSearchParams();
  const { city } = useCity();
  const { user } = useAuth();
  const { toast } = useToast();

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const verifiedOnly = params.get("verified") === "1";

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [localQ, setLocalQ] = useState(q);

  const isIntent = useMemo(
    () =>
      !!q &&
      INTENT_KEYWORDS.some((e) => e.patterns.some((p) => q.toLowerCase().includes(p))),
    [q],
  );

  useEffect(() => setLocalQ(q), [q]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) api.saved().then((ids) => setSaved(new Set(ids))).catch(() => {});
    else setSaved(new Set());
  }, [user]);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    const searchTerm = q ? expandQuery(q) : undefined;
    api
      .services({
        city: city.slug,
        category: category || undefined,
        q: searchTerm,
        verified: verifiedOnly || undefined,
        limit: 100,
      })
      .then((r) => setServices(r.services))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [city, category, q, verifiedOnly]);

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggleSave = async (id: string) => {
    if (!user) {
      toast("Sign in to save services", "info");
      return;
    }
    const has = saved.has(id);
    const next = new Set(saved);
    has ? next.delete(id) : next.add(id);
    setSaved(next);
    try {
      has ? await api.unsave(id) : await api.save(id);
    } catch {
      setSaved(saved);
      toast("Could not update saved services", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-sub">
          Browse civic services in {city?.name || "your city"}. Search by name or
          describe what you want to do.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update("q", localQ.trim() || null);
        }}
        className="relative"
      >
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
        />
        <input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="Search or describe — e.g. 'I want to open a restaurant'"
          className="input h-12 pl-11"
        />
      </form>

      {/* Filters */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-sub">
          <SlidersHorizontal size={14} />
        </span>
        <button
          onClick={() => update("category", null)}
          className={`chip ${!category ? "chip-active" : ""}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => update("category", c.slug === category ? null : c.slug)}
            className={`chip ${c.slug === category ? "chip-active" : ""}`}
          >
            <span>{c.icon}</span>
            {c.name}
          </button>
        ))}
        <button
          onClick={() => update("verified", verifiedOnly ? null : "1")}
          className={`chip ${verifiedOnly ? "chip-active" : ""}`}
        >
          <ShieldCheck size={14} /> Verified only
        </button>
      </div>

      {isIntent && !loading && services.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-DEFAULT border border-info/30 bg-info-light px-4 py-3 text-sm text-info">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <p>
            Showing services that may relate to <strong>“{q}”</strong>. These are{" "}
            <strong>potentially relevant</strong> — not every one is mandatory.
            Open each to check applicability.
          </p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={<Search size={22} />}
          title="No services found"
          description={
            q
              ? `Nothing matched “${q}” in ${city?.name}. Try a different term or clear filters.`
              : "No services here yet. Try another category or city."
          }
          action={
            (q || category || verifiedOnly) && (
              <button
                className="btn-outline"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
              >
                Clear filters
              </button>
            )
          }
        />
      ) : (
        <>
          <p className="text-sm text-sub">
            {services.length} service{services.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                saved={saved.has(s.id)}
                onToggleSave={toggleSave}
                potentiallyRelevant={isIntent}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
