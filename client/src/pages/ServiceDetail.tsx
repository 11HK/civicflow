import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  IndianRupee,
  Clock,
  Wifi,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  CircleAlert,
  FileText,
  MapPin,
  Sparkles,
  ChevronDown,
  Info,
  Route as RouteIcon,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCity } from "@/lib/city";
import { useAuth } from "@/lib/auth";
import { useUIState } from "@/lib/uiState";
import { useAssistant } from "@/lib/assistant";
import { useToast, Spinner, EmptyState, Badge } from "@/components/ui";
import { VerificationBadge } from "@/components/VerificationBadge";
import { feeLabel, processingLabel, formatDate } from "@/lib/utils";
import type { ServiceDetail as SD } from "@/types";

export function ServiceDetail() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const citySlug = params.get("city") || undefined;
  const navigate = useNavigate();
  const { city } = useCity();
  const { user } = useAuth();
  const { openAuth } = useUIState();
  const { setContext, ask } = useAssistant();
  const { toast } = useToast();

  const [service, setService] = useState<SD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");
    api
      .serviceBySlug(slug, citySlug || city?.slug)
      .then((s) => {
        setService(s);
        setContext({ serviceId: s.id, serviceName: s.name });
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Could not load service."),
      )
      .finally(() => setLoading(false));
    return () => setContext({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, citySlug]);

  const startPath = async () => {
    if (!service) return;
    if (!user) {
      openAuth("login");
      return;
    }
    setStarting(true);
    try {
      // Create (or reuse) a journey, then open the civic path.
      const journey = await api.createJourney({
        service_id: service.id,
        title: service.name,
      });
      navigate(`/civic-path/${service.id}?journey=${journey.id}`);
    } catch {
      // Journey creation is optional; still open the path.
      navigate(`/civic-path/${service.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );

  if (error || !service)
    return (
      <EmptyState
        icon={<CircleAlert size={22} />}
        title="Service unavailable"
        description={error || "We couldn't load this service right now."}
        action={
          <Link to="/services" className="btn-outline">
            Back to services
          </Link>
        }
      />
    );

  const steps = service.service_steps || [];
  const docs = service.service_documents || [];
  const sources = service.service_sources || [];
  const guides = service.service_portal_guides || [];
  const faqs = service.service_faqs || [];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-sub hover:text-text"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary-hover px-5 py-6 text-white sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 text-[0.78rem]">
            {service.categories && (
              <span className="badge bg-white/15 text-white">
                {service.categories.icon} {service.categories.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-white/85">
              <MapPin size={13} /> {service.cities?.name}
              {service.states?.name ? `, ${service.states.name}` : ""}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
            {service.name}
          </h1>
          {service.description && (
            <p className="mt-2 max-w-2xl text-sm text-white/90">
              {service.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={startPath}
              disabled={starting || steps.length === 0}
              className="btn inline-flex bg-white px-5 py-2.5 font-bold text-primary hover:bg-white/90 active:scale-[.98]"
            >
              {starting ? (
                <Spinner className="h-4 w-4 border-primary/30 border-t-primary" />
              ) : (
                <RouteIcon size={17} />
              )}
              Start Civic Path
            </button>
            {service.official_url && (
              <a
                href={service.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10"
              >
                Official portal <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4">
          <Fact icon={<IndianRupee size={15} />} label="Government fee" value={feeLabel(service.service_fees)} />
          <Fact icon={<Clock size={15} />} label="Processing time" value={processingLabel(service.service_processing_times)} />
          <Fact
            icon={<Wifi size={15} />}
            label="Mode"
            value={
              service.online && service.offline
                ? "Online / Offline"
                : service.online
                  ? "Online"
                  : "Offline"
            }
          />
          <Fact
            icon={<Building2 size={15} />}
            label="Department"
            value={service.authorities?.short_name || service.authorities?.name || "—"}
          />
        </div>
      </div>

      {/* Verification strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-DEFAULT border border-border bg-elevated px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <VerificationBadge status={service.verification_status} />
          {service.last_verified_at && (
            <span className="text-sub">
              Last verified {formatDate(service.last_verified_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-sub">
          CivicPath guides you — the official portal completes the transaction.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Eligibility */}
          {service.eligibility && (
            <Section title="Who needs this?" icon={<Info size={16} />}>
              <p className="text-sm leading-relaxed text-sub">
                {service.eligibility}
              </p>
            </Section>
          )}

          {/* Before you start / documents */}
          {docs.length > 0 && (
            <Section
              title="Before you start"
              icon={<FileText size={16} />}
              subtitle="Documents you may need for this service."
            >
              <div className="overflow-hidden rounded-DEFAULT border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-elevated text-left text-xs uppercase tracking-wide text-sub">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Document</th>
                      <th className="px-3 py-2 font-semibold">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {docs.map((d) => (
                      <tr key={d.id} className="align-top">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{d.name}</p>
                          {d.notes && (
                            <p className="mt-0.5 text-xs text-sub">{d.notes}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {d.required ? (
                            <Badge tone="danger">Required</Badge>
                          ) : (
                            <Badge tone="sub">Optional</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Civic path preview */}
          {steps.length > 0 && (
            <Section
              title="Your Civic Path"
              icon={<RouteIcon size={16} />}
              subtitle={`${steps.length} steps from start to finish.`}
              action={
                <button onClick={startPath} className="btn-primary btn-sm">
                  Start <ArrowRight size={14} />
                </button>
              }
            >
              <ol className="flex flex-col gap-2">
                {steps.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex gap-3 rounded-DEFAULT border border-border p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {s.step_number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.title}</p>
                      {s.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-sub">
                          {s.description}
                        </p>
                      )}
                      {s.estimated_duration && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-sub">
                          <Clock size={11} /> {s.estimated_duration}
                        </p>
                      )}
                    </div>
                    {i < steps.length - 1 && null}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* Portal guides */}
          {guides.length > 0 && (
            <Section
              title="Portal guidance"
              icon={<ExternalLink size={16} />}
              subtitle="What you'll see on the official portal."
            >
              <div className="flex flex-col gap-2.5">
                {guides.map((g) => (
                  <PortalGuideItem key={g.id} guide={g} />
                ))}
              </div>
            </Section>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <Section title="Frequently asked" icon={<Info size={16} />}>
              <div className="flex flex-col gap-2">
                {faqs.map((f) => (
                  <details
                    key={f.id}
                    className="group rounded-DEFAULT border border-border p-3"
                  >
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
                      {f.question}
                      <ChevronDown
                        size={16}
                        className="text-sub transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-sub">
                      {f.answer}
                    </p>
                  </details>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* AI helper */}
          <div className="card p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                <Sparkles size={16} />
              </span>
              <h3 className="text-sm font-bold">Ask CivicPath AI</h3>
            </div>
            <p className="mt-2 text-xs text-sub">
              Get answers grounded in this service's verified information.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {[
                "What documents do I need?",
                "What should I do first?",
                "How long does this take?",
              ].map((qq) => (
                <button
                  key={qq}
                  onClick={() => ask(qq)}
                  className="rounded-DEFAULT border border-border px-3 py-2 text-left text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {qq}
                </button>
              ))}
            </div>
          </div>

          {/* Official sources */}
          <div className="card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <ShieldCheck size={16} className="text-success" /> Official sources
            </h3>
            {sources.length === 0 && !service.official_url ? (
              <p className="text-xs text-sub">
                No official source recorded yet. Always confirm on the government
                portal.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {service.official_url && (
                  <SourceLink
                    url={service.official_url}
                    title={service.official_portal_name || "Official portal"}
                    authority={service.authorities?.name}
                  />
                )}
                {sources.map((s) => (
                  <SourceLink
                    key={s.id}
                    url={s.source_url}
                    title={s.source_title || "Official source"}
                    authority={s.source_authority}
                    verifiedAt={s.verified_at}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Authority contact */}
          {service.authorities && (
            <div className="card p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Building2 size={16} /> {service.authorities.name}
              </h3>
              <div className="flex flex-col gap-1 text-xs text-sub">
                {service.authorities.phone && (
                  <p>Phone: {service.authorities.phone}</p>
                )}
                {service.authorities.address && (
                  <p>{service.authorities.address}</p>
                )}
                {service.authorities.website && (
                  <a
                    href={service.authorities.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Website <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Report issue */}
          <ReportIssue serviceId={service.id} onDone={() => toast("Thanks — feedback sent to reviewers.", "success")} />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-DEFAULT border border-warn/30 bg-warn-light px-4 py-3 text-xs text-warn">
        <CircleAlert size={15} className="mt-0.5 shrink-0" />
        <p>
          CivicPath is an independent navigation platform, not a government body.
          Fees, timelines and procedures can change — always confirm the current
          details on the official portal before applying.
        </p>
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-3.5">
      <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-sub">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            {icon} {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PortalGuideItem({
  guide,
}: {
  guide: NonNullable<SD["service_portal_guides"]>[number];
}) {
  return (
    <details className="group rounded-DEFAULT border border-border p-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className="badge bg-primary-light text-primary">
            {guide.step_number}
          </span>
          {guide.title}
        </span>
        <ChevronDown
          size={16}
          className="text-sub transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {guide.instruction && <p className="text-sub">{guide.instruction}</p>}
        {guide.what_user_sees && (
          <GuideRow label="What you'll see" value={guide.what_user_sees} />
        )}
        {guide.what_to_select && (
          <GuideRow label="What to select" value={guide.what_to_select} />
        )}
        {guide.what_to_enter && (
          <GuideRow label="What to enter" value={guide.what_to_enter} />
        )}
        {guide.what_to_upload && (
          <GuideRow label="What to upload" value={guide.what_to_upload} />
        )}
        {guide.common_mistakes && (
          <div className="rounded-DEFAULT bg-warn-light px-3 py-2 text-xs text-warn">
            <strong>Common mistakes:</strong> {guide.common_mistakes}
          </div>
        )}
      </div>
    </details>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-DEFAULT bg-elevated px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-sub">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function SourceLink({
  url,
  title,
  authority,
  verifiedAt,
}: {
  url?: string;
  title: string;
  authority?: string;
  verifiedAt?: string;
}) {
  if (!url)
    return (
      <div className="rounded-DEFAULT border border-border px-3 py-2 text-xs text-sub">
        {title} {authority ? `— ${authority}` : ""}
      </div>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-2 rounded-DEFAULT border border-border px-3 py-2.5 transition-colors hover:border-primary"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold group-hover:text-primary">
          {title}
        </span>
        {authority && (
          <span className="block truncate text-xs text-sub">{authority}</span>
        )}
        {verifiedAt && (
          <span className="mt-0.5 block text-[0.68rem] text-success">
            Verified {formatDate(verifiedAt)}
          </span>
        )}
      </span>
      <ExternalLink size={14} className="mt-0.5 shrink-0 text-sub group-hover:text-primary" />
    </a>
  );
}

function ReportIssue({
  serviceId,
  onDone,
}: {
  serviceId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("outdated_info");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.serviceFeedback(serviceId, {
        feedback_type: type,
        description: desc,
      });
      setOpen(false);
      setDesc("");
      onDone();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 text-sm font-medium text-sub hover:text-text"
        >
          <CheckCircle2 size={15} /> Report outdated or wrong info
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input py-2 text-sm"
          >
            <option value="outdated_info">Outdated information</option>
            <option value="broken_link">Broken official link</option>
            <option value="wrong_fee">Wrong fee</option>
            <option value="wrong_documents">Wrong documents</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            placeholder="What's wrong? (optional)"
            className="input resize-none py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="btn-primary btn-sm flex-1">
              Send
            </button>
            <button onClick={() => setOpen(false)} className="btn-outline btn-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
