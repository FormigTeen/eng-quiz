"use strict";

module.exports = {
  // Internal gateway service namespace to avoid collisions
  name: "gateway.auth.v1",
  actions: {
    register: {
      params: { email: { type: "email" }, password: { type: "string", min: 6 } },
      async handler(ctx) {
        return ctx.call("auth.register", { email: ctx.params.email, password: ctx.params.password });
      }
    },
    login: {
      params: { email: { type: "email" }, password: { type: "string", min: 1 } },
      async handler(ctx) {
        return ctx.call("auth.login", { email: ctx.params.email, password: ctx.params.password });
      }
    },
    logout: {
      params: { token: { type: "string", min: 1 } },
      async handler(ctx) {
        return ctx.call("auth.logout", { token: ctx.params.token });
      }
    },
    invite: {
      auth: "required",
      params: { email: { type: "email" } },
      async handler(ctx) {
        // Forward to auth service which handles rate-limit/cache and sending
        return ctx.call("auth.invite", { email: ctx.params.email });
      }
    },
    auth: {
      params: { token: { type: "string", min: 1 } },
      async handler(ctx) {
        return ctx.call("auth.auth", { token: ctx.params.token });
      }
    },
    changePassword: {
      auth: "required",
      params: {
        token: { type: "string", min: 1 },
        oldPassword: { type: "string", min: 1 },
        newPassword: { type: "string", min: 6 }
      },
      async handler(ctx) {
        return ctx.call("auth.changePassword", {
          token: ctx.params.token,
          oldPassword: ctx.params.oldPassword,
          newPassword: ctx.params.newPassword
        });
      }
    },

    forgotPassword: {
      params: { email: { type: "email" } },
      async handler(ctx) {
        return ctx.call("auth.forgotPassword", { email: ctx.params.email });
      }
    }
  }
};
