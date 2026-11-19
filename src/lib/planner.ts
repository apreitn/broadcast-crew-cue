import { queryOptions } from "@tanstack/react-query";
import { format } from "date-fns";

import type { Database } from "@/integrations/supabase/types";
import { dbFrom } from "@/lib/db";

type Tables = Database["public"]["Tables"];
export type BroadcastEvent = Tables["events"]["Row"];
export type BroadcastEventInsert = Tables["events"]["Insert"];
export type CrewMember = Omit<Tables["crew_members"]["Row"], "role"> & { role: string };
export type EquipmentKit = Tables["equipment_kits"]["Row"];
export type EventCrew = Tables["event_crew"]["Row"];
export type EventGear = Tables["event_gear"]["Row"];
export type EventStatus = Database["public"]["Enums"]["event_status"];

export const CREW_ROLES = ["director", "camera_operator", "sound_engineer", "graphics_operator"] as const;
export type CrewRole = (typeof CREW_ROLES)[number];

export const ROLE_LABELS: Record<CrewRole, string> = {
  director: "Director",
  camera_operator: "Camera Operator",
  sound_engineer: "Sound Engineer",
  graphics_operator: "Graphics Operator",
};

const CUSTOM_ROLE_LABELS_KEY = "broadcastops-custom-role-labels";

export function isPresetRole(role: string): role is CrewRole {
  return (CREW_ROLES as readonly string[]).includes(role);
}

export function roleLabel(role: string) {
  return isPresetRole(role) ? ROLE_LABELS[role] : role;
}

function readCustomRoleLabels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_ROLE_LABELS_KEY) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

/** Keeps a custom role name when the database still only accepts the original enum. */
export function rememberCustomRole(id: string, label: string) {
  const labels = readCustomRoleLabels();
  labels[id] = label;
  localStorage.setItem(CUSTOM_ROLE_LABELS_KEY, JSON.stringify(labels));
}

export function forgetCustomRole(id: string) {
  const labels = readCustomRoleLabels();
  if (!labels[id]) return;
  delete labels[id];
  localStorage.setItem(CUSTOM_ROLE_LABELS_KEY, JSON.stringify(labels));
}

export function applyCustomRoleLabels<T extends { id: string; role: string }>(crew: T[]): T[] {
  const labels = readCustomRoleLabels();
  return crew.map((member) => (labels[member.id] ? { ...member, role: labels[member.id] } : member));
}

export function isCrewRoleEnumError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "22P02" || /crew_role/i.test(message) || /invalid input value for enum/i.test(message);
}

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
      dbFrom("events").select("*").order("start_at", { ascending: true }),
      dbFrom("crew_members").select("*").order("name"),
      dbFrom("equipment_kits").select("*").order("name"),
      dbFrom("event_crew").select("*").order("created_at"),
      dbFrom("event_gear").select("*").order("created_at"),
    ]);
    for (const r of [events, crew, kits, eventCrew, eventGear]) {
      if (r.error) throw r.error;
    }
    return {
      events: (events.data ?? []) as BroadcastEvent[],
      crew: applyCustomRoleLabels((crew.data ?? []) as CrewMember[]),
      kits: (kits.data ?? []) as EquipmentKit[],
      eventCrew: (eventCrew.data ?? []) as EventCrew[],
      eventGear: (eventGear.data ?? []) as EventGear[],
    };
  },
});

export const fmtDate = (iso: string) => format(new Date(iso), "EEE d MMM yyyy");
export const fmtShortDate = (iso: string) => format(new Date(iso), "EEE d MMM");
export const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
export const fmtRange = (e: Pick<BroadcastEvent, "start_at" | "end_at">) =>
  `${fmtTime(e.start_at)}–${fmtTime(e.end_at)}`;

function roleRank(role: string) {
  const index = (CREW_ROLES as readonly string[]).indexOf(role);
  return index === -1 ? CREW_ROLES.length : index;
}

/** Sort crew in call-sheet order: director first, then cameras, sound, graphics, then custom roles. */
export function sortCrewByRole(list: CrewMember[]) {
  return [...list].sort(
    (a, b) => roleRank(a.role) - roleRank(b.role) || a.name.localeCompare(b.name),
  );
}
