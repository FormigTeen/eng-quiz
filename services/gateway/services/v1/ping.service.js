"use strict";

module.exports = {
  name: "gateway.ping.v1",
  actions: {
    trigger: {
      async handler(ctx) {
        const payload = {
          requestedAt: new Date().toISOString(),
          ip: ctx.meta.callerIp || null
        };
        ctx.broker.broadcast("ping.trigger", payload);
        return { ok: true, sent: payload };
      }
    }
  }
};
