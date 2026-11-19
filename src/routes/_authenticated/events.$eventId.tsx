import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, FileDown, MapPin, Pencil, Printer, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CrewPanel, GearPanel } from "@/components/assignment-panels";
import { EventFormDialog } from "@/components/event-form-dialog";
import { StatusBadge } from "@/components/status-badges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlanner, usePlannerMutation } from "@/hooks/use-planner";
import { supabase } from "@/integrations/supabase/client";
import { buildCallSheetCsv, callSheetFilename, downloadCsv } from "@/lib/callsheet";
import { conflictsForEvent } from "@/lib/conflicts";
import {
  EVENT_STATUSES,
  STATUS_LABELS,
  fmtDate,
  fmtTime,
  plannerQuery,
  type EventStatus,
} from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Details — BroadcastOps Planner" },
      { name: "description", content: "Crew, gear checklist and schedule for a live sports broadcast." },
      { property: "og:title", content: "Event Details — BroadcastOps Planner" },
      { property: "og:description", content: "Crew, gear checklist and schedule for a live sports broadcast." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(plannerQuery);
    if (!data.events.some((e) => e.id === params.eventId)) throw notFound();
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold">Broadcast not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been deleted.</p>
        <Button asChild className="mt-6">
          <Link to="/events">Back to events</Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: EventDetail,
});

function TimeTile({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div className="panel px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="timecode mt-1 text-2xl font-semibold">{iso ? fmtTime(iso) : "—"}</p>
    </div>
  );
}

function EventDetail() {
  const { eventId } = Route.useParams();
  const planner = usePlanner();
  const navigate = useNavigate();
  const event = planner.eventsById.get(eventId);

  const setStatus = usePlannerMutation(
    (status: EventStatus) => supabase.from("events").update({ status }).eq("id", eventId),
    { success: "Status updated" },
  );
  const remove = usePlannerMutation(() => supabase.from("events").delete().eq("id", eventId), {
    success: "Broadcast deleted",
  });

  if (!event) return null;
  const conflicts = conflictsForEvent(planner.conflicts, event.id);

  function exportCsv() {
    if (!event) return;
    const crew = planner.eventCrew
      .filter((l) => l.event_id === event.id)
      .map((l) => planner.crewById.get(l.crew_member_id))
      .filter((c) => c !== undefined);
    const gear = planner.eventGear
      .filter((l) => l.event_id === event.id)
      .map((link) => ({ link, kit: planner.kitsById.get(link.kit_id) }))
      .filter((x): x is { link: typeof x.link; kit: NonNullable<typeof x.kit> } => !!x.kit);
    const csv = buildCallSheetCsv({
      event,
      crew,
      gear,
      conflicts,
      eventTitle: (id) => planner.eventsById.get(id)?.title ?? "another event",
    });
    downloadCsv(csv, callSheetFilename(event));
  }

  return (
    <AppShell>
      <Link to="/events" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        All events
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="eyebrow">{event.sport}</span>
            <StatusBadge status={event.status} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="timecode">{fmtDate(event.start_at)}</span>
            {event.venue && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {event.venue}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={event.status} onValueChange={(v) => setStatus.mutate(v as EventStatus)}>
            <SelectTrigger className="w-36" aria-label="Change status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EventFormDialog
            event={event}
            trigger={
              <Button variant="outline">
                <Pencil />
                Edit
              </Button>
            }
          />
          <Button variant="outline" onClick={exportCsv}>
            <FileDown />
            Export CSV
          </Button>
          <Button asChild>
            <Link to="/print/$eventId" params={{ eventId: event.id }}>
              <Printer />
              Call sheet / PDF
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete broadcast">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this broadcast?</AlertDialogTitle>
                <AlertDialogDescription>
                  “{event.title}” and its crew and gear assignments will be removed for the whole team.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={() => remove.mutate(undefined, { onSuccess: () => navigate({ to: "/events" }) })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {conflicts.count > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-conflict/60 bg-conflict/10 px-4 py-3 shadow-glow-conflict">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-conflict" />
          <p className="text-sm">
            <span className="font-semibold">
              {conflicts.count} {conflicts.count === 1 ? "resource is" : "resources are"} double-booked.
            </span>{" "}
            <span className="text-muted-foreground">
              Reassign the flagged crew or gear below — they are also booked on overlapping broadcasts.
            </span>
          </p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <TimeTile label="Crew call" iso={event.crew_call_at} />
        <TimeTile label="On air" iso={event.start_at} />
        <TimeTile label="Off air" iso={event.end_at} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CrewPanel event={event} />
        <GearPanel event={event} />
      </div>

      {event.notes && (
        <section className="panel mt-6 px-4 py-4">
          <p className="eyebrow mb-2">Production notes</p>
          <p className="whitespace-pre-wrap text-sm">{event.notes}</p>
        </section>
      )}
    </AppShell>
  );
}
