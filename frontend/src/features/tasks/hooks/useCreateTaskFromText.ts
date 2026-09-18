import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask } from "../api/types";

// POST /tasks/from-text responds immediately with a raw-text placeholder task
// (see docs/API_CONTRACT.md), so writing the response straight into the cache
// already reads as instant/optimistic — no temp-id/rollback dance needed.
// The AI rewrite arrives later over WS /tasks/live (useTaskLive).
export function useCreateTaskFromText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      tasksApi.createFromText({
        text,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: (task) => {
      // Upsert, not a blind prepend: useTaskLive can already have inserted
      // the AI-enriched version if extraction finished first — keep the
      // newer one rather than overwriting it with the provisional task.
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.some((t) => t.id === task.id)
          ? prev.map((t) => (t.id === task.id && t.updatedAt <= task.updatedAt ? task : t))
          : [task, ...prev],
      );
    },
  });
}
