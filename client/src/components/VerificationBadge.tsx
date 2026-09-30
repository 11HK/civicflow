import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "./ui";
import type { VerificationStatus } from "@/types";

export function VerificationBadge({
  status,
  size = 13,
}: {
  status?: VerificationStatus;
  size?: number;
}) {
  const s = status || "NEEDS_VERIFICATION";
  if (s === "VERIFIED")
    return (
      <Badge tone="success">
        <ShieldCheck size={size} /> Verified
      </Badge>
    );
  if (s === "OUTDATED")
    return (
      <Badge tone="danger">
        <AlertTriangle size={size} /> Outdated
      </Badge>
    );
  return (
    <Badge tone="warn">
      <Clock size={size} /> Needs review
    </Badge>
  );
}
