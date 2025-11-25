"use strict";

module.exports = {
  name: "gateway.engine.v1",
  actions: {
    quizRandom: {
      auth: "required",
      async handler(ctx) {
        return ctx.call("engine.randomQuiz", {});
      }
    },
    track: {
      auth: "required",
      params: {
        quiz_uuid: { type: "string", min: 8 },
        question_uuid: { type: "string", min: 1 },
        answer: { type: "string", min: 1 }
      },
      async handler(ctx) {
        return ctx.call("engine.validate", ctx.params);
      }
    },
    pick: {
      auth: "required",
      params: { quiz_uuid: { type: "string", min: 8 } },
      async handler(ctx) {
        return ctx.call("engine.pick", ctx.params);
      }
    }
  }
};
