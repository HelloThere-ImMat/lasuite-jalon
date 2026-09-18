import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../api/client";

// Turns mic samples into 100 ms chunks of 16 kHz PCM s16le, the format
// WS /api/transcribe (Voxtral) expects. Ported from origin/ai's
// useTranscription — see docs/DECISIONS.md, "AI task extraction...".
const WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  buffer = new Int16Array(1600)
  length = 0
  process([input]) {
    for (const sample of input[0] ?? []) {
      const s = Math.max(-1, Math.min(1, sample))
      this.buffer[this.length++] = s < 0 ? s * 0x8000 : s * 0x7fff
      if (this.length === this.buffer.length) {
        this.port.postMessage(this.buffer.slice().buffer)
        this.length = 0
      }
    }
    return true
  }
}
registerProcessor('pcm-capture', PcmCapture)
`;

type ServerMessage =
  | { type: "delta"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; message: string };

export function useDictation({
  onText,
  onError,
}: {
  onText: (transcript: string) => void;
  onError: (message: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const stopRef = useRef<() => void>(undefined);
  const mountedRef = useRef(true);

  // Without this, navigating away mid-recording (or mid-setup) leaves the
  // mic/AudioContext/WebSocket open indefinitely — a real leak now that this
  // hook lives inside a routed app, unlike origin/ai's single-page original.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRef.current?.();
    };
  }, []);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    const context = new AudioContext({ sampleRate: 16000 });
    const workletUrl = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }));
    await context.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);
    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
      return;
    }
    const capture = new AudioWorkletNode(context, "pcm-capture");
    context.createMediaStreamSource(stream).connect(capture);

    const releaseMic = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (context.state !== "closed") void context.close();
      setRecording(false);
    };

    let transcript = "";
    const ws = new WebSocket(wsUrl("/transcribe"));
    capture.port.onmessage = (e) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
    };
    ws.onmessage = (e) => {
      const message = JSON.parse(e.data as string) as ServerMessage;
      if (message.type === "delta") onText((transcript += message.text));
      else if (message.type === "done") onText(message.text);
      else onError(message.message);
    };
    // The server closes the socket once the final transcript is sent
    ws.onclose = releaseMic;

    // Stop capturing but keep the socket open to receive the last words
    stopRef.current = () => {
      releaseMic();
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "end" }));
    };
    setRecording(true);
  };

  return { recording, start, stop: () => stopRef.current?.() };
}
