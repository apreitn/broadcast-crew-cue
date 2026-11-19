import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { enterDemoMode, exitDemoMode } from "@/lib/demo";
import { plannerQuery } from "@/lib/planner";
import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it("loads demo events without a Supabase session", async () => {
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/auth"] }),
      context: { queryClient },
    });

    enterDemoMode();
    try {
      await router.navigate({ to: "/events" });

      expect(router.state.location.pathname).toMatch(/^\/events\/?$/);
      expect(queryClient.getQueryData(plannerQuery.queryKey)?.events.length).toBeGreaterThan(0);
    } finally {
      exitDemoMode();
      queryClient.clear();
    }
  });
});
