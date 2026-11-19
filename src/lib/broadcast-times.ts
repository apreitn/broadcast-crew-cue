/** Crew call <= on air < off air, all on the same calendar date. */
export function broadcastTimeError(times: {
  date: string;
  call: string;
  start: string;
  end: string;
}): string | null {
  const startAt = new Date(`${times.date}T${times.start}`);
  const endAt = new Date(`${times.date}T${times.end}`);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return "Enter a valid on-air and off-air time.";
  }
  const callAt = times.call ? new Date(`${times.date}T${times.call}`) : null;
  if (callAt && Number.isNaN(callAt.getTime())) return "Enter a valid crew call time.";
  if (callAt && callAt > startAt) return "Crew call must be at or before on air.";
  if (endAt <= startAt) return "Off air must be later than on air.";
  return null;
}
