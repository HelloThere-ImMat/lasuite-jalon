import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import { backendTaskToTask } from "../utils/adapters";

// The cache stays backend-shaped (BackendTask[]) so mutations/WS pushes can
// patch it directly with real API responses; `select` maps to the domain
// Task type for consumers, per the adapter boundary (docs/ARCHITECTURE.md).
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.tasks,
    queryFn: tasksApi.list,
    select: (tasks) => tasks.map(backendTaskToTask),
  });
}
