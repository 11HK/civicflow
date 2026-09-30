import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ArrowRight, ShieldCheck, Compass, FileCheck2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCity } from "@/lib/city";
import { useUIState } from "@/lib/uiState";
import { ServiceCard, ServiceCardSkeleton } from "@/components/ServiceCard";
import type { Category, ServiceSummary } from "@/types";

export function Home() {
  const navigate = useNavigate();
  const { city } = useCity();
  const { openCity } = useUIState();
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    api
      .services({ city: city.slug, limit: 8 })
      .then((r) => setServices(r.services))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [city]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    navigate(`/services?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary-light via-card to-card px-5 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <span className="badge bg-card text-primary shadow-card">
            <Compass size={13} /> Your path through government services
          </span>
          <h1 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight sm:text-[2.7rem]">
            Navigate government.
            <br />
            <span className="text-primary">Without getting lost.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] text-sub sm:text-base">
            CivicPath turns complicated government procedures into clear,
            step-by-step paths — with verified official sources for Mumbai,
            Ahmedabad and Bengaluru.
          </p>

          <form
            onSubmit={submit}
            className="mt-6 flex flex-col gap-2.5 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. I want to register my business"
                className="input h-12 pl-11 text-[0.95rem] shadow-card"
                aria-label="Search government services"
              />
            </div>
            <button
              type="button"
              onClick={openCity}
              className="btn-outline h-12 justify-start gap-2 sm:w-40"
            >
              <MapPin size={16} className="text-primary" />
              <span className="truncate">{city?.name || "Select city"}</span>
            </button>
            <button type="submit" className="btn-primary h-12 sm:w-44">
              Find my path <ArrowRight size={17} />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-sub">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-success" /> Verified
              official sources
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-primary" /> Private document
              vault
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Compass size={14} className="text-primary" /> Step-by-step
              roadmaps
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">Explore services</h2>
          <button
            onClick={() => navigate("/services")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/services?category=${c.slug}`)}
              className="group card flex items-center gap-3 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-DEFAULT bg-primary-light text-xl">
                {c.icon || "📄"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.86rem] font-semibold group-hover:text-primary">
                  {c.name}
                </span>
              </span>
            </button>
          ))}
          {categories.length === 0 &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-[74px]" />
            ))}
        </div>
      </section>

      {/* Popular in city */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">
            Popular in {city?.name || "your city"}
          </h2>
          <button
            onClick={() => navigate("/services")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            See more
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))
            : services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
        {!loading && services.length === 0 && (
          <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-sub">
            No services loaded yet for this city. If you just deployed, make sure
            the database is seeded.
          </p>
        )}
      </section>
    </div>
  );
}
