import { describe, expect, it } from "vitest";

import { broadcastTimeError } from "./broadcast-times";

const base = { date: "2026-11-19", call: "16:00", start: "19:00", end: "21:30" };

describe("broadcastTimeError", () => {
  it("accepts crew call at or before on air, and off air after on air", () => {
    expect(broadcastTimeError(base)).toBeNull();
    expect(broadcastTimeError({ ...base, call: "19:00" })).toBeNull();
    expect(broadcastTimeError({ ...base, call: "" })).toBeNull();
  });

  it("rejects off air earlier than or equal to on air", () => {
    expect(broadcastTimeError({ ...base, start: "19:00", end: "18:30" })).toBe(
      "Off air must be later than on air.",
    );
    expect(broadcastTimeError({ ...base, start: "19:00", end: "19:00" })).toBe(
      "Off air must be later than on air.",
    );
  });

  it("rejects on air earlier than crew call", () => {
    expect(broadcastTimeError({ ...base, call: "19:30", start: "19:00" })).toBe(
      "Crew call must be at or before on air.",
    );
  });
});
