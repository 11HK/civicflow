import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StepNode, type StepNodeData } from "./StepNode";
import type { ServiceStep } from "@/types";

const nodeTypes = { step: StepNode };

export function CivicPathGraph({
  steps,
  completed,
  onOpenStep,
}: {
  steps: ServiceStep[];
  completed: Set<string>;
  onOpenStep: (step: ServiceStep) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    // First not-completed step is "active"; earlier are done; later locked until
    // the previous one is done (a soft, guidance-only gating).
    const firstIncomplete = steps.findIndex((s) => !completed.has(s.id));

    const nodes: Node<StepNodeData>[] = steps.map((s, i) => {
      let status: StepNodeData["status"];
      if (completed.has(s.id)) status = "done";
      else if (i === firstIncomplete) status = "active";
      else if (firstIncomplete !== -1 && i > firstIncomplete)
        status = "locked";
      else status = "todo";

      return {
        id: s.id,
        type: "step",
        position: { x: 40, y: i * 128 },
        data: {
          stepNumber: s.step_number,
          title: s.title,
          duration: s.estimated_duration,
          status,
          onOpen: () => onOpenStep(s),
        },
      };
    });

    const edges: Edge[] = steps.slice(1).map((s, i) => {
      const prev = steps[i];
      const bothDone = completed.has(prev.id) && completed.has(s.id);
      const activeEdge = completed.has(prev.id) && !completed.has(s.id);
      return {
        id: `${prev.id}-${s.id}`,
        source: prev.id,
        target: s.id,
        type: "smoothstep",
        animated: activeEdge,
        className: bothDone ? "completed" : activeEdge ? "active" : "",
        markerEnd: { type: MarkerType.ArrowClosed },
      };
    });

    return { nodes, edges };
  }, [steps, completed, onOpenStep]);

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-lg border border-border bg-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          zoomable
          pannable
          className="!hidden sm:!block"
          maskColor="rgba(0,0,0,0.06)"
          nodeColor={(n) => {
            const st = (n.data as StepNodeData).status;
            return st === "done"
              ? "rgb(var(--success))"
              : st === "active"
                ? "rgb(var(--primary))"
                : "rgb(var(--border))";
          }}
        />
      </ReactFlow>
    </div>
  );
}
