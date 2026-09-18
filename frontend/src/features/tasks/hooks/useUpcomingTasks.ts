import { useTasks } from "./useTasks";
import { isUpcomingTask } from "../utils/taskFilters";

export function useUpcomingTasks() {
  const query = useTasks();
  return { ...query, data: query.data?.filter(isUpcomingTask) };
}
