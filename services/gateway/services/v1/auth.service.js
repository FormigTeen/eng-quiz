"use strict";

module.exports = {
  // Internal gateway service namespace to avoid collisions
  name: "gateway.auth.v1",
  actions: {
    register: {
      params: { email: { type: "email" } },
      async handler(ctx) {
        return ctx.call("auth.register", { email: ctx.params.email });
      }
    },
    login: {
      params: { email: { type: "email" } },
      async handler(ctx) {
        return ctx.call("auth.login", { email: ctx.params.email });
      }
    },
    invite: {
      auth: "required",
      params: { email: { type: "email" } },
      async handler(ctx) {
        await ctx.emit("invite", { email: ctx.params.email });
        return true;
      }
    },
    auth: {
      params: { token: { type: "string", min: 1 } },
      async handler(ctx) {
        return ctx.call("auth.auth", { token: ctx.params.token });
      }
    }
  }
};
