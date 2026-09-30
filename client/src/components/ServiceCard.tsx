import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Clock,
  IndianRupee,
  Wifi,
  Building2,
} from "lucide-react";
import { VerificationBadge } from "./VerificationBadge";
import { feeLabel, processingLabel } from "@/lib/utils";
import type { ServiceSummary } from "@/types";

export function ServiceCard({
  service,
  saved,
  onToggleSave,
  potentiallyRelevant,
}: {
  service: ServiceSummary;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  potentiallyRelevant?: boolean;
}) {
  const citySlug = service.cities?.slug;
  const to = `/services/${service.slug}${citySlug ? `?city=${citySlug}` : ""}`;

  return (
    <Link
      to={to}
      className="group card flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-DEFAULT bg-primary-light text-xl">
          {service.categories?.icon || "📄"}
        </span>
        <div className="flex items-center gap-1.5">
          {potentiallyRelevant && (
            <span className="badge bg-info-light text-info">Potentially relevant</span>
          )}
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(service.id);
              }}
              className="btn-ghost h-8 w-8 rounded-full p-0"
              aria-label={saved ? "Remove from saved" : "Save service"}
            >
              <Bookmark
                size={16}
                className={saved ? "fill-primary text-primary" : "text-sub"}
              />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-[0.95rem] font-bold leading-snug text-text group-hover:text-primary">
        {service.name}
      </h3>
      {service.description && (
        <p className="mt-1 line-clamp-2 text-[0.82rem] text-sub">
          {service.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.72rem] text-sub">
        <span className="inline-flex items-center gap-1">
          <IndianRupee size={12} /> {feeLabel(service.service_fees)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {processingLabel(service.service_processing_times)}
        </span>
        {service.online && (
          <span className="inline-flex items-center gap-1 text-success">
            <Wifi size={12} /> Online
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="inline-flex items-center gap-1 truncate text-[0.72rem] text-sub">
          <Building2 size={12} className="shrink-0" />
          <span className="truncate">
            {service.authorities?.short_name ||
              service.authorities?.name ||
              service.cities?.name ||
              "Government"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <VerificationBadge status={service.verification_status} />
          <ArrowRight
            size={15}
            className="text-sub transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </div>
      </div>
    </Link>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="skeleton h-10 w-10 rounded-DEFAULT" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton mt-2 h-3 w-2/3" />
    </div>
  );
}
