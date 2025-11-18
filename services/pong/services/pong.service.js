"use strict";

/**
 * Pong service: receives from ping, forwards to WS broadcast
 */
module.exports = {
  name: "pongFlow",

  events: {
    async "pong.trigger"(ctx) {
      const data = ctx.params || {};
      const finalMsg = {
        ...data,
        processedAt: new Date().toISOString(),
        pongNode: ctx.broker.nodeID
      };
      ctx.broadcast("ws.broadcast", finalMsg);
    }
  }
};

