import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type EventStatus } from "@/lib/planner";

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant={status} className="gap-1.5">
      {status === "live" && <span className="size-1.5 rounded-full bg-live-foreground animate-tally" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function ConflictBadge({ count, label }: { count?: number; label?: string }) {
  return (
    <Badge variant="conflict" className="gap-1">
      <AlertTriangle className="size-3" />
      {label ?? (count && count > 1 ? `${count} conflicts` : "Conflict")}
    </Badge>
  );
}

export function ClearBadge({ label = "Clear" }: { label?: string }) {
  return (
    <Badge variant="ok" className="gap-1">
      <CheckCircle2 className="size-3" />
      {label}
    </Badge>
  );
}
