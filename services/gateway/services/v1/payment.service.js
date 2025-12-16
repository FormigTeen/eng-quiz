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
      // O parâmetro :id da URL é mapeado para ctx.params.id pelo Moleculer Web
      params: {
        id: { type: "string", optional: false },
        paymentId: { type: "string", optional: true }
      },
      async handler(ctx) {
        // Usar id da URL ou paymentId do body
        const paymentId = ctx.params.id || ctx.params.paymentId;
        if (!paymentId) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Payment ID não fornecido", 400, "MISSING_PAYMENT_ID");
        }
        return ctx.call("payment.getPaymentStatus", {
          paymentId: paymentId
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
    },
    confirmPayment: {
      // Sem autenticação - endpoint público para confirmar pagamentos simulados
      // O parâmetro :id da URL é mapeado para ctx.params.id pelo Moleculer Web
      // Usando validação flexível que aceita id ou paymentId
      params: {
        id: { type: "string", optional: true },
        paymentId: { type: "string", optional: true }
      },
      async handler(ctx) {
        // Acessar o request diretamente para obter parâmetros da URL
        const req = ctx.meta.$req || {};
        const routeParams = req.params || ctx.meta.$route?.params || {};
        
        // Log para debug
        this.logger.info("Confirm payment request", { 
          params: ctx.params, 
          routeParams: routeParams,
          reqParams: req.params,
          url: req.url
        });
        
        // Tentar obter o ID de diferentes lugares
        // O Moleculer Web coloca parâmetros da URL em req.params ou ctx.params
        const paymentId = routeParams.id || 
                         ctx.params.id || 
                         ctx.params.paymentId ||
                         routeParams.paymentId;
        
        if (!paymentId) {
          this.logger.error("Payment ID not found", { 
            params: ctx.params, 
            routeParams: routeParams,
            reqParams: req.params
          });
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Payment ID não fornecido", 400, "MISSING_PAYMENT_ID");
        }
        
        this.logger.info("Calling payment.confirmPayment", { paymentId });
        return ctx.call("payment.confirmPayment", {
          paymentId: paymentId
        });
      }
    }
  }
};
