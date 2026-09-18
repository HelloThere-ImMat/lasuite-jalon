// Vite's dev-server WS proxy (used for /api/tasks/live — see vite.config.ts)
// calls `socket.destroySoon()` once a proxied WebSocket response ends. Under
// Bun, the socket object handed to 'upgrade' listeners isn't a real
// `net.Socket` instance (patching `net.Socket.prototype` doesn't reach it),
// so that call throws `TypeError: socket.destroySoon is not a function` and
// crashes the whole `bun run dev` process the first time anyone opens a WS
// through the proxy — found live while preparing the demo (docs/DECISIONS.md).
// Patching the actual socket instance as it comes through the 'upgrade'
// event (rather than any prototype) works regardless of its real class.
import http from "node:http";

const originalEmit = http.Server.prototype.emit;
http.Server.prototype.emit = function emit(event, ...args) {
  if (event === "upgrade") {
    const socket = args[1];
    if (socket && typeof socket.destroySoon !== "function") {
      socket.destroySoon = function destroySoon() {
        if (this.writable) this.end();
        if (!this.destroyed) this.destroy();
      };
    }
  }
  return originalEmit.call(this, event, ...args);
};
