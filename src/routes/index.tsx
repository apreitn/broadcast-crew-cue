import { createFileRoute, redirect } from "@tanstack/react-router";

// The planner is a signed-in workspace: send visitors to the events dashboard,
// whose gate forwards anyone signed out to /auth.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BroadcastOps Planner — Live Sports Production Scheduling" },
      { name: "description", content: "Plan live sports broadcasts, assign crew and gear, and catch double-bookings." },
      { property: "og:title", content: "BroadcastOps Planner — Live Sports Production Scheduling" },
      { property: "og:description", content: "Plan live sports broadcasts, assign crew and gear, and catch double-bookings." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/events" });
  },
});
