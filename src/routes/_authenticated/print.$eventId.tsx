import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlanner } from "@/hooks/use-planner";
import { conflictsForEvent } from "@/lib/conflicts";
import {
  roleLabel,
  STATUS_LABELS,
  fmtDate,
  fmtRange,
  fmtShortDate,
  fmtTime,
  plannerQuery,
  sortCrewByRole,
} from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/print/$eventId")({
  head: () => ({
    meta: [
      { title: "Call Sheet — BroadcastOps Planner" },
      { name: "description", content: "Printable call sheet with schedule, crew list and gear checklist." },
      { property: "og:title", content: "Call Sheet — BroadcastOps Planner" },
      { property: "og:description", content: "Printable call sheet with schedule, crew list and gear checklist." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(plannerQuery);
    if (!data.events.some((e) => e.id === params.eventId)) throw notFound();
  },
  component: PrintCallSheet,
});

function PrintCallSheet() {
  const { eventId } = Route.useParams();
  const planner = usePlanner();
  const event = planner.eventsById.get(eventId);
  if (!event) return null;
  const conflicts = conflictsForEvent(planner.conflicts, event.id);
  const crew = sortCrewByRole(
    planner.eventCrew
      .filter((l) => l.event_id === event.id)
      .map((l) => planner.crewById.get(l.crew_member_id))
      .filter((c) => c !== undefined),
  );
  const gear = planner.eventGear
    .filter((l) => l.event_id === event.id)
    .map((link) => ({ link, kit: planner.kitsById.get(link.kit_id) }))
    .filter((x): x is { link: typeof x.link; kit: NonNullable<typeof x.kit> } => !!x.kit);

  const clashText = (ids?: string[]) =>
    ids
      ?.map((id) => {
        const o = planner.eventsById.get(id);
        return o ? `${o.title} (${fmtShortDate(o.start_at)} ${fmtRange(o)})` : "";
      })
      .join("; ");

  const schedule = [
    ...(event.crew_call_at ? [{ label: "Crew call", time: event.crew_call_at }] : []),
    { label: "On air", time: event.start_at },
    { label: "Off air", time: event.end_at },
  ];

  return (
    <div className="print-sheet min-h-screen">
      <div className="no-print sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-3">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to event
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Choose “Save as PDF” in the print dialog to get a PDF.
            </span>
            <Button onClick={() => window.print()}>
              <Printer />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-6 py-10 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-foreground pb-4">
          <div>
            <p className="eyebrow">BroadcastOps Planner · Call Sheet</p>
            <h1 className="mt-1 text-3xl font-extrabold">{event.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.sport} · {event.venue || "Venue TBC"}
            </p>
          </div>
          <div className="text-right">
            <p className="timecode text-lg font-semibold">{fmtDate(event.start_at)}</p>
            <p className="eyebrow mt-1">Status: {STATUS_LABELS[event.status]}</p>
          </div>
        </header>

        {conflicts.count > 0 && (
          <div className="print-avoid-break mt-4 flex items-start gap-2 rounded border border-conflict px-3 py-2 text-sm text-conflict">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {conflicts.count} double-booked {conflicts.count === 1 ? "resource" : "resources"} — confirm before
            call time.
          </div>
        )}

        <section className="print-avoid-break mt-6">
          <h2 className="eyebrow mb-2 text-foreground">Schedule</h2>
          <div className="grid grid-cols-3 gap-3">
            {schedule.map((s) => (
              <div key={s.label} className="rounded border bg-card px-4 py-3">
                <p className="eyebrow">{s.label}</p>
                <p className="timecode mt-1 text-2xl font-semibold">{fmtTime(s.time)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="eyebrow mb-2 text-foreground">Crew ({crew.length})</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="eyebrow py-2 pr-3 font-normal">Role</th>
                <th className="eyebrow py-2 pr-3 font-normal">Name</th>
                <th className="eyebrow py-2 pr-3 font-normal">Phone</th>
                <th className="eyebrow py-2 font-normal">Email</th>
              </tr>
            </thead>
            <tbody>
              {crew.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-muted-foreground">
                    No crew assigned.
                  </td>
                </tr>
              )}
              {crew.map((c) => (
                <tr key={c.id} className="print-avoid-break border-b align-top">
                  <td className="py-2 pr-3 font-medium">{roleLabel(c.role)}</td>
                  <td className="py-2 pr-3">
                    {c.name}
                    {conflicts.crew[c.id] && (
                      <p className="text-xs font-semibold text-conflict">
                        ⚠ Double-booked: {clashText(conflicts.crew[c.id])}
                      </p>
                    )}
                  </td>
                  <td className="timecode whitespace-nowrap py-2 pr-3">{c.phone ?? "—"}</td>
                  <td className="py-2">{c.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8">
          <h2 className="eyebrow mb-2 text-foreground">Gear checklist ({gear.length})</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="eyebrow w-10 py-2 font-normal">✓</th>
                <th className="eyebrow py-2 pr-3 font-normal">Kit</th>
                <th className="eyebrow py-2 pr-3 font-normal">Category</th>
                <th className="eyebrow py-2 font-normal">Serial</th>
              </tr>
            </thead>
            <tbody>
              {gear.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-muted-foreground">
                    No gear assigned.
                  </td>
                </tr>
              )}
              {gear.map(({ kit, link }) => (
                <tr key={link.id} className="print-avoid-break border-b align-top">
                  <td className="py-2">
                    <span className="inline-grid size-4 place-items-center rounded-sm border border-foreground text-[10px] leading-none">
                      {link.packed ? "✓" : ""}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-medium">
                    {kit.name}
                    {conflicts.gear[kit.id] && (
                      <p className="text-xs font-semibold text-conflict">
                        ⚠ Double-booked: {clashText(conflicts.gear[kit.id])}
                      </p>
                    )}
                  </td>
                  <td className="py-2 pr-3">{kit.category}</td>
                  <td className="timecode whitespace-nowrap py-2">{kit.serial ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {event.notes && (
          <section className="print-avoid-break mt-8">
            <h2 className="eyebrow mb-2 text-foreground">Production notes</h2>
            <p className="whitespace-pre-wrap rounded border bg-card px-4 py-3 text-sm">{event.notes}</p>
          </section>
        )}

        <footer className="mt-10 border-t pt-3 text-xs text-muted-foreground">
          Generated {format(new Date(), "d MMM yyyy, HH:mm")} · BroadcastOps Planner
        </footer>
      </article>
    </div>
  );
}
