"use strict";

module.exports = {
  // Internal gateway service namespace to avoid collisions
  name: "gateway.auth.v1",
  actions: {
    register: {
      params: { 
        email: { type: "email" },
        password: { type: "string", min: 6 }
      },
      async handler(ctx) {
        return ctx.call("auth.register", { 
          email: ctx.params.email,
          password: ctx.params.password
        });
      }
    },
    login: {
      params: { 
        email: { type: "email" },
        password: { type: "string", min: 1 }
      },
      async handler(ctx) {
        return ctx.call("auth.login", { 
          email: ctx.params.email,
          password: ctx.params.password
        });
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
    },
    logout: {
      auth: "required",
      async handler(ctx) {
        // Não precisa passar email, o auth.logout usa ctx.meta.user
        return ctx.call("auth.logout");
      }
    },
    changePassword: {
      auth: "required",
      params: {
        currentPassword: { type: "string", min: 1 },
        newPassword: { type: "string", min: 6 }
      },
      async handler(ctx) {
        return ctx.call("auth.changePassword", {
          currentPassword: ctx.params.currentPassword,
          newPassword: ctx.params.newPassword
        });
      }
    },
    resetPassword: {
      params: { email: { type: "email" } },
      async handler(ctx) {
        return ctx.call("auth.resetPassword", { email: ctx.params.email });
      }
    }
  }
};
