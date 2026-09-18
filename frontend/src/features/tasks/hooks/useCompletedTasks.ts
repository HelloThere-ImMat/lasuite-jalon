import { useTasks } from "./useTasks";
import { isCompletedTask } from "../utils/taskFilters";

export function useCompletedTasks() {
  const query = useTasks();
  return { ...query, data: query.data?.filter(isCompletedTask) };
}
