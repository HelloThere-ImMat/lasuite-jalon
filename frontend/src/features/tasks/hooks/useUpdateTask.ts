import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask } from "../api/types";
import { taskPatchToBackendPatch } from "../utils/adapters";
import type { TaskPatch } from "../types/task";

// Covers complete/uncomplete, edit (title/description/dueAt), and Keep/Ignore
// (detectionStatus) — all go through PATCH /api/tasks/:id with a domain-shaped
// patch converted at the boundary (docs/ARCHITECTURE.md). True optimistic
// update (onMutate) + rollback (onError) — the checkbox/Keep/Ignore actions
// this backs are frequent, low-risk, and should never wait on a round-trip
// to visibly react (docs/DECISIONS.md, "Milestone 5").
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskPatch }) =>
      tasksApi.update(id, taskPatchToBackendPatch(patch)),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks });
      const previous = queryClient.getQueryData<BackendTask[]>(taskKeys.tasks);
      const backendPatch = taskPatchToBackendPatch(patch);
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.map((t) => (t.id === id ? { ...t, ...backendPatch } : t)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.tasks, context.previous);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.map((t) => (t.id === task.id ? task : t)),
      );
    },
  });
}
