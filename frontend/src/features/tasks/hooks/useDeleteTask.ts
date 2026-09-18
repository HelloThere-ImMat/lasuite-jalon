import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask } from "../api/types";

// True optimistic delete + rollback on error — see useUpdateTask.ts.
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.tasks });
      const previous = queryClient.getQueryData<BackendTask[]>(taskKeys.tasks);
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.tasks, context.previous);
      }
    },
    onSuccess: (_deleted, id) => {
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.filter((t) => t.id !== id),
      );
    },
  });
}
