/**
 * Double-booking detection: a crew member or equipment kit is in conflict when it is
 * assigned to two events whose on-air windows (start_at → end_at) overlap.
 * Back-to-back events (one ends exactly when the next starts) are not a conflict.
 */

export interface TimedEvent {
  id: string;
  start_at: string;
  end_at: string;
}

export interface CrewLink {
  event_id: string;
  crew_member_id: string;
}

export interface GearLink {
  event_id: string;
  kit_id: string;
}

/** resourceId -> ids of the other events it clashes with */
export type ResourceConflicts = Record<string, string[]>;

export interface EventConflicts {
  crew: ResourceConflicts;
  gear: ResourceConflicts;
  count: number;
}

export interface ConflictIndex {
  byEvent: Record<string, EventConflicts>;
  crewIds: Set<string>;
  kitIds: Set<string>;
  /** Number of distinct double-booked (resource, event pair) clashes */
  total: number;
}

const EMPTY: EventConflicts = { crew: {}, gear: {}, count: 0 };

export function overlaps(a: Pick<TimedEvent, "start_at" | "end_at">, b: Pick<TimedEvent, "start_at" | "end_at">) {
  const aStart = new Date(a.start_at).getTime();
  const aEnd = new Date(a.end_at).getTime();
  const bStart = new Date(b.start_at).getTime();
  const bEnd = new Date(b.end_at).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/** Events (other than the target) in `candidateEventIds` whose times overlap the target event. */
export function overlappingEventIds(
  target: TimedEvent,
  candidateEventIds: string[],
  eventsById: Map<string, TimedEvent>,
): string[] {
  return candidateEventIds.filter((id) => {
    if (id === target.id) return false;
    const other = eventsById.get(id);
    return other ? overlaps(target, other) : false;
  });
}

function groupByResource<T>(links: T[], key: (l: T) => string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const link of links) {
    const r = key(link);
    const eventId = (link as { event_id: string }).event_id;
    const list = map.get(r) ?? [];
    if (!list.includes(eventId)) list.push(eventId);
    map.set(r, list);
  }
  return map;
}

export function buildConflictIndex(
  events: TimedEvent[],
  crewLinks: CrewLink[],
  gearLinks: GearLink[],
): ConflictIndex {
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const byEvent: Record<string, EventConflicts> = {};
  const crewIds = new Set<string>();
  const kitIds = new Set<string>();
  let total = 0;

  const ensure = (eventId: string) =>
    (byEvent[eventId] ??= { crew: {}, gear: {}, count: 0 });

  const record = (entry: EventConflicts, kind: "crew" | "gear", resourceId: string, other: string) => {
    const list = (entry[kind][resourceId] ??= []);
    if (list.length === 0) entry.count += 1;
    if (!list.includes(other)) list.push(other);
  };

  const scan = (
    grouped: Map<string, string[]>,
    kind: "crew" | "gear",
    flagged: Set<string>,
  ) => {
    for (const [resourceId, eventIds] of grouped) {
      for (let i = 0; i < eventIds.length; i++) {
        for (let j = i + 1; j < eventIds.length; j++) {
          const a = eventsById.get(eventIds[i] ?? "");
          const b = eventsById.get(eventIds[j] ?? "");
          if (!a || !b || !overlaps(a, b)) continue;
          total += 1;
          flagged.add(resourceId);
          record(ensure(a.id), kind, resourceId, b.id);
          record(ensure(b.id), kind, resourceId, a.id);
        }
      }
    }
  };

  scan(groupByResource(crewLinks, (l) => l.crew_member_id), "crew", crewIds);
  scan(groupByResource(gearLinks, (l) => l.kit_id), "gear", kitIds);

  return { byEvent, crewIds, kitIds, total };
}

export function conflictsForEvent(index: ConflictIndex, eventId: string): EventConflicts {
  return index.byEvent[eventId] ?? EMPTY;
}
