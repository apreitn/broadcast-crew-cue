import { Link } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ConflictIndex } from "@/lib/conflicts";
import { fmtTime, type BroadcastEvent } from "@/lib/planner";
import { cn } from "@/lib/utils";

const statusChip: Record<BroadcastEvent["status"], string> = {
  live: "border-live bg-live/20 text-foreground",
  scheduled: "border-scheduled bg-scheduled/10 text-foreground",
  completed: "border-completed bg-muted text-muted-foreground",
};

export function CalendarView({
  events,
  conflicts,
}: {
  events: BroadcastEvent[];
  conflicts: ConflictIndex;
}) {
  const [month, setMonth] = useState(() => {
    const next = events.find((e) => new Date(e.end_at) >= new Date());
    return startOfMonth(next ? new Date(next.start_at) : new Date());
  });
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="eyebrow px-2 py-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0",
                !isSameMonth(day, month) && "bg-background/50 opacity-50",
              )}
            >
              <div
                className={cn(
                  "timecode mb-1 inline-grid size-6 place-items-center rounded text-xs text-muted-foreground",
                  isToday(day) && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="grid gap-1">
                {dayEvents.map((e) => {
                  const hasConflict = (conflicts.byEvent[e.id]?.count ?? 0) > 0;
                  return (
                    <Link
                      key={e.id}
                      to="/events/$eventId"
                      params={{ eventId: e.id }}
                      className={cn(
                        "block rounded border-l-2 px-1.5 py-1 text-xs transition-colors hover:bg-accent",
                        statusChip[e.status],
                        hasConflict && "ring-1 ring-conflict",
                      )}
                    >
                      <span className="timecode flex items-center gap-1 text-[10px] text-muted-foreground">
                        {fmtTime(e.start_at)}
                        {hasConflict && <AlertTriangle className="size-3 text-conflict" />}
                      </span>
                      <span className="line-clamp-2 font-medium leading-tight">{e.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
