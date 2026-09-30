import { Handle, Position } from "@xyflow/react";
import { Check, Clock, Lock, Play } from "lucide-react";

export interface StepNodeData {
  stepNumber: number;
  title: string;
  duration?: string;
  status: "done" | "active" | "locked" | "todo";
  onOpen: () => void;
  [key: string]: unknown;
}

export function StepNode({ data }: { data: StepNodeData }) {
  const { status } = data;

  const ring =
    status === "done"
      ? "border-success bg-success-light"
      : status === "active"
        ? "border-primary bg-primary-light ring-2 ring-primary/25"
        : status === "locked"
          ? "border-border bg-card opacity-70"
          : "border-border bg-card";

  const badge =
    status === "done" ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
        <Check size={14} />
      </span>
    ) : status === "active" ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
        <Play size={12} className="translate-x-[1px]" />
      </span>
    ) : status === "locked" ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-elevated text-sub">
        <Lock size={12} />
      </span>
    ) : (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-xs font-bold text-sub">
        {data.stepNumber}
      </span>
    );

  return (
    <div
      onClick={data.onOpen}
      className={`w-[236px] cursor-pointer rounded-DEFAULT border-2 px-3.5 py-3 shadow-card transition-all hover:shadow-lift ${ring}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-border"
      />
      <div className="flex items-start gap-2.5">
        {badge}
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-sub">
            Step {data.stepNumber}
          </p>
          <p className="mt-0.5 text-[0.86rem] font-bold leading-snug text-text">
            {data.title}
          </p>
          {data.duration && (
            <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-sub">
              <Clock size={11} /> {data.duration}
            </p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-border"
      />
    </div>
  );
}
