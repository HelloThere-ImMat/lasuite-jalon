import { useTasks } from "./useTasks";
import { isToTreat } from "../utils/taskFilters";

export function useToTreatTasks() {
  const query = useTasks();
  return { ...query, data: query.data?.filter(isToTreat) };
}
