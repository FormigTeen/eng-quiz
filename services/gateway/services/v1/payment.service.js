"use strict";

module.exports = {
  name: "gateway.payment.v1",
  actions: {
    createPayment: {
      auth: "required",
      params: {
        packageId: { type: "number" },
        amount: { type: "number" },
        coins: { type: "number" }
      },
      async handler(ctx) {
        const user = ctx.meta.user;
        if (!user || !user.email) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Usuário não autenticado", 401, "UNAUTHORIZED");
        }
        return ctx.call("payment.createPayment", {
          userId: user.email,
          packageId: ctx.params.packageId,
          amount: ctx.params.amount,
          coins: ctx.params.coins
        });
      }
    },
    getPaymentStatus: {
      auth: "required",
      params: { paymentId: { type: "string" } },
      async handler(ctx) {
        return ctx.call("payment.getPaymentStatus", {
          paymentId: ctx.params.paymentId
        });
      }
    },
    listPayments: {
      auth: "required",
      async handler(ctx) {
        const user = ctx.meta.user;
        if (!user || !user.email) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Usuário não autenticado", 401, "UNAUTHORIZED");
        }
        return ctx.call("payment.listUserPayments", {
          userId: user.email
        });
      }
    },
    webhook: {
      // Sem autenticação - endpoint público para receber webhooks do Abacate Pay
      params: {},
      async handler(ctx) {
        // Passar todo o body e headers para o serviço de pagamento
        const payload = ctx.params;
        // Headers podem estar em req.webhookHeaders (do middleware) ou ctx.meta.$req.headers
        const req = ctx.meta.$req || {};
        const headers = req.webhookHeaders || req.headers || ctx.meta.headers || {};
        return ctx.call("payment.processWebhook", payload, {
          meta: {
            headers: headers
          }
        });
      }
    }
  }
};
