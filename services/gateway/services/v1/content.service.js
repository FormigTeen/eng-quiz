"use strict";

const { Errors } = require("moleculer");

module.exports = {
  name: "gateway.content.v1",

  hooks: {
    before: {
      "*": ["authorizeAdmin"]
    }
  },

  actions: {
    createQuiz: {
      async handler(ctx) {
        return ctx.call("content.createQuiz", ctx.params);
      }
    },
    createTeam: {
      async handler(ctx) {
        return ctx.call("content.createTeam", ctx.params);
      }
    },
    createQuestion: {
      async handler(ctx) {
        return ctx.call("content.createQuestion", ctx.params);
      }
    },
    toggleQuizQuestion: {
      async handler(ctx) {
        return ctx.call("content.toggleQuizQuestion", ctx.params);
      }
    },
    getQuizzes: {
      async handler(ctx) {
        return ctx.call("content.getQuizzes", ctx.params);
      }
    },
    getQuiz: {
      async handler(ctx) {
        return ctx.call("content.getQuiz", ctx.params);
      }
    }
  },

  methods: {
    authorizeAdmin(ctx) {
      const user = ctx.meta && ctx.meta.user;
      if (!user || user.role !== "admin") {
        throw new Errors.MoleculerClientError("Forbidden", 403, "FORBIDDEN");
      }
    }
  }
};

