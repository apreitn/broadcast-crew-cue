const FLAG_KEY = "broadcastops-demo";
const DATA_KEY = "broadcastops-demo-data";

export const DEMO_EMAIL = "demo@broadcastops.local";

type DemoRow = Record<string, unknown>;

type DemoStore = {
  events: DemoRow[];
  crew_members: DemoRow[];
  equipment_kits: DemoRow[];
  event_crew: DemoRow[];
  event_gear: DemoRow[];
};

function iso(local: string) {
  return new Date(local).toISOString();
}

function createSeed(): DemoStore {
  const created = "2026-11-01T08:00:00.000Z";
  return {
    crew_members: [
      { id: "11111111-0000-4000-8000-000000000001", name: "Elena Vasquez", role: "director", phone: "+371 2000 1101", email: "elena.vasquez@broadcastops.tv", created_at: created },
      { id: "11111111-0000-4000-8000-000000000002", name: "Jonas Berg", role: "director", phone: "+371 2000 1102", email: "jonas.berg@broadcastops.tv", created_at: created },
      { id: "11111111-0000-4000-8000-000000000003", name: "Marcus Chen", role: "camera_operator", phone: "+371 2000 1103", email: "marcus.chen@broadcastops.tv", created_at: created },
      { id: "11111111-0000-4000-8000-000000000004", name: "Priya Nair", role: "camera_operator", phone: "+371 2000 1104", email: "priya.nair@broadcastops.tv", created_at: created },
      { id: "11111111-0000-4000-8000-000000000005", name: "Tomas Lindqvist", role: "sound_engineer", phone: "+371 2000 1105", email: "tomas.lindqvist@broadcastops.tv", created_at: created },
      { id: "11111111-0000-4000-8000-000000000006", name: "Aisha Okafor", role: "graphics_operator", phone: "+371 2000 1106", email: "aisha.okafor@broadcastops.tv", created_at: created },
    ],
    equipment_kits: [
      { id: "22222222-0000-4000-8000-000000000001", name: "4K Camera Rig A", category: "Camera", serial: "CAM-4K-A-0192", created_at: created },
      { id: "22222222-0000-4000-8000-000000000002", name: "4K Camera Rig B", category: "Camera", serial: "CAM-4K-B-0207", created_at: created },
      { id: "22222222-0000-4000-8000-000000000003", name: "Drone Unit", category: "Aerial", serial: "DRN-M3-0044", created_at: created },
      { id: "22222222-0000-4000-8000-000000000004", name: "Audio Mixer", category: "Audio", serial: "AUD-X32-0118", created_at: created },
      { id: "22222222-0000-4000-8000-000000000005", name: "LiveU Backpack", category: "Transmission", serial: "LU-800-0371", created_at: created },
      { id: "22222222-0000-4000-8000-000000000006", name: "Wireless Intercom Kit", category: "Comms", serial: "COM-FS-0055", created_at: created },
    ],
    events: [
      {
        id: "33333333-0000-4000-8000-000000000001",
        title: "Baltic Hockey Finals – Game 7",
        sport: "Hockey",
        venue: "Arēna Rīga, Riga",
        crew_call_at: iso("2026-11-19T10:00:00+02:00"),
        start_at: iso("2026-11-19T12:30:00+02:00"),
        end_at: iso("2026-11-19T15:30:00+02:00"),
        status: "live",
        notes: "Main feed via LiveU. Pre-game show starts 12:00 from rink-side position.",
        created_at: created,
      },
      {
        id: "33333333-0000-4000-8000-000000000002",
        title: "Premier Football Match: Riga FC vs. RFS",
        sport: "Football",
        venue: "Skonto Stadium, Riga",
        crew_call_at: iso("2026-11-22T15:00:00+02:00"),
        start_at: iso("2026-11-22T18:00:00+02:00"),
        end_at: iso("2026-11-22T21:00:00+02:00"),
        status: "scheduled",
        notes: "4-camera setup plus drone for opening aerials. Graphics package v3.",
        created_at: created,
      },
      {
        id: "33333333-0000-4000-8000-000000000003",
        title: "Basketball League: VEF Rīga vs. BC Prometey",
        sport: "Basketball",
        venue: "Xiaomi Arena, Riga",
        crew_call_at: iso("2026-11-22T17:00:00+02:00"),
        start_at: iso("2026-11-22T19:30:00+02:00"),
        end_at: iso("2026-11-22T22:30:00+02:00"),
        status: "scheduled",
        notes: "Overlaps with the football match – crew and drone need reassignment.",
        created_at: created,
      },
    ],
    event_crew: [
      ["33333333-0000-4000-8000-000000000001", "11111111-0000-4000-8000-000000000002"],
      ["33333333-0000-4000-8000-000000000001", "11111111-0000-4000-8000-000000000004"],
      ["33333333-0000-4000-8000-000000000001", "11111111-0000-4000-8000-000000000005"],
      ["33333333-0000-4000-8000-000000000001", "11111111-0000-4000-8000-000000000006"],
      ["33333333-0000-4000-8000-000000000002", "11111111-0000-4000-8000-000000000001"],
      ["33333333-0000-4000-8000-000000000002", "11111111-0000-4000-8000-000000000003"],
      ["33333333-0000-4000-8000-000000000002", "11111111-0000-4000-8000-000000000004"],
      ["33333333-0000-4000-8000-000000000002", "11111111-0000-4000-8000-000000000005"],
      ["33333333-0000-4000-8000-000000000002", "11111111-0000-4000-8000-000000000006"],
      ["33333333-0000-4000-8000-000000000003", "11111111-0000-4000-8000-000000000002"],
      ["33333333-0000-4000-8000-000000000003", "11111111-0000-4000-8000-000000000003"],
      ["33333333-0000-4000-8000-000000000003", "11111111-0000-4000-8000-000000000006"],
    ].map(([event_id, crew_member_id], i) => ({
      id: `44444444-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      event_id,
      crew_member_id,
      created_at: created,
    })),
    event_gear: [
      ["33333333-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000002", true],
      ["33333333-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000004", true],
      ["33333333-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000005", true],
      ["33333333-0000-4000-8000-000000000001", "22222222-0000-4000-8000-000000000006", true],
      ["33333333-0000-4000-8000-000000000002", "22222222-0000-4000-8000-000000000001", false],
      ["33333333-0000-4000-8000-000000000002", "22222222-0000-4000-8000-000000000003", false],
      ["33333333-0000-4000-8000-000000000002", "22222222-0000-4000-8000-000000000004", false],
      ["33333333-0000-4000-8000-000000000003", "22222222-0000-4000-8000-000000000002", false],
      ["33333333-0000-4000-8000-000000000003", "22222222-0000-4000-8000-000000000003", false],
      ["33333333-0000-4000-8000-000000000003", "22222222-0000-4000-8000-000000000005", false],
    ].map(([event_id, kit_id, packed], i) => ({
      id: `55555555-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      event_id: event_id as string,
      kit_id: kit_id as string,
      packed: packed as boolean,
      created_at: created,
    })),
  };
}

export function isDemoMode() {
  return typeof window !== "undefined" && sessionStorage.getItem(FLAG_KEY) === "1";
}

export function enterDemoMode() {
  sessionStorage.setItem(FLAG_KEY, "1");
  sessionStorage.setItem(DATA_KEY, JSON.stringify(createSeed()));
}

export function exitDemoMode() {
  sessionStorage.removeItem(FLAG_KEY);
  sessionStorage.removeItem(DATA_KEY);
}

function readStore(): DemoStore {
  const raw = sessionStorage.getItem(DATA_KEY);
  if (!raw) {
    const seed = createSeed();
    sessionStorage.setItem(DATA_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as DemoStore;
}

function writeStore(store: DemoStore) {
  sessionStorage.setItem(DATA_KEY, JSON.stringify(store));
}

type TableName = keyof DemoStore;

class DemoQuery implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private body: Record<string, unknown> | null = null;
  private filters: [string, unknown][] = [];
  private orderCol: string | null = null;
  private ascending = true;
  private one = false;

  constructor(private table: TableName) {}

  select(_columns?: string) {
    return this;
  }
  insert(body: Record<string, unknown>) {
    this.op = "insert";
    this.body = body;
    return this;
  }
  update(body: Record<string, unknown>) {
    this.op = "update";
    this.body = body;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push([col, val]);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.ascending = opts?.ascending !== false;
    return this;
  }
  single() {
    this.one = true;
    return this;
  }

  private matches(row: DemoRow) {
    return this.filters.every(([col, val]) => row[col] === val);
  }

  private run() {
    const store = readStore();
    const rows = store[this.table];
    if (this.op === "select") {
      let data = rows.filter((row) => this.matches(row)).map((row) => ({ ...row }));
      if (this.orderCol) {
        const col = this.orderCol;
        const dir = this.ascending ? 1 : -1;
        data.sort((a, b) => String(a[col] ?? "").localeCompare(String(b[col] ?? "")) * dir);
      }
      return { data, error: null };
    }
    if (this.op === "insert") {
      const created = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...defaults(this.table),
        ...this.body,
      };
      rows.push(created);
      writeStore(store);
      return { data: this.one ? created : [created], error: null };
    }
    if (this.op === "update") {
      for (const row of rows) {
        if (this.matches(row)) Object.assign(row, this.body);
      }
      writeStore(store);
      return { data: null, error: null };
    }
    store[this.table] = rows.filter((row) => !this.matches(row)) as never;
    writeStore(store);
    return { data: null, error: null };
  }

  then<TResult1 = { data: unknown; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

function defaults(table: TableName): Record<string, unknown> {
  if (table === "events") return { sport: "Football", venue: "", status: "scheduled", notes: null, crew_call_at: null };
  if (table === "equipment_kits") return { category: "General", serial: null };
  if (table === "event_gear") return { packed: false };
  if (table === "crew_members") return { phone: null, email: null };
  return {};
}

export function demoFrom(table: string) {
  return new DemoQuery(table as TableName);
}
