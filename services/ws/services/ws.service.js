"use strict";

const WebSocket = require("ws");

module.exports = {
  name: "ws",
  settings: {
    port: process.env.WS_PORT ? Number(process.env.WS_PORT) : 8080,
    host: "0.0.0.0"
  },

  created() {
    this.clients = new Set();
  },
  async started() {
    const port = this.settings.port;
    const host = this.settings.host;
    this.wss = new WebSocket.Server({ port, host });
    this.logger.info(`WebSocket server listening on ws://${host}:${port}`);

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      ws.on("close", () => this.clients.delete(ws));
      ws.on("error", () => this.clients.delete(ws));

      // Optional hello
      ws.send(JSON.stringify({ type: "connected", nodeID: this.broker.nodeID, ts: new Date().toISOString() }));
    });
  },

  async stopped() {
    if (this.wss) {
      try { this.wss.close(); } catch (e) {}
      this.clients.forEach(c => { try { c.close(); } catch (e) {} });
      this.clients.clear();
    }
  },
  events: {
    async "ws.broadcast"(ctx) {
      const msg = JSON.stringify({ type: "broadcast", payload: ctx.params || {}, ts: new Date().toISOString() });
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          try { client.send(msg); } catch (e) {}
        }
      }
    }
  }
};

