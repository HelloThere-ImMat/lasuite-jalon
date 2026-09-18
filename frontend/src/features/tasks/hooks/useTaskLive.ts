import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsUrl } from "../api/client";
import { taskKeys } from "../api/queryKeys";
import type { BackendTask } from "../api/types";

type LiveMessage = { type: "task.updated"; task: BackendTask };

const RECONNECT_DELAY_MS = 3000;

// Subscribes to WS /tasks/live for the duration of the app and merges the
// AI-enriched task into the cache once POST /tasks/from-text's background
// extraction finishes (API_DOCS.md). This is the only channel that carries
// that result — SSE doesn't. Proxies may drop the idle socket, so reconnect
// on close. Mount once near the app root (see AppShell.tsx).
export function useTaskLive() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      ws = new WebSocket(wsUrl("/tasks/live"));
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as LiveMessage;
        if (message.type !== "task.updated") return;
        queryClient.setQueryData<BackendTask[]>(taskKeys.tasks, (prev = []) =>
          prev.some((t) => t.id === message.task.id)
            ? prev.map((t) => (t.id === message.task.id ? message.task : t))
            : [message.task, ...prev],
        );
      };
      ws.onclose = () => {
        if (disposed) return;
        // Updates may have been missed while disconnected.
        void queryClient.invalidateQueries({ queryKey: taskKeys.tasks });
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      ws.close();
    };
  }, [queryClient]);
}
