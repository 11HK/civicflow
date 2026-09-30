import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Sparkles,
  Paperclip,
  Hash,
  X,
  Info,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAssistant } from "@/lib/assistant";
import { useCity } from "@/lib/city";
import { Spinner, EmptyState, useToast, Badge } from "@/components/ui";
import { CivicPathGraph } from "@/features/civic-path/CivicPathGraph";
import { classifyStep } from "@/features/civic-path/stepTypes";
import type { ServiceDetail, ServiceStep, UserDocument, Journey } from "@/types";

export function CivicPath() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const journeyId = params.get("journey");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city } = useCity();
  const { setContext, ask } = useAssistant();
  const { toast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<ServiceStep | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.service(id),
      api.progress().catch(() => []),
      api.documents().catch(() => []),
      journeyId ? api.journeys().catch(() => []) : Promise.resolve([]),
    ])
      .then(([svc, prog, documents, journeys]) => {
        setService(svc);
        setContext({ serviceId: svc.id, serviceName: svc.name });
        const mine = prog.filter((p) => p.goal === svc.id);
        setCompleted(new Set(mine.map((p) => p.step_id)));
        setDocs(documents);
        if (journeyId) setJourney(journeys.find((j) => j.id === journeyId) || null);
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
    return () => setContext({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, journeyId]);

  const steps = useMemo(
    () => (service?.service_steps || []).slice().sort((a, b) => a.step_number - b.step_number),
    [service],
  );

  const openStep = useCallback((s: ServiceStep) => {
    setActiveStep(s);
    setContext((c) => ({ ...c, step: s.title }) as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleComplete = async (step: ServiceStep, done: boolean) => {
    if (!service) return;
    const next = new Set(completed);
    done ? next.add(step.id) : next.delete(step.id);
    setCompleted(next);
    try {
      if (done)
        await api.completeStep({
          goal: service.id,
          stepId: step.id,
          serviceId: service.id,
        });
      else await api.uncompleteStep(service.id, step.id);
    } catch {
      setCompleted(completed);
      toast("Could not update progress", "error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );

  if (!service || steps.length === 0)
    return (
      <EmptyState
        icon={<Info size={22} />}
        title="No path available"
        description="This service doesn't have a step-by-step path yet."
        action={
          <Link to="/services" className="btn-outline">
            Browse services
          </Link>
        }
      />
    );

  const doneCount = steps.filter((s) => completed.has(s.id)).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((s) => !completed.has(s.id));

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(`/services/${service.slug}?city=${service.cities?.slug || city?.slug || ""}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sub hover:text-text"
        >
          <ArrowLeft size={16} /> Service details
        </button>
        {service.official_url && (
          <a
            href={service.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline btn-sm"
          >
            Official portal <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Header + progress */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              {service.name}
            </h1>
            <p className="mt-0.5 text-sm text-sub">
              {service.cities?.name} · {service.authorities?.short_name || service.authorities?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary">{pct}%</p>
            <p className="text-xs text-sub">
              {doneCount} / {steps.length} steps
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextStep ? (
          <button
            onClick={() => openStep(nextStep)}
            className="mt-3 flex w-full items-center justify-between rounded-DEFAULT border border-primary/30 bg-primary-light px-3.5 py-2.5 text-left transition-colors hover:bg-primary-light/70"
          >
            <span className="min-w-0">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-primary">
                Next step
              </span>
              <span className="block truncate text-sm font-semibold">
                {nextStep.step_number}. {nextStep.title}
              </span>
            </span>
            <span className="btn-primary btn-sm shrink-0">Open</span>
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-DEFAULT border border-success/30 bg-success-light px-3.5 py-2.5 text-sm font-semibold text-success">
            <CheckCircle2 size={17} /> All steps complete! Confirm final status on
            the official portal.
          </div>
        )}
      </div>

      {/* Graph */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">Path map</h2>
          <p className="hidden text-xs text-sub sm:block">
            Tap a step to see details and mark it complete.
          </p>
        </div>
        <CivicPathGraph steps={steps} completed={completed} onOpenStep={openStep} />
      </div>

      {/* Step list (mobile-friendly, always visible) */}
      <div className="flex flex-col gap-2">
        {steps.map((s) => {
          const isDone = completed.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => openStep(s)}
              className="flex items-center gap-3 rounded-DEFAULT border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
            >
              {isDone ? (
                <CheckCircle2 size={20} className="shrink-0 text-success" />
              ) : (
                <Circle size={20} className="shrink-0 text-sub" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {s.step_number}. {s.title}
                </span>
                {s.estimated_duration && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[0.7rem] text-sub">
                    <Clock size={11} /> {s.estimated_duration}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">
                {isDone ? "Review" : "Open"}
              </span>
            </button>
          );
        })}
      </div>

      {activeStep && (
        <StepPanel
          step={activeStep}
          service={service}
          done={completed.has(activeStep.id)}
          docs={docs}
          journey={journey}
          onJourney={setJourney}
          onClose={() => setActiveStep(null)}
          onToggle={(done) => toggleComplete(activeStep, done)}
          onAsk={(q) => ask(q)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Step panel */
function StepPanel({
  step,
  service,
  done,
  docs,
  journey,
  onJourney,
  onClose,
  onToggle,
  onAsk,
}: {
  step: ServiceStep;
  service: ServiceDetail;
  done: boolean;
  docs: UserDocument[];
  journey: Journey | null;
  onJourney: (j: Journey) => void;
  onClose: () => void;
  onToggle: (done: boolean) => void;
  onAsk: (q: string) => void;
}) {
  const kind = classifyStep(step);
  const guide = (service.service_portal_guides || []).find(
    (g) => g.step_number === step.step_number,
  );

  return (
    <div
      className="fixed inset-0 z-[95] flex justify-end bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-card shadow-lift animate-slide-up sm:animate-[fade-in_.2s_ease] sm:rounded-l-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-sub">
              Step {step.step_number}
              {step.conditional && (
                <Badge tone="warn" className="ml-2">
                  Conditional
                </Badge>
              )}
            </span>
            <h3 className="mt-0.5 text-lg font-bold leading-tight">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost -mr-2 h-8 w-8 shrink-0 rounded-full p-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          {step.description && (
            <p className="text-sm leading-relaxed text-text">{step.description}</p>
          )}

          {step.estimated_duration && (
            <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-elevated px-3 py-1 text-xs text-sub">
              <Clock size={12} /> {step.estimated_duration}
            </div>
          )}

          {step.why_needed && (
            <Block label="Why this matters" icon={<Info size={14} />}>
              {step.why_needed}
            </Block>
          )}
          {step.action && (
            <Block label="What to do" icon={<CheckCircle2 size={14} />}>
              {step.action}
            </Block>
          )}
          {step.portal_instruction && (
            <Block label="On the portal" icon={<ExternalLink size={14} />}>
              {step.portal_instruction}
            </Block>
          )}

          {/* Portal guide expandable */}
          {guide && (
            <div className="rounded-DEFAULT border border-border p-3 text-sm">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
                <ExternalLink size={14} /> {guide.title}
              </p>
              {guide.what_to_enter && (
                <p className="text-sub">
                  <strong>Enter:</strong> {guide.what_to_enter}
                </p>
              )}
              {guide.common_mistakes && (
                <p className="mt-1.5 rounded bg-warn-light px-2 py-1 text-xs text-warn">
                  ⚠ {guide.common_mistakes}
                </p>
              )}
            </div>
          )}

          {/* Validation-type specific UI */}
          {kind === "document" && (
            <DocumentAssociation docs={docs} />
          )}
          {kind === "application" && (
            <ApplicationReference
              journey={journey}
              serviceId={service.id}
              serviceName={service.name}
              onJourney={onJourney}
            />
          )}

          {/* Ask AI */}
          <button
            onClick={() => onAsk(`Explain this step: ${step.title}`)}
            className="flex items-center gap-2 self-start text-sm font-medium text-primary hover:underline"
          >
            <Sparkles size={15} /> Ask AI to explain this step
          </button>
        </div>

        {/* Footer action */}
        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          {done ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-DEFAULT bg-success-light px-3 py-2.5 text-sm font-semibold text-success">
                <CheckCircle2 size={17} /> Step completed
              </div>
              <button
                onClick={() => onToggle(false)}
                className="btn-outline btn-sm"
                title="Undo"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onToggle(true);
                onClose();
              }}
              className="btn-primary w-full"
            >
              <CheckCircle2 size={17} />
              {kind === "self"
                ? "Mark as completed"
                : kind === "document"
                  ? "I have this document — mark complete"
                  : kind === "application"
                    ? "Mark as submitted"
                    : "Mark step complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Block({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-DEFAULT bg-elevated p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-sub">
        {icon} {label}
      </p>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function DocumentAssociation({ docs }: { docs: UserDocument[] }) {
  const [linked, setLinked] = useState<string | null>(null);
  return (
    <div className="rounded-DEFAULT border border-border p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Paperclip size={15} /> Attach from My Documents
      </p>
      {docs.length === 0 ? (
        <p className="text-xs text-sub">
          You haven't uploaded any documents yet.{" "}
          <Link to="/documents" className="font-medium text-primary hover:underline">
            Add documents →
          </Link>
        </p>
      ) : linked ? (
        <div className="flex items-center gap-2 rounded-DEFAULT bg-success-light px-3 py-2 text-sm text-success">
          <CheckCircle2 size={15} /> Attached: {docs.find((d) => d.id === linked)?.document_name}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {docs.slice(0, 5).map((d) => (
            <button
              key={d.id}
              onClick={() => setLinked(d.id)}
              className="flex items-center gap-2 rounded-DEFAULT border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary"
            >
              <FileText size={15} className="text-sub" />
              <span className="truncate">{d.document_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationReference({
  journey,
  serviceId,
  serviceName,
  onJourney,
}: {
  journey: Journey | null;
  serviceId: string;
  serviceName: string;
  onJourney: (j: Journey) => void;
}) {
  const [num, setNum] = useState(journey?.application_number || "");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    setBusy(true);
    try {
      let j = journey;
      if (!j) j = await api.createJourney({ service_id: serviceId, title: serviceName });
      const updated = await api.updateJourney(j.id, {
        application_number: num,
        self_reported_status: "submitted",
        submitted_at: new Date().toISOString(),
      });
      onJourney(updated);
      toast("Application reference saved", "success");
    } catch {
      toast("Could not save reference", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-DEFAULT border border-border p-3">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <Hash size={15} /> Application / acknowledgement number
      </p>
      <p className="mb-2 text-xs text-sub">
        Save the reference the portal gives you after submitting. CivicPath stores
        it for your records — it does not verify it with the government.
      </p>
      <div className="flex gap-2">
        <input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="e.g. MH1234567890"
          className="input py-2 text-sm"
        />
        <button
          onClick={save}
          disabled={busy || !num.trim()}
          className="btn-primary btn-sm shrink-0"
        >
          Save
        </button>
      </div>
      {journey?.application_number && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-success">
          <ShieldCheck size={12} /> Saved: {journey.application_number}
        </p>
      )}
    </div>
  );
}
