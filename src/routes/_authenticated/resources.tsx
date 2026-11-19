import { Link, createFileRoute } from "@tanstack/react-router";
import { Package, Plus, Trash2, Users } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { ClearBadge, ConflictBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlanner, usePlannerMutation } from "@/hooks/use-planner";
import { dbFrom } from "@/lib/db";
import {
  CREW_ROLES,
  forgetCustomRole,
  fmtShortDate,
  fmtTime,
  isCrewRoleEnumError,
  isPresetRole,
  plannerQuery,
  rememberCustomRole,
  roleLabel,
  sortCrewByRole,
} from "@/lib/planner";

const CUSTOM_ROLE = "custom";
const ROLE_PREFIX = "role:";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Crew & Gear — BroadcastOps Planner" },
      { name: "description", content: "Crew roster and equipment kits with their broadcast bookings." },
      { property: "og:title", content: "Crew & Gear — BroadcastOps Planner" },
      { property: "og:description", content: "Crew roster and equipment kits with their broadcast bookings." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(plannerQuery),
  component: ResourcesPage,
});

function Bookings({ eventIds }: { eventIds: string[] }) {
  const planner = usePlanner();
  const booked = eventIds
    .map((id) => planner.eventsById.get(id))
    .filter((e) => e !== undefined && e.status !== "completed")
    .sort((a, b) => a!.start_at.localeCompare(b!.start_at));
  if (booked.length === 0) return <span className="text-xs text-muted-foreground">Available</span>;
  return (
    <ul className="space-y-0.5">
      {booked.map((e) => (
        <li key={e!.id} className="text-xs">
          <span className="timecode text-muted-foreground">
            {fmtShortDate(e!.start_at)} {fmtTime(e!.start_at)}
          </span>{" "}
          <Link to="/events/$eventId" params={{ eventId: e!.id }} className="hover:text-primary">
            {e!.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AddDialog({
  title,
  trigger,
  children,
  onSubmit,
  pending,
}: {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
  onSubmit: (close: () => void) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onSubmit(() => setOpen(false));
          }}
        >
          {children}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResourcesPage() {
  const planner = usePlanner();
  const [crewForm, setCrewForm] = useState({
    name: "",
    role: ROLE_PREFIX + "camera_operator",
    customRole: "",
    phone: "",
    email: "",
  });
  const [kitForm, setKitForm] = useState({ name: "", category: "", serial: "" });

  const roles = new Set([...CREW_ROLES, ...planner.crew.map((member) => member.role)]);
  const role =
    crewForm.role === CUSTOM_ROLE
      ? crewForm.customRole.trim()
      : crewForm.role.slice(ROLE_PREFIX.length);

  const addCrew = usePlannerMutation(
    async () => {
      const row = {
        name: crewForm.name.trim(),
        role,
        phone: crewForm.phone.trim() || null,
        email: crewForm.email.trim() || null,
      };
      const attempt = await dbFrom("crew_members").insert(row).select("id").single();
      if (!attempt.error || isPresetRole(role) || !isCrewRoleEnumError(attempt.error)) return attempt;
      const fallback = await dbFrom("crew_members")
        .insert({ ...row, role: "camera_operator" })
        .select("id")
        .single();
      const created = fallback.data as { id?: string } | null;
      if (!fallback.error && created?.id) rememberCustomRole(created.id, role);
      return fallback;
    },
    { success: "Crew member added" },
  );
  const addKit = usePlannerMutation(
    () =>
      dbFrom("equipment_kits").insert({
        name: kitForm.name.trim(),
        category: kitForm.category.trim() || "General",
        serial: kitForm.serial.trim() || null,
      }),
    { success: "Equipment kit added" },
  );
  const removeCrew = usePlannerMutation(
    (id: string) => {
      forgetCustomRole(id);
      return dbFrom("crew_members").delete().eq("id", id);
    },
    { success: "Crew member removed" },
  );
  const removeKit = usePlannerMutation((id: string) => dbFrom("equipment_kits").delete().eq("id", id), {
    success: "Equipment kit removed",
  });

  return (
    <AppShell>
      <PageHeader eyebrow="Resources" title="Crew & Gear" />

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Users className="size-5 text-primary" /> Crew roster
          </h2>
          <AddDialog
            title="Add crew member"
            pending={addCrew.isPending}
            onSubmit={(close) => {
              if (!crewForm.name.trim() || !role) return;
              addCrew.mutate(undefined, {
                onSuccess: () => {
                  setCrewForm({
                    name: "",
                    role: ROLE_PREFIX + "camera_operator",
                    customRole: "",
                    phone: "",
                    email: "",
                  });
                  close();
                },
              });
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Plus /> Add crew
              </Button>
            }
          >
            <div className="grid gap-1.5">
              <Label htmlFor="crew-name">Name</Label>
              <Input id="crew-name" required value={crewForm.name} onChange={(e) => setCrewForm({ ...crewForm, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="crew-role">Role</Label>
              <Select value={crewForm.role} onValueChange={(v) => setCrewForm({ ...crewForm, role: v })}>
                <SelectTrigger id="crew-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(roles, (r) => (
                    <SelectItem key={r} value={ROLE_PREFIX + r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_ROLE}>Custom role…</SelectItem>
                </SelectContent>
              </Select>
              {crewForm.role === CUSTOM_ROLE && (
                <Input
                  id="crew-custom-role"
                  aria-label="Custom role"
                  required
                  value={crewForm.customRole}
                  onChange={(e) => setCrewForm({ ...crewForm, customRole: e.target.value })}
                  placeholder="e.g. Replay Operator"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="crew-phone">Phone</Label>
                <Input id="crew-phone" value={crewForm.phone} onChange={(e) => setCrewForm({ ...crewForm, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="crew-email">Email</Label>
                <Input id="crew-email" type="email" value={crewForm.email} onChange={(e) => setCrewForm({ ...crewForm, email: e.target.value })} />
              </div>
            </div>
          </AddDialog>
        </div>
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="eyebrow">Name</TableHead>
                <TableHead className="eyebrow">Role</TableHead>
                <TableHead className="eyebrow hidden md:table-cell">Contact</TableHead>
                <TableHead className="eyebrow">Upcoming bookings</TableHead>
                <TableHead className="eyebrow">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortCrewByRole(planner.crew).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-sm">{roleLabel(c.role)}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    <div className="timecode">{c.phone}</div>
                    <div>{c.email}</div>
                  </TableCell>
                  <TableCell>
                    <Bookings eventIds={planner.eventCrew.filter((l) => l.crew_member_id === c.id).map((l) => l.event_id)} />
                  </TableCell>
                  <TableCell>
                    {planner.conflicts.crewIds.has(c.id) ? <ConflictBadge label="Double-booked" /> : <ClearBadge />}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${c.name}`} onClick={() => removeCrew.mutate(c.id)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Package className="size-5 text-primary" /> Equipment kits
          </h2>
          <AddDialog
            title="Add equipment kit"
            pending={addKit.isPending}
            onSubmit={(close) => {
              if (!kitForm.name.trim()) return;
              addKit.mutate(undefined, {
                onSuccess: () => {
                  setKitForm({ name: "", category: "", serial: "" });
                  close();
                },
              });
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Plus /> Add kit
              </Button>
            }
          >
            <div className="grid gap-1.5">
              <Label htmlFor="kit-name">Kit name</Label>
              <Input id="kit-name" required value={kitForm.name} onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })} placeholder="Steadicam Rig" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="kit-cat">Category</Label>
                <Input id="kit-cat" value={kitForm.category} onChange={(e) => setKitForm({ ...kitForm, category: e.target.value })} placeholder="Camera" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kit-serial">Serial</Label>
                <Input id="kit-serial" value={kitForm.serial} onChange={(e) => setKitForm({ ...kitForm, serial: e.target.value })} />
              </div>
            </div>
          </AddDialog>
        </div>
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="eyebrow">Kit</TableHead>
                <TableHead className="eyebrow">Category</TableHead>
                <TableHead className="eyebrow hidden md:table-cell">Serial</TableHead>
                <TableHead className="eyebrow">Upcoming bookings</TableHead>
                <TableHead className="eyebrow">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {planner.kits.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-semibold">{k.name}</TableCell>
                  <TableCell className="text-sm">{k.category}</TableCell>
                  <TableCell className="timecode hidden text-xs text-muted-foreground md:table-cell">{k.serial}</TableCell>
                  <TableCell>
                    <Bookings eventIds={planner.eventGear.filter((l) => l.kit_id === k.id).map((l) => l.event_id)} />
                  </TableCell>
                  <TableCell>
                    {planner.conflicts.kitIds.has(k.id) ? <ConflictBadge label="Double-booked" /> : <ClearBadge />}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${k.name}`} onClick={() => removeKit.mutate(k.id)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </AppShell>
  );
}
