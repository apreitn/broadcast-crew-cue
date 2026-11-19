import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

// Signed-in gate for the whole planner. Client-only because the session lives in browser storage.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
