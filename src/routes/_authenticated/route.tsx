import type { User } from "@supabase/supabase-js";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL, isDemoMode } from "@/lib/demo";

// Signed-in gate for the whole planner. Client-only because the session lives in browser storage.
// Demo mode skips the account check so visitors can open the schedule without signing up.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (isDemoMode()) {
      return {
        user: {
          id: "demo-user",
          email: DEMO_EMAIL,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date(0).toISOString(),
        } as User,
      };
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) return { user: data.user };
    } catch {
      // The auth page still offers Demo Mode when the auth client is unavailable.
    }
    throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: () => <Outlet />,
});
