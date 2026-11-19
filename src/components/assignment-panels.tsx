import { Link } from "@tanstack/react-router";
import { AlertTriangle, Package, Phone, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConflictBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlanner, usePlannerMutation } from "@/hooks/use-planner";
import { supabase } from "@/integrations/supabase/client";
import { conflictsForEvent, overlappingEventIds } from "@/lib/conflicts";
import {
  CREW_ROLES,
  ROLE_LABELS,
  fmtRange,
  fmtShortDate,
  sortCrewByRole,
  type BroadcastEvent,
} from "@/lib/planner";
import { cn } from "@/lib/utils";

type Planner = ReturnType<typeof usePlanner>;

function ClashList({ eventIds, planner }: { eventIds: string[]; planner: Planner }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-conflict">
      <AlertTriangle className="size-3" />
      Also booked on
      {eventIds.map((id, i) => {
        const other = planner.eventsById.get(id);
        if (!other) return null;
        return (
          <span key={id}>
            {i > 0 && ", "}
            <Link
              to="/events/$eventId"
              params={{ eventId: id }}
              className="font-semibold underline underline-offset-2"
            >
              {other.title}
            </Link>{" "}
            <span className="timecode">
              ({fmtShortDate(other.start_at)} {fmtRange(other)})
            </span>
          </span>
        );
      })}
    </p>
  );
}

function PanelHeader({ icon: Icon, title, meta }: { icon: typeof Users; title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      <span className="eyebrow">{meta}</span>
    </div>
  );
}

/** Clash preview for the picker: which overlapping events already hold this resource. */
function useClashPreview(event: BroadcastEvent, planner: Planner) {
  return (bookedEventIds: string[]) =>
    overlappingEventIds(event, bookedEventIds, planner.eventsById)
      .map((id) => planner.eventsById.get(id)?.title)
      .filter(Boolean)
      .join(", ");
}

export function CrewPanel({ event }: { event: BroadcastEvent }) {
  const planner = usePlanner();
  const [pickerKey, setPickerKey] = useState(0);
  const conflicts = conflictsForEvent(planner.conflicts, event.id);
  const clashPreview = useClashPreview(event, planner);

  const links = planner.eventCrew.filter((l) => l.event_id === event.id);
  const assigned = sortCrewByRole(
    links.map((l) => planner.crewById.get(l.crew_member_id)).filter((c) => c !== undefined),
  );
  const assignedIds = new Set(assigned.map((c) => c.id));
  const available = sortCrewByRole(planner.crew.filter((c) => !assignedIds.has(c.id)));
  const missingRoles = CREW_ROLES.filter((r) => !assigned.some((c) => c.role === r));

  const add = usePlannerMutation((crewId: string) =>
    supabase.from("event_crew").insert({ event_id: event.id, crew_member_id: crewId }),
  );
  const remove = usePlannerMutation((crewId: string) =>
    supabase.from("event_crew").delete().eq("event_id", event.id).eq("crew_member_id", crewId),
  );

  function assign(crewId: string) {
    const member = planner.crewById.get(crewId);
    const clash = clashPreview(
      planner.eventCrew.filter((l) => l.crew_member_id === crewId).map((l) => l.event_id),
    );
    add.mutate(crewId, {
      onSuccess: () =>
        clash
          ? toast.warning(`${member?.name} is double-booked`, { description: `Overlaps with ${clash}` })
          : toast.success(`${member?.name} assigned`),
    });
    setPickerKey((k) => k + 1);
  }

  return (
    <section className="panel overflow-hidden">
      <PanelHeader icon={Users} title="Crew" meta={`${assigned.length} assigned`} />
      <ul className="divide-y">
        {assigned.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No crew assigned yet.</li>
        )}
        {assigned.map((c) => {
          const clash = conflicts.crew[c.id];
          return (
            <li key={c.id} className={cn("flex items-start gap-3 px-4 py-3", clash && "bg-conflict/5")}>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md bg-secondary font-mono text-xs font-semibold",
                  clash && "bg-conflict text-conflict-foreground",
                )}
              >
                {c.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.name}</span>
                  {clash && <ConflictBadge label="Double-booked" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[c.role]}
                  {c.phone && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Phone className="size-3" />
                      <span className="timecode">{c.phone}</span>
                    </span>
                  )}
                </p>
                {clash && <ClashList eventIds={clash} planner={planner} />}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${c.name}`}
                onClick={() => remove.mutate(c.id)}
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 border-t bg-panel-raised/50 px-4 py-3">
        {missingRoles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Unfilled: {missingRoles.map((r) => ROLE_LABELS[r]).join(", ")}
          </p>
        )}
        <Select key={pickerKey} onValueChange={assign} disabled={available.length === 0}>
          <SelectTrigger aria-label="Assign crew member">
            <span className="flex items-center gap-2 text-muted-foreground">
              <UserPlus className="size-4" />
              <SelectValue placeholder={available.length ? "Assign crew member…" : "All crew assigned"} />
            </span>
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => {
              const clash = clashPreview(
                planner.eventCrew.filter((l) => l.crew_member_id === c.id).map((l) => l.event_id),
              );
              return (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex flex-col">
                    <span>
                      {c.name} <span className="text-muted-foreground">· {ROLE_LABELS[c.role]}</span>
                    </span>
                    {clash && <span className="text-xs text-conflict">⚠ Booked on {clash}</span>}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

export function GearPanel({ event }: { event: BroadcastEvent }) {
  const planner = usePlanner();
  const [pickerKey, setPickerKey] = useState(0);
  const conflicts = conflictsForEvent(planner.conflicts, event.id);
  const clashPreview = useClashPreview(event, planner);

  const links = planner.eventGear
    .filter((l) => l.event_id === event.id)
    .map((link) => ({ link, kit: planner.kitsById.get(link.kit_id) }))
    .filter((x): x is { link: typeof x.link; kit: NonNullable<typeof x.kit> } => !!x.kit);
  const assignedIds = new Set(links.map((l) => l.kit.id));
  const available = planner.kits.filter((k) => !assignedIds.has(k.id));
  const packed = links.filter((l) => l.link.packed).length;

  const add = usePlannerMutation((kitId: string) =>
    supabase.from("event_gear").insert({ event_id: event.id, kit_id: kitId }),
  );
  const remove = usePlannerMutation((id: string) => supabase.from("event_gear").delete().eq("id", id));
  const togglePacked = usePlannerMutation((v: { id: string; packed: boolean }) =>
    supabase.from("event_gear").update({ packed: v.packed }).eq("id", v.id),
  );

  function assign(kitId: string) {
    const kit = planner.kitsById.get(kitId);
    const clash = clashPreview(planner.eventGear.filter((l) => l.kit_id === kitId).map((l) => l.event_id));
    add.mutate(kitId, {
      onSuccess: () =>
        clash
          ? toast.warning(`${kit?.name} is double-booked`, { description: `Overlaps with ${clash}` })
          : toast.success(`${kit?.name} added`),
    });
    setPickerKey((k) => k + 1);
  }

  return (
    <section className="panel overflow-hidden">
      <PanelHeader icon={Package} title="Gear checklist" meta={`${packed}/${links.length} packed`} />
      <ul className="divide-y">
        {links.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">No gear on this job yet.</li>
        )}
        {links.map(({ link, kit }) => {
          const clash = conflicts.gear[kit.id];
          return (
            <li key={link.id} className={cn("flex items-start gap-3 px-4 py-3", clash && "bg-conflict/5")}>
              <Checkbox
                className="mt-1"
                checked={link.packed}
                aria-label={`Mark ${kit.name} packed`}
                onCheckedChange={(v) => togglePacked.mutate({ id: link.id, packed: v === true })}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("font-semibold", link.packed && "text-muted-foreground line-through")}>
                    {kit.name}
                  </span>
                  {clash && <ConflictBadge label="Double-booked" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kit.category}
                  {kit.serial && <span className="timecode ml-2">S/N {kit.serial}</span>}
                </p>
                {clash && <ClashList eventIds={clash} planner={planner} />}
              </div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${kit.name}`} onClick={() => remove.mutate(link.id)}>
                <X />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="border-t bg-panel-raised/50 px-4 py-3">
        <Select key={pickerKey} onValueChange={assign} disabled={available.length === 0}>
          <SelectTrigger aria-label="Add equipment kit">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Package className="size-4" />
              <SelectValue placeholder={available.length ? "Add equipment kit…" : "All kits on this job"} />
            </span>
          </SelectTrigger>
          <SelectContent>
            {available.map((k) => {
              const clash = clashPreview(planner.eventGear.filter((l) => l.kit_id === k.id).map((l) => l.event_id));
              return (
                <SelectItem key={k.id} value={k.id}>
                  <span className="flex flex-col">
                    <span>
                      {k.name} <span className="text-muted-foreground">· {k.category}</span>
                    </span>
                    {clash && <span className="text-xs text-conflict">⚠ Booked on {clash}</span>}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
