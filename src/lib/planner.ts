import { queryOptions } from "@tanstack/react-query";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type BroadcastEvent = Tables["events"]["Row"];
export type BroadcastEventInsert = Tables["events"]["Insert"];
export type CrewMember = Tables["crew_members"]["Row"];
export type EquipmentKit = Tables["equipment_kits"]["Row"];
export type EventCrew = Tables["event_crew"]["Row"];
export type EventGear = Tables["event_gear"]["Row"];
export type CrewRole = Database["public"]["Enums"]["crew_role"];
export type EventStatus = Database["public"]["Enums"]["event_status"];

export const CREW_ROLES: CrewRole[] = [
  "director",
  "camera_operator",
  "sound_engineer",
  "graphics_operator",
];

export const ROLE_LABELS: Record<CrewRole, string> = {
  director: "Director",
  camera_operator: "Camera Operator",
  sound_engineer: "Sound Engineer",
  graphics_operator: "Graphics Operator",
};

export const EVENT_STATUSES: EventStatus[] = ["scheduled", "live", "completed"];

export const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Scheduled",
  live: "Live",
  completed: "Completed",
};

export const SPORTS = ["Football", "Basketball", "Hockey", "Tennis", "Motorsport", "Other"];

export interface PlannerData {
  events: BroadcastEvent[];
  crew: CrewMember[];
  kits: EquipmentKit[];
  eventCrew: EventCrew[];
  eventGear: EventGear[];
}

export const plannerQueryKey = ["planner"] as const;

export const plannerQuery = queryOptions({
  queryKey: plannerQueryKey,
  queryFn: async (): Promise<PlannerData> => {
    const [events, crew, kits, eventCrew, eventGear] = await Promise.all([
      supabase.from("events").select("*").order("start_at", { ascending: true }),
      supabase.from("crew_members").select("*").order("name"),
      supabase.from("equipment_kits").select("*").order("name"),
      supabase.from("event_crew").select("*").order("created_at"),
      supabase.from("event_gear").select("*").order("created_at"),
    ]);
    for (const r of [events, crew, kits, eventCrew, eventGear]) {
      if (r.error) throw r.error;
    }
    return {
      events: events.data ?? [],
      crew: crew.data ?? [],
      kits: kits.data ?? [],
      eventCrew: eventCrew.data ?? [],
      eventGear: eventGear.data ?? [],
    };
  },
});

export const fmtDate = (iso: string) => format(new Date(iso), "EEE d MMM yyyy");
export const fmtShortDate = (iso: string) => format(new Date(iso), "EEE d MMM");
export const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
export const fmtRange = (e: Pick<BroadcastEvent, "start_at" | "end_at">) =>
  `${fmtTime(e.start_at)}–${fmtTime(e.end_at)}`;

/** Sort crew in call-sheet order: director first, then cameras, sound, graphics. */
export function sortCrewByRole(list: CrewMember[]) {
  return [...list].sort(
    (a, b) => CREW_ROLES.indexOf(a.role) - CREW_ROLES.indexOf(b.role) || a.name.localeCompare(b.name),
  );
}
