CREATE TYPE public.event_status AS ENUM ('scheduled', 'live', 'completed');
CREATE TYPE public.crew_role AS ENUM ('director', 'camera_operator', 'sound_engineer', 'graphics_operator');

CREATE TABLE public.crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role public.crew_role NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crew_members TO authenticated;
GRANT ALL ON public.crew_members TO service_role;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read crew" ON public.crew_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add crew" ON public.crew_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update crew" ON public.crew_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete crew" ON public.crew_members FOR DELETE TO authenticated USING (true);

CREATE TABLE public.equipment_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  serial text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_kits TO authenticated;
GRANT ALL ON public.equipment_kits TO service_role;
ALTER TABLE public.equipment_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read gear" ON public.equipment_kits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add gear" ON public.equipment_kits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update gear" ON public.equipment_kits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete gear" ON public.equipment_kits FOR DELETE TO authenticated USING (true);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  sport text NOT NULL DEFAULT 'Football',
  venue text NOT NULL DEFAULT '',
  crew_call_at timestamptz,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status public.event_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start CHECK (end_at > start_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update events" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete events" ON public.events FOR DELETE TO authenticated USING (true);

CREATE TABLE public.event_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  crew_member_id uuid NOT NULL REFERENCES public.crew_members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, crew_member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_crew TO authenticated;
GRANT ALL ON public.event_crew TO service_role;
ALTER TABLE public.event_crew ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read crew assignments" ON public.event_crew FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add crew assignments" ON public.event_crew FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update crew assignments" ON public.event_crew FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete crew assignments" ON public.event_crew FOR DELETE TO authenticated USING (true);

CREATE TABLE public.event_gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  kit_id uuid NOT NULL REFERENCES public.equipment_kits(id) ON DELETE CASCADE,
  packed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, kit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_gear TO authenticated;
GRANT ALL ON public.event_gear TO service_role;
ALTER TABLE public.event_gear ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read gear assignments" ON public.event_gear FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add gear assignments" ON public.event_gear FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update gear assignments" ON public.event_gear FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete gear assignments" ON public.event_gear FOR DELETE TO authenticated USING (true);

CREATE INDEX event_crew_crew_idx ON public.event_crew(crew_member_id);
CREATE INDEX event_gear_kit_idx ON public.event_gear(kit_id);
CREATE INDEX events_start_idx ON public.events(start_at);

-- Seed: crew
INSERT INTO public.crew_members (id, name, role, phone, email) VALUES
 ('11111111-0000-4000-8000-000000000001', 'Elena Vasquez', 'director', '+371 2000 1101', 'elena.vasquez@broadcastops.tv'),
 ('11111111-0000-4000-8000-000000000002', 'Jonas Berg', 'director', '+371 2000 1102', 'jonas.berg@broadcastops.tv'),
 ('11111111-0000-4000-8000-000000000003', 'Marcus Chen', 'camera_operator', '+371 2000 1103', 'marcus.chen@broadcastops.tv'),
 ('11111111-0000-4000-8000-000000000004', 'Priya Nair', 'camera_operator', '+371 2000 1104', 'priya.nair@broadcastops.tv'),
 ('11111111-0000-4000-8000-000000000005', 'Tomas Lindqvist', 'sound_engineer', '+371 2000 1105', 'tomas.lindqvist@broadcastops.tv'),
 ('11111111-0000-4000-8000-000000000006', 'Aisha Okafor', 'graphics_operator', '+371 2000 1106', 'aisha.okafor@broadcastops.tv');

-- Seed: gear
INSERT INTO public.equipment_kits (id, name, category, serial) VALUES
 ('22222222-0000-4000-8000-000000000001', '4K Camera Rig A', 'Camera', 'CAM-4K-A-0192'),
 ('22222222-0000-4000-8000-000000000002', '4K Camera Rig B', 'Camera', 'CAM-4K-B-0207'),
 ('22222222-0000-4000-8000-000000000003', 'Drone Unit', 'Aerial', 'DRN-M3-0044'),
 ('22222222-0000-4000-8000-000000000004', 'Audio Mixer', 'Audio', 'AUD-X32-0118'),
 ('22222222-0000-4000-8000-000000000005', 'LiveU Backpack', 'Transmission', 'LU-800-0371'),
 ('22222222-0000-4000-8000-000000000006', 'Wireless Intercom Kit', 'Comms', 'COM-FS-0055');

-- Seed: events (times in Riga, UTC+2)
INSERT INTO public.events (id, title, sport, venue, crew_call_at, start_at, end_at, status, notes) VALUES
 ('33333333-0000-4000-8000-000000000001', 'Baltic Hockey Finals – Game 7', 'Hockey', 'Arēna Rīga, Riga',
  '2026-11-19 10:00+02', '2026-11-19 12:30+02', '2026-11-19 15:30+02', 'live',
  'Main feed via LiveU. Pre-game show starts 12:00 from rink-side position.'),
 ('33333333-0000-4000-8000-000000000002', 'Premier Football Match: Riga FC vs. RFS', 'Football', 'Skonto Stadium, Riga',
  '2026-11-22 15:00+02', '2026-11-22 18:00+02', '2026-11-22 21:00+02', 'scheduled',
  '4-camera setup plus drone for opening aerials. Graphics package v3.'),
 ('33333333-0000-4000-8000-000000000003', 'Basketball League: VEF Rīga vs. BC Prometey', 'Basketball', 'Xiaomi Arena, Riga',
  '2026-11-22 17:00+02', '2026-11-22 19:30+02', '2026-11-22 22:30+02', 'scheduled',
  'Overlaps with the football match – crew and drone need reassignment.');

INSERT INTO public.event_crew (event_id, crew_member_id) VALUES
 ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000002'),
 ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000004'),
 ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000005'),
 ('33333333-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000006'),
 ('33333333-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001'),
 ('33333333-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000003'),
 ('33333333-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000004'),
 ('33333333-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000005'),
 ('33333333-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000006'),
 ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002'),
 ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000003'),
 ('33333333-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000006');

INSERT INTO public.event_gear (event_id, kit_id, packed) VALUES
 ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000002', true),
 ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000004', true),
 ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000005', true),
 ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000006', true),
 ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', false),
 ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000003', false),
 ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000004', false),
 ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000002', false),
 ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', false),
 ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000005', false);