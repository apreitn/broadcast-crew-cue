import { addDays, format } from "date-fns";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerMutation } from "@/hooks/use-planner";
import { broadcastTimeError } from "@/lib/broadcast-times";
import { dbFrom } from "@/lib/db";
import {
  EVENT_STATUSES,
  SPORTS,
  STATUS_LABELS,
  type BroadcastEvent,
  type BroadcastEventInsert,
  type EventStatus,
} from "@/lib/planner";

function initialState(event?: BroadcastEvent) {
  const start = event ? new Date(event.start_at) : null;
  return {
    title: event?.title ?? "",
    sport: event?.sport ?? "Football",
    venue: event?.venue ?? "",
    date: start ? format(start, "yyyy-MM-dd") : format(addDays(new Date(), 1), "yyyy-MM-dd"),
    call: event?.crew_call_at ? format(new Date(event.crew_call_at), "HH:mm") : "16:00",
    start: start ? format(start, "HH:mm") : "19:00",
    end: event ? format(new Date(event.end_at), "HH:mm") : "21:30",
    status: (event?.status ?? "scheduled") as EventStatus,
    notes: event?.notes ?? "",
  };
}

export function EventFormDialog({
  event,
  trigger,
  onSaved,
}: {
  event?: BroadcastEvent;
  trigger: ReactNode;
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => initialState(event));
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const timeError = broadcastTimeError(form);
  const timeInvalid = Boolean(timeError);
  const titleInvalid = submitted && !form.title.trim();

  const save = usePlannerMutation(
    async (payload: BroadcastEventInsert) => {
      const row = payload as Record<string, unknown>;
      if (event) return dbFrom("events").update(row).eq("id", event.id);
      const res = await dbFrom("events").insert(row).select("id").single();
      const created = res.data as { id?: string } | null;
      if (!res.error && created?.id) onSaved?.(created.id);
      return res;
    },
    { success: event ? "Event updated" : "Event created" },
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!form.title.trim() || timeError) return;
    const startAt = new Date(`${form.date}T${form.start}`);
    const endAt = new Date(`${form.date}T${form.end}`);
    const callAt = form.call ? new Date(`${form.date}T${form.call}`) : null;

    save.mutate(
      {
        title: form.title.trim(),
        sport: form.sport,
        venue: form.venue.trim(),
        crew_call_at: callAt ? callAt.toISOString() : null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: form.status,
        notes: form.notes.trim() || null,
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setForm(initialState(event));
          setSubmitted(false);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Edit broadcast" : "New broadcast"}</DialogTitle>
          <DialogDescription>Times are in your local time zone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              aria-invalid={titleInvalid || undefined}
              aria-describedby={titleInvalid ? "ev-title-error" : undefined}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Champions Cup: Riga FC vs. Valmiera"
            />
            {titleInvalid && (
              <p id="ev-title-error" role="alert" className="text-sm text-destructive">
                Give the broadcast a title.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={(v) => set("sport", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as EventStatus)}>
                <SelectTrigger>
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
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-venue">Venue</Label>
            <Input
              id="ev-venue"
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Skonto Stadium, Riga"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="ev-date">Date</Label>
              <Input
                id="ev-date"
                type="date"
                className="min-w-0 px-2 sm:px-3"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="ev-call">Crew call</Label>
              <Input
                id="ev-call"
                type="time"
                className="min-w-0 px-2 sm:px-3"
                value={form.call}
                onChange={(e) => set("call", e.target.value)}
                aria-invalid={timeInvalid || undefined}
                aria-describedby={timeInvalid ? "ev-time-error" : undefined}
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="ev-start">On air</Label>
              <Input
                id="ev-start"
                type="time"
                className="min-w-0 px-2 sm:px-3"
                value={form.start}
                onChange={(e) => set("start", e.target.value)}
                required
                aria-invalid={timeInvalid || undefined}
                aria-describedby={timeInvalid ? "ev-time-error" : undefined}
              />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="ev-end">Off air</Label>
              <Input
                id="ev-end"
                type="time"
                className="min-w-0 px-2 sm:px-3"
                value={form.end}
                onChange={(e) => set("end", e.target.value)}
                required
                aria-invalid={timeInvalid || undefined}
                aria-describedby={timeInvalid ? "ev-time-error" : undefined}
              />
            </div>
          </div>
          {timeInvalid && (
            <p id="ev-time-error" role="alert" className="text-sm font-medium text-destructive">
              {timeError}
            </p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="ev-notes">Production notes</Label>
            <Textarea
              id="ev-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Feed routing, camera positions, graphics package…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : event ? "Save changes" : "Create broadcast"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
