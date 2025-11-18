"use strict";

module.exports = {
  name: "pingFlow",

  events: {
    async "ping.trigger"(ctx) {
      const data = ctx.params || {};
      const enriched = {
        ...data,
        receivedAt: new Date().toISOString(),
        pingNode: ctx.broker.nodeID
      };
      ctx.broadcast("pong.trigger", enriched);
    }
  }
};

