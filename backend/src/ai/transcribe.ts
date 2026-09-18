import { Elysia } from "elysia";
import {
  AudioEncoding,
  RealtimeConnection,
  RealtimeTranscription,
} from "@mistralai/mistralai/extra/realtime";

const MODEL = "voxtral-mini-transcribe-realtime-2602";

const realtime = new RealtimeTranscription({
  apiKey: process.env.MISTRAL_API_KEY,
});

// One Voxtral session per browser socket. Audio arriving while the session is
// still connecting waits on the promise, so the first words aren't lost.
const sessions = new Map<string, Promise<RealtimeConnection>>();

// The browser sends binary PCM s16le 16 kHz mono chunks, then {"type":"end"}.
// It receives {type:"delta", text}, then {type:"done", text} or {type:"error", message}.
export const transcription = new Elysia().ws("/transcribe", {
  open(ws) {
    const session = realtime.connect(MODEL, {
      audioFormat: { encoding: AudioEncoding.PcmS16le, sampleRate: 16000 },
    });
    sessions.set(ws.id, session);

    session
      .then(async (connection) => {
        let transcript = "";
        for await (const event of connection) {
          if ("raw" in event) continue;
          if (event.type === "transcription.text.delta") {
            transcript += event.text;
            ws.send({ type: "delta", text: event.text });
          } else if (event.type === "transcription.done") {
            ws.send({ type: "done", text: transcript });
            break;
          } else if (event.type === "error") {
            const { message } = event.error;
            ws.send({
              type: "error",
              message: typeof message === "string" ? message : JSON.stringify(message),
            });
            break;
          }
        }
      })
      .catch((error) => ws.send({ type: "error", message: String(error) }))
      .finally(() => ws.close());
  },

  async message(ws, message) {
    const connection = await sessions.get(ws.id)?.catch(() => undefined);
    if (!connection || connection.isClosed) return;

    if (message instanceof Uint8Array) {
      await connection.sendAudio(message);
    } else {
      // {"type":"end"}: Voxtral finishes the transcript, then sends transcription.done
      await connection.flushAudio();
      await connection.endAudio();
    }
  },

  close(ws) {
    sessions
      .get(ws.id)
      ?.then((connection) => connection.close())
      .catch(() => {});
    sessions.delete(ws.id);
  },
});
