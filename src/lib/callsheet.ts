import { format } from "date-fns";

import type { EventConflicts } from "./conflicts";
import {
  roleLabel,
  STATUS_LABELS,
  fmtDate,
  fmtTime,
  sortCrewByRole,
  type BroadcastEvent,
  type CrewMember,
  type EquipmentKit,
  type EventGear,
} from "./planner";

function cell(value: string | null | undefined) {
  const v = value ?? "";
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const row = (...values: (string | null | undefined)[]) => values.map(cell).join(",");

export function buildCallSheetCsv(params: {
  event: BroadcastEvent;
  crew: CrewMember[];
  gear: { kit: EquipmentKit; link: EventGear }[];
  conflicts: EventConflicts;
  eventTitle: (id: string) => string;
}) {
  const { event, crew, gear, conflicts, eventTitle } = params;
  const clash = (ids: string[] | undefined) =>
    ids && ids.length ? `DOUBLE-BOOKED: ${ids.map(eventTitle).join("; ")}` : "OK";

  const lines = [
    row("BroadcastOps Planner — Call Sheet"),
    row("Event", event.title),
    row("Sport", event.sport),
    row("Venue", event.venue),
    row("Date", fmtDate(event.start_at)),
    row("Status", STATUS_LABELS[event.status]),
    "",
    row("SCHEDULE"),
    row("Item", "Time"),
    ...(event.crew_call_at ? [row("Crew call", fmtTime(event.crew_call_at))] : []),
    row("On air", fmtTime(event.start_at)),
    row("Off air", fmtTime(event.end_at)),
    "",
    row("CREW"),
    row("Name", "Role", "Phone", "Email", "Booking"),
    ...sortCrewByRole(crew).map((c) =>
      row(c.name, roleLabel(c.role), c.phone, c.email, clash(conflicts.crew[c.id])),
    ),
    "",
    row("GEAR CHECKLIST"),
    row("Kit", "Category", "Serial", "Packed", "Booking"),
    ...gear.map(({ kit, link }) =>
      row(kit.name, kit.category, kit.serial, link.packed ? "Yes" : "No", clash(conflicts.gear[kit.id])),
    ),
  ];
  if (event.notes) lines.push("", row("NOTES"), row(event.notes));
  return lines.join("\r\n");
}

export function callSheetFilename(event: BroadcastEvent) {
  const slug = event.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `callsheet-${format(new Date(event.start_at), "yyyy-MM-dd")}-${slug}.csv`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadCsv(csv: string, filename: string) {
  // BOM so Excel opens UTF-8 (venue names with diacritics) correctly
  downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), filename);
}
