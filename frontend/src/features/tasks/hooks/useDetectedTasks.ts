import { useTasks } from "./useTasks";
import { isDetectedTask } from "../utils/taskFilters";

export function useDetectedTasks() {
  const query = useTasks();
  return { ...query, data: query.data?.filter(isDetectedTask) };
}
