import { EventEmitter } from "node:events";
import type { Task } from "../generated/prisma/client";

// In-process pub/sub for task mutations, consumed by the SSE stream in
// index.ts. No cross-instance fanout (fine for a single backend process).
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type TaskEvent =
  | { type: "created"; task: Task }
  | { type: "updated"; task: Task }
  | { type: "deleted"; id: string };

export function emitTaskEvent(event: TaskEvent) {
  emitter.emit("task", event);
}

export function onTaskEvent(listener: (event: TaskEvent) => void) {
  emitter.on("task", listener);
  return () => emitter.off("task", listener);
}
