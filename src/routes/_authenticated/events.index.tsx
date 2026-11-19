import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, List, MapPin, Plus } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { CalendarView } from "@/components/calendar-view";
import { EventFormDialog } from "@/components/event-form-dialog";
import { ClearBadge, ConflictBadge, StatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePlanner } from "@/hooks/use-planner";
import {
  EVENT_STATUSES,
  STATUS_LABELS,
  fmtRange,
  fmtShortDate,
  plannerQuery,
  type EventStatus,
} from "@/lib/planner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "Events Dashboard — BroadcastOps Planner" },
      { name: "description", content: "Upcoming live sports broadcasts with crew, gear and double-booking alerts." },
      { property: "og:title", content: "Events Dashboard — BroadcastOps Planner" },
      { property: "og:description", content: "Upcoming live sports broadcasts with crew, gear and double-booking alerts." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plannerQuery),
  component: EventsDashboard,
});

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "live" | "conflict" }) {
  return (
    <div
      className={cn(
        "panel px-4 py-3",
        tone === "live" && value > 0 && "border-live/60",
        tone === "conflict" && value > 0 && "border-conflict/70 shadow-glow-conflict",
      )}
    >
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "timecode mt-1 text-3xl font-semibold",
          tone === "live" && value > 0 && "text-live",
          tone === "conflict" && value > 0 && "text-conflict",
        )}
      >
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function EventsDashboard() {
  const planner = usePlanner();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<EventStatus | "all">("all");

  const { events, conflicts, eventCrew, eventGear } = planner;
  const visible = filter === "all" ? events : events.filter((e) => e.status === filter);
  const liveCount = events.filter((e) => e.status === "live").length;
  const upcomingCount = events.filter((e) => e.status === "scheduled").length;
  const conflictedEvents = events.filter((e) => (conflicts.byEvent[e.id]?.count ?? 0) > 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Production schedule"
        title="Events"
        actions={
          <EventFormDialog
            trigger={
              <Button>
                <Plus />
                New broadcast
              </Button>
            }
            onSaved={(id) => navigate({ to: "/events/$eventId", params: { eventId: id } })}
          />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Live now" value={liveCount} tone="live" />
        <StatTile label="Scheduled" value={upcomingCount} />
        <StatTile label="Crew double-booked" value={conflicts.crewIds.size} tone="conflict" />
        <StatTile label="Gear double-booked" value={conflicts.kitIds.size} tone="conflict" />
      </div>

      {conflictedEvents.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-conflict/60 bg-conflict/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-conflict" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Double-booking detected</p>
            <p className="text-muted-foreground">
              {conflictedEvents.length} broadcasts share crew or gear at overlapping times:{" "}
              {conflictedEvents.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <Link
                    to="/events/$eventId"
                    params={{ eventId: e.id }}
                    className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                  >
                    {e.title}
                  </Link>
                </span>
              ))}
              .
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as EventStatus | "all")}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          {EVENT_STATUSES.map((s) => (
            <ToggleGroupItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setView(v as "list" | "calendar")}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="size-4" /> List
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <CalendarDays className="size-4" /> Calendar
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "calendar" ? (
        <CalendarView events={visible} conflicts={conflicts} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="eyebrow">Date</TableHead>
                <TableHead className="eyebrow">On air</TableHead>
                <TableHead className="eyebrow">Broadcast</TableHead>
                <TableHead className="eyebrow hidden md:table-cell">Venue</TableHead>
                <TableHead className="eyebrow hidden text-center lg:table-cell">Crew</TableHead>
                <TableHead className="eyebrow hidden text-center lg:table-cell">Gear</TableHead>
                <TableHead className="eyebrow">Status</TableHead>
                <TableHead className="eyebrow">Bookings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No broadcasts here yet.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((e) => {
                const c = conflicts.byEvent[e.id];
                return (
                  <TableRow
                    key={e.id}
                    className={cn(
                      "cursor-pointer",
                      e.status === "live" && "bg-live/5",
                      e.status === "completed" && "opacity-70",
                    )}
                    onClick={() => navigate({ to: "/events/$eventId", params: { eventId: e.id } })}
                  >
                    <TableCell className="timecode whitespace-nowrap text-sm">{fmtShortDate(e.start_at)}</TableCell>
                    <TableCell className="timecode whitespace-nowrap text-sm">{fmtRange(e)}</TableCell>
                    <TableCell>
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: e.id }}
                        className="font-semibold text-foreground hover:text-primary"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        {e.title}
                      </Link>
                      <p className="eyebrow mt-0.5">{e.sport}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {e.venue || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="timecode hidden text-center lg:table-cell">
                      {eventCrew.filter((l) => l.event_id === e.id).length}
                    </TableCell>
                    <TableCell className="timecode hidden text-center lg:table-cell">
                      {eventGear.filter((l) => l.event_id === e.id).length}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell>{c?.count ? <ConflictBadge count={c.count} /> : <ClearBadge />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
