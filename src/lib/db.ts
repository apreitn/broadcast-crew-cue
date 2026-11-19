import { supabase } from "@/integrations/supabase/client";
import { demoFrom, isDemoMode } from "@/lib/demo";

/** Planner reads and writes. Demo mode uses the in-browser seed instead of Supabase. */
export function dbFrom(table: string) {
  if (isDemoMode()) return demoFrom(table);
  return supabase.from(table as never) as unknown as ReturnType<typeof demoFrom>;
}
