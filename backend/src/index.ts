import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { Prisma } from "../generated/prisma/client";
import { extractTask } from "./ai/extractTask";
import { transcription } from "./ai/transcribe";
import { prisma } from "./db";
import { emitTaskEvent, onTaskEvent } from "./events";

const taskOrigin = t.Union([
  t.Literal("APP"),
  t.Literal("TCHAP"),  t.Literal("DOCS"),
  t.Literal("MAIL"),
  t.Literal("VISIO"),
]);

const taskDetectionStatus = t.Union([
  t.Literal("DETECTED"),
  t.Literal("CONFIRMED"),
  t.Literal("IGNORED"),
]);

const app = new Elysia({ prefix: "/api" })
  // Lets other La Suite frontends (e.g. Docs) call the API from the browser
  .use(
    cors({
      origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      credentials: false,
    }),
  )
  .onError(({ error, set }) => {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      set.status = 404;
      return { error: "Not found" };
    }
  })
  .get("/health", () => ({ status: "ok" }))
  .use(transcription)
  // Pushes { type: "task.updated", task } when the AI has filled a task in
  .ws("/tasks/live", {
    open(ws) {
      ws.subscribe("tasks");
    },
  })
  .get("/tasks", () => prisma.task.findMany({ orderBy: { createdAt: "desc" } }))
  .get("/tasks/events", () => {
    const encoder = new TextEncoder();
    let unsubscribe = () => {};
    let heartbeat: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
      start(controller) {
        unsubscribe = onTaskEvent((event) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        });
        controller.enqueue(encoder.encode(": connected\n\n"));
        // Keeps proxies/load balancers from closing the idle connection.
        heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 30_000);
      },
      cancel() {
        unsubscribe();
        clearInterval(heartbeat);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  })
  .post(
    "/tasks/from-text",
    async ({ body, server }) => {
      // Save the raw text right away; the AI rewrites the task in the background
      const task = await prisma.task.create({
        data: { title: body.text.slice(0, 80), content: body.text },
      });
      extractTask(body.text, body.timeZone)
        .then((draft) =>
          prisma.task.update({ where: { id: task.id }, data: draft }),
        )
        .then((updated) =>
          server?.publish(
            "tasks",
            JSON.stringify({ type: "task.updated", task: updated }),
          ),
        )
        .catch((error) =>
          console.error(`Task extraction failed for ${task.id}:`, error),
        );
      return task;
    },
    {
      body: t.Object({
        text: t.String({ minLength: 1 }),
        timeZone: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    "/tasks/:id",
    async ({ params, body }) => {
      const task = await prisma.task.update({ where: { id: params.id }, data: body });
      emitTaskEvent({ type: "updated", task });
      return task;
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        content: t.Optional(t.Nullable(t.String())),
        reminder: t.Optional(t.Nullable(t.Date())),
        done: t.Optional(t.Boolean()),
        validated: t.Optional(t.Boolean()),
        detectionStatus: t.Optional(t.Nullable(taskDetectionStatus)),
      }),
    },
  )
  .delete("/tasks/:id", async ({ params }) => {
    const task = await prisma.task.delete({ where: { id: params.id } });
    emitTaskEvent({ type: "deleted", id: task.id });
    return task;
  })
  .listen(process.env.PORT ?? 3001);

console.log(`🦊 Elysia is running at ${app.server?.url}`);
