import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask, BackendTaskDetectionStatus } from "../api/types";

export type CreateTaskInput = {
  text: string;
  detectionStatus?: BackendTaskDetectionStatus;
};

// Used by the mock Tchap/Mail/Visio panels (docs/DEMO_SCENARIOS.md). The
// backend has no POST /tasks (API_DOCS.md), so origin/source* can't be set:
// the task is created through POST /tasks/from-text (the AI fills in title and
// reminder from the source text, pushed later over WS /tasks/live), then
// flagged DETECTED with a PATCH for the Mail/Visio flows.
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, detectionStatus }: CreateTaskInput) => {
      const task = await tasksApi.createFromText({
        text,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      return detectionStatus ? tasksApi.update(task.id, { detectionStatus }) : task;
    },
    onSuccess: (task) => {
      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
        prev.some((t) => t.id === task.id)
          ? prev.map((t) => (t.id === task.id && t.updatedAt <= task.updatedAt ? task : t))
          : [task, ...prev],
      );
    },
  });
}
