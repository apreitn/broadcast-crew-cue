import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import { buildConflictIndex } from "@/lib/conflicts";
import { plannerQuery, plannerQueryKey } from "@/lib/planner";

export function usePlanner() {
  const { data } = useSuspenseQuery(plannerQuery);
  return useMemo(() => {
    const conflicts = buildConflictIndex(data.events, data.eventCrew, data.eventGear);
    const eventsById = new Map(data.events.map((e) => [e.id, e]));
    const crewById = new Map(data.crew.map((c) => [c.id, c]));
    const kitsById = new Map(data.kits.map((k) => [k.id, k]));
    return { ...data, conflicts, eventsById, crewById, kitsById };
  }, [data]);
}

/** Wraps a backend write: refreshes planner data on success, toasts on failure. */
export function usePlannerMutation<TVars>(
  fn: (vars: TVars) => PromiseLike<{ error: { message: string } | null }>,
  opts?: { success?: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: TVars) => {
      const { error } = await fn(vars);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (opts?.success) toast.success(opts.success);
      return queryClient.invalidateQueries({ queryKey: plannerQueryKey });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
