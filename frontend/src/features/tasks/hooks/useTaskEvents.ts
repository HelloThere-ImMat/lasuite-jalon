import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToastProvider, VariantType } from "@gouvfr-lasuite/cunningham-react";
import { API_BASE } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask } from "../api/types";

type TaskSseEvent =
  | { type: "created" | "updated"; task: BackendTask }
  | { type: "deleted"; id: string };

// SSE (GET /tasks/events) — deliberately separate from useTaskLive's WS
// channel (API_DOCS.md, "Live updates"): this one carries PATCH/DELETE
// mutations from every tab ("created" is reserved but not emitted yet), while
// the AI quick-add result only arrives over WS. Mount once near the app root (see AppShell.tsx). No auth, so
// EventSource's inability to set custom headers isn't a constraint here.
export function useTaskEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToastProvider();
  const detectedCountRef = useRef(0);

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/tasks/events`);
    let opened = false;

    // No replay: EventSource reconnects on its own, but anything that
    // happened while disconnected is lost, so refetch on every reconnect.
    source.onopen = () => {
      if (opened) void queryClient.invalidateQueries({ queryKey: taskKeys.tasks });
      opened = true;
    };

    source.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as TaskSseEvent;

      queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) => {
        if (data.type === "deleted") {
          return prev.filter((t) => t.id !== data.id);
        }
        if (data.type === "updated") {
          return prev.map((t) => (t.id === data.task.id ? data.task : t));
        }
        // "created" — this same tab's own optimistic creates already put the
        // task in the cache, so upsert instead of blindly prepending to
        // avoid a duplicate when this tab's own POST echoes back over SSE.
        return prev.some((t) => t.id === data.task.id)
          ? prev.map((t) => (t.id === data.task.id ? data.task : t))
          : [data.task, ...prev];
      });

      if (data.type === "created" && data.task.detectionStatus === "DETECTED") {
        detectedCountRef.current += 1;
        const count = detectedCountRef.current;
        toast(
          count === 1
            ? "1 nouvelle action détectée depuis votre arrivée"
            : `${count} nouvelles actions détectées depuis votre arrivée`,
          VariantType.INFO,
        );
      }
    };

    return () => source.close();
  }, [queryClient, toast]);
}
