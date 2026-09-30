import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Route as RouteIcon,
  Bookmark,
  FileText,
  ArrowRight,
  CheckCircle2,
  Hash,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState, Spinner, Badge, useToast } from "@/components/ui";
import { ServiceCard } from "@/components/ServiceCard";
import { formatDate } from "@/lib/utils";
import type { Journey, ProgressRow, ServiceSummary } from "@/types";

type Tab = "paths" | "saved" | "applications";

export function MyPaths() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("paths");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<string, ServiceSummary>>({});

  const load = () => {
    setLoading(true);
    Promise.all([
      api.progress().catch(() => []),
      api.journeys().catch(() => []),
      api.saved().catch(() => []),
      api.services({ limit: 200 }).catch(() => ({ services: [], total: 0 })),
    ])
      .then(([prog, jrn, saved, svc]) => {
        setProgress(prog);
        setJourneys(jrn);
        setSavedIds(saved);
        const map: Record<string, ServiceSummary> = {};
        svc.services.forEach((s) => (map[s.id] = s));
        setServiceMap(map);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Group progress by goal (service id)
  const paths = useMemo(() => {
    const byGoal: Record<string, Set<string>> = {};
    for (const p of progress) {
      byGoal[p.goal] = byGoal[p.goal] || new Set();
      byGoal[p.goal].add(p.step_id);
    }
    return Object.entries(byGoal).map(([goal, steps]) => ({
      goal,
      completedSteps: steps.size,
      service: serviceMap[goal],
    }));
  }, [progress, serviceMap]);

  const savedServices = savedIds
    .map((id) => serviceMap[id])
    .filter(Boolean) as ServiceSummary[];

  const removeJourney = async (id: string) => {
    setJourneys((j) => j.filter((x) => x.id !== id));
    try {
      await api.deleteJourney(id);
      toast("Application removed", "success");
    } catch {
      load();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">My Paths</h1>
        <p className="mt-1 text-sm text-sub">
          Resume your civic paths, saved services and application records.
        </p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "paths"} onClick={() => setTab("paths")} icon={<RouteIcon size={15} />} label="In progress" count={paths.length} />
        <TabButton active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark size={15} />} label="Saved" count={savedServices.length} />
        <TabButton active={tab === "applications"} onClick={() => setTab("applications")} icon={<FileText size={15} />} label="Applications" count={journeys.length} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      ) : tab === "paths" ? (
        paths.length === 0 ? (
          <EmptyState
            icon={<RouteIcon size={22} />}
            title="No paths started yet"
            description="Open a service and tap “Start Civic Path” to begin tracking your progress."
            action={<Link to="/services" className="btn-primary">Browse services</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {paths.map((p) => (
              <PathCard key={p.goal} goal={p.goal} completed={p.completedSteps} service={p.service} />
            ))}
          </div>
        )
      ) : tab === "saved" ? (
        savedServices.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={22} />}
            title="Nothing saved yet"
            description="Tap the bookmark on any service to save it for later."
            action={<Link to="/services" className="btn-primary">Browse services</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {savedServices.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )
      ) : journeys.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title="No applications tracked"
          description="When you start a path or save an application number, it appears here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {journeys.map((j) => (
            <JourneyCard key={j.id} journey={j} onRemove={() => removeJourney(j.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button onClick={onClick} className={`chip ${active ? "chip-active" : ""}`}>
      {icon} {label}
      <span className={`rounded-full px-1.5 text-[0.65rem] ${active ? "bg-primary/15" : "bg-elevated"}`}>
        {count}
      </span>
    </button>
  );
}

function PathCard({
  goal,
  completed,
  service,
}: {
  goal: string;
  completed: number;
  service?: ServiceSummary;
}) {
  return (
    <Link
      to={`/civic-path/${goal}`}
      className="group card flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-DEFAULT bg-primary-light text-lg">
          {service?.categories?.icon || "🧭"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold group-hover:text-primary">
            {service?.name || "Civic path"}
          </h3>
          <p className="truncate text-xs text-sub">
            {service?.cities?.name || "In progress"}
          </p>
        </div>
        <ArrowRight size={16} className="text-sub group-hover:text-primary" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-sub">
        <CheckCircle2 size={14} className="text-success" />
        {completed} step{completed === 1 ? "" : "s"} completed — tap to resume
      </div>
    </Link>
  );
}

function JourneyCard({ journey, onRemove }: { journey: Journey; onRemove: () => void }) {
  const status = journey.self_reported_status || "preparing";
  const tone =
    status === "submitted" ? "info" : status === "completed" ? "success" : "warn";
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-DEFAULT bg-primary-light text-lg">
        {journey.services?.categories?.icon || "📄"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold">
            {journey.title || journey.services?.name}
          </h3>
          <Badge tone={tone as any}>{status}</Badge>
        </div>
        <p className="truncate text-xs text-sub">
          {journey.services?.cities?.name}
          {journey.application_number && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Hash size={11} /> {journey.application_number}
            </span>
          )}
          {journey.started_at && ` · started ${formatDate(journey.started_at)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {journey.service_id && (
          <Link to={`/civic-path/${journey.service_id}?journey=${journey.id}`} className="btn-outline btn-sm">
            Open
          </Link>
        )}
        <button onClick={onRemove} className="btn-ghost h-8 w-8 rounded-full p-0 text-sub hover:text-danger" aria-label="Remove">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
