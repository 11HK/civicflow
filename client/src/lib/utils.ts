import type {
  ProcessingTime,
  ServiceFee,
  ServiceSummary,
  VerificationStatus,
} from "@/types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function feeLabel(fees?: ServiceFee[]): string {
  const f = fees?.[0];
  if (!f) return "See official portal";
  if (f.fee_amount) return f.fee_amount;
  if (f.fee_description) return f.fee_description;
  return "See official portal";
}

export function processingLabel(times?: ProcessingTime[]): string {
  const t = times?.[0];
  if (!t) return "Not specified";
  if (t.processing_time_text) return t.processing_time_text;
  if (t.processing_time_value && t.processing_time_unit)
    return `${t.processing_time_value} ${t.processing_time_unit.replace(/_/g, " ")}`;
  return "Not specified";
}

export const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; tone: "success" | "warn" | "danger"; icon: string }
> = {
  VERIFIED: { label: "Verified", tone: "success", icon: "shield-check" },
  NEEDS_VERIFICATION: {
    label: "Needs review",
    tone: "warn",
    icon: "clock",
  },
  OUTDATED: { label: "Outdated", tone: "danger", icon: "alert-triangle" },
};

export function serviceMatches(s: ServiceSummary, q: string): boolean {
  const lq = q.toLowerCase().trim();
  if (!lq) return true;
  return (
    s.name.toLowerCase().includes(lq) ||
    (s.description || "").toLowerCase().includes(lq) ||
    (s.categories?.name || "").toLowerCase().includes(lq) ||
    (s.service_type || "").toLowerCase().includes(lq)
  );
}

/**
 * A tiny keyword intent map for natural-language search — maps common phrases
 * to catalogue keywords. Purely a search aid; it does NOT assert that any
 * matched service is mandatory (see the "Potentially relevant" labelling in UI).
 */
export const INTENT_KEYWORDS: { patterns: string[]; keywords: string[] }[] = [
  {
    patterns: ["restaurant", "cafe", "food business", "cloud kitchen", "eatery", "hotel"],
    keywords: ["shop", "trade", "fssai", "food", "establishment"],
  },
  {
    patterns: ["start a business", "open a shop", "register my business", "startup", "company"],
    keywords: ["shop", "establishment", "trade", "udyam", "registration"],
  },
  {
    patterns: ["move house", "shifted", "new home", "changed address", "relocate"],
    keywords: ["address", "electricity", "domicile", "ration", "water"],
  },
  {
    patterns: ["drive", "car", "bike", "scooter", "vehicle"],
    keywords: ["driving", "licence", "vehicle", "registration"],
  },
  {
    patterns: ["baby", "child born", "newborn", "new born"],
    keywords: ["birth"],
  },
];

export function expandQuery(q: string): string {
  const lq = q.toLowerCase();
  for (const entry of INTENT_KEYWORDS) {
    if (entry.patterns.some((p) => lq.includes(p))) {
      return entry.keywords.join(" ");
    }
  }
  return q;
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}
