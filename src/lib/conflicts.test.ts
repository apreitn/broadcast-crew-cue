import { describe, expect, it } from "vitest";
import { buildConflictIndex, conflictsForEvent, overlappingEventIds } from "./conflicts";

const football = { id: "football", start_at: "2026-11-22T18:00:00+02:00", end_at: "2026-11-22T21:00:00+02:00" };
const basketball = { id: "basketball", start_at: "2026-11-22T19:30:00+02:00", end_at: "2026-11-22T22:30:00+02:00" };
const lateShow = { id: "late", start_at: "2026-11-22T21:00:00+02:00", end_at: "2026-11-22T23:00:00+02:00" };
const events = [football, basketball, lateShow];

describe("double-booking detection", () => {
  it("flags a crew member assigned to two overlapping events", () => {
    const index = buildConflictIndex(
      events,
      [
        { event_id: "football", crew_member_id: "marcus" },
        { event_id: "basketball", crew_member_id: "marcus" },
      ],
      [],
    );
    expect(conflictsForEvent(index, "football").crew).toEqual({ marcus: ["basketball"] });
    expect(conflictsForEvent(index, "basketball").crew).toEqual({ marcus: ["football"] });
    expect(index.crewIds.has("marcus")).toBe(true);
    expect(index.total).toBe(1);
  });

  it("flags an equipment kit assigned to two overlapping events", () => {
    const index = buildConflictIndex(
      events,
      [],
      [
        { event_id: "football", kit_id: "drone" },
        { event_id: "basketball", kit_id: "drone" },
      ],
    );
    expect(conflictsForEvent(index, "football").gear).toEqual({ drone: ["basketball"] });
    expect(index.kitIds.has("drone")).toBe(true);
  });

  it("does not flag back-to-back events where one ends exactly as the next starts", () => {
    const index = buildConflictIndex(
      events,
      [
        { event_id: "football", crew_member_id: "elena" },
        { event_id: "late", crew_member_id: "elena" },
      ],
      [],
    );
    expect(index.total).toBe(0);
    expect(conflictsForEvent(index, "football").count).toBe(0);
  });

  it("does not flag different people working overlapping events", () => {
    const index = buildConflictIndex(
      events,
      [
        { event_id: "football", crew_member_id: "elena" },
        { event_id: "basketball", crew_member_id: "jonas" },
      ],
      [],
    );
    expect(index.total).toBe(0);
  });

  it("warns before assigning a resource already booked for an overlapping event", () => {
    const byId = new Map(events.map((e) => [e.id, e]));
    expect(overlappingEventIds(basketball, ["football", "late", "basketball"], byId)).toEqual([
      "football",
      "late",
    ]);
  });
});
