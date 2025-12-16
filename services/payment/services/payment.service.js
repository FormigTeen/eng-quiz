"use strict";

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
const IORedis = require("ioredis");
const yup = require("yup");
const AbacatePay = require("abacatepay-nodejs-sdk");
const crypto = require("crypto");

module.exports = {
  name: "payment",
  mixins: [DbService],
  adapter: new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost:27017/db_payment_service"),
  collection: "payments",

  settings: {
    rest: false
  },

  methods: {
    getAbacatePayClient() {
      const apiKey = process.env.ABACATE_PAY_API_KEY;
      if (!apiKey) {
        throw new Error("ABACATE_PAY_API_KEY not configured");
      }
      return AbacatePay(apiKey);
    },

    async verifyWebhookSignature(payload, signature) {
      const secret = process.env.ABACATE_PAY_WEBHOOK_SECRET;
      if (!secret) {
        this.logger.warn("ABACATE_PAY_WEBHOOK_SECRET not configured; skipping signature verification");
        return true;
      }
      
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    },

    async checkIdempotency(key) {
      if (!this.redis) return false;
      try {
        const exists = await this.redis.get(key);
        return exists !== null;
      } catch (err) {
        this.logger.warn("Redis idempotency check failed", err?.message);
        return false;
      }
    },

    async setIdempotency(key, ttl = 86400) {
      if (!this.redis) return;
      try {
        await this.redis.set(key, "1", "EX", ttl);
      } catch (err) {
        this.logger.warn("Redis idempotency set failed", err?.message);
      }
    }
  },

  actions: {
    createPayment: {
      params: {
        userId: { type: "string" },
        packageId: { type: "number" },
        amount: { type: "number", min: 1 },
        coins: { type: "number", min: 1 }
      },
      async handler(ctx) {
        const schema = yup.object({
          userId: yup.string().email().required(),
          packageId: yup.number().integer().positive().required(),
          amount: yup.number().integer().positive().required(),
          coins: yup.number().integer().positive().required()
        });

        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Parâmetros inválidos", 400, "INVALID_PARAMS", e.errors);
        }

        const { userId, packageId, amount, coins } = ctx.params;
        const abacate = this.getAbacatePayClient();
        const webhookUrl = process.env.ABACATE_PAY_WEBHOOK_URL || "https://seu-dominio.com/api/payment/v1/webhook";

        try {
          // Criar pagamento no Abacate Pay
          const billing = await abacate.billing.create({
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
              {
                externalId: `PACKAGE_${packageId}`,
                name: `Pacote ${packageId}`,
                quantity: 1,
                price: amount // Valor em centavos
              }
            ],
            returnUrl: process.env.ABACATE_PAY_RETURN_URL || "https://seu-dominio.com/app/shop",
            completionUrl: process.env.ABACATE_PAY_COMPLETION_URL || "https://seu-dominio.com/app/shop/success",
            webhookUrl: webhookUrl,
            customer: {
              email: userId
            }
          });

          // Salvar transação no MongoDB
          const paymentData = {
            userId: userId.toLowerCase(),
            packageId,
            amount,
            coins,
            status: "pending",
            abacatePaymentId: billing.id || billing.billingId,
            qrCode: billing.qrCode || billing.pix?.qrCode || null,
            pixCode: billing.pixCode || billing.pix?.code || null,
            expiresAt: billing.expiresAt ? new Date(billing.expiresAt) : new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const payment = await this.adapter.insert(paymentData);

          this.logger.info("Payment created", { paymentId: payment._id, abacatePaymentId: billing.id });

          return {
            paymentId: payment._id.toString(),
            qrCode: paymentData.qrCode,
            pixCode: paymentData.pixCode,
            expiresAt: paymentData.expiresAt.toISOString(),
            amount,
            coins
          };
        } catch (err) {
          this.logger.error("Failed to create payment", { error: err?.message, stack: err?.stack });
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Erro ao criar pagamento", 500, "PAYMENT_CREATE_FAILED", err?.message);
        }
      }
    },

    getPaymentStatus: {
      params: {
        paymentId: { type: "string" }
      },
      async handler(ctx) {
        const schema = yup.object({
          paymentId: yup.string().required()
        });

        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Payment ID inválido", 400, "INVALID_PAYMENT_ID");
        }

        const { paymentId } = ctx.params;

        try {
          const payment = await this.adapter.findById(paymentId);
          if (!payment) {
            const { MoleculerClientError } = require("moleculer").Errors;
            throw new MoleculerClientError("Pagamento não encontrado", 404, "PAYMENT_NOT_FOUND");
          }

          // Se ainda está pending, consultar status no Abacate Pay
          if (payment.status === "pending" && payment.abacatePaymentId) {
            try {
              const abacate = this.getAbacatePayClient();
              const billing = await abacate.billing.get(payment.abacatePaymentId);

              // Atualizar status local se mudou
              if (billing.status && billing.status !== payment.status) {
                const updateData = {
                  status: billing.status === "paid" ? "paid" : payment.status,
                  updatedAt: new Date().toISOString()
                };

                if (billing.status === "paid") {
                  updateData.paidAt = new Date().toISOString();
                }

                await this.adapter.updateById(paymentId, { $set: updateData });
                payment.status = updateData.status;
                payment.paidAt = updateData.paidAt;
              }
            } catch (err) {
              this.logger.warn("Failed to fetch payment status from Abacate Pay", { error: err?.message });
              // Continua com status local
            }
          }

          return {
            paymentId: payment._id.toString(),
            status: payment.status,
            paidAt: payment.paidAt || null,
            amount: payment.amount,
            coins: payment.coins,
            createdAt: payment.createdAt
          };
        } catch (err) {
          if (err.code === "PAYMENT_NOT_FOUND") throw err;
          this.logger.error("Failed to get payment status", { error: err?.message });
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Erro ao consultar status do pagamento", 500, "PAYMENT_STATUS_FAILED");
        }
      }
    },

    processWebhook: {
      params: {
        // Webhook payload do Abacate Pay
      },
      async handler(ctx) {
        const payload = ctx.params;
        // Headers podem vir de ctx.meta.headers ou ctx.meta.$params.headers
        const headers = ctx.meta.headers || ctx.meta.$params?.headers || {};
        const signature = headers["x-abacate-signature"] || headers["x-signature"] || headers["X-Abacate-Signature"] || headers["X-Signature"];

        // Validar assinatura do webhook
        if (signature) {
          const isValid = await this.verifyWebhookSignature(payload, signature);
          if (!isValid) {
            this.logger.warn("Invalid webhook signature", { signature });
            const { MoleculerClientError } = require("moleculer").Errors;
            throw new MoleculerClientError("Assinatura inválida", 401, "INVALID_SIGNATURE");
          }
        }

        const billingId = payload.id || payload.billingId || payload.billing?.id;
        if (!billingId) {
          this.logger.warn("Webhook received without billing ID", payload);
          return { success: false, error: "Billing ID não encontrado" };
        }

        try {
          // Buscar pagamento pelo abacatePaymentId
          const payment = await this.adapter.collection.findOne({ abacatePaymentId: String(billingId) });
          if (!payment) {
            this.logger.warn("Payment not found for webhook", { billingId });
            return { success: false, error: "Pagamento não encontrado" };
          }

          // Verificar idempotência
          const idempotencyKey = `payment:webhook:${billingId}`;
          if (await this.checkIdempotency(idempotencyKey)) {
            this.logger.info("Webhook already processed", { billingId });
            return { success: true, message: "Webhook já processado" };
          }

          const status = payload.status || payload.billing?.status;
          if (!status) {
            this.logger.warn("Webhook received without status", payload);
            return { success: false, error: "Status não encontrado" };
          }

          // Mapear status do Abacate Pay para status interno
          let internalStatus = payment.status;
          if (status === "paid" || status === "completed") {
            internalStatus = "paid";
          } else if (status === "failed" || status === "cancelled") {
            internalStatus = "failed";
          } else if (status === "refunded") {
            internalStatus = "refunded";
          }

          // Atualizar pagamento
          const updateData = {
            status: internalStatus,
            webhookData: payload,
            updatedAt: new Date().toISOString()
          };

          if (internalStatus === "paid") {
            updateData.paidAt = new Date().toISOString();
          }

          await this.adapter.updateById(payment._id.toString(), { $set: updateData });

          // Marcar idempotência
          await this.setIdempotency(idempotencyKey, 86400); // 24 horas

          // Se pagamento foi confirmado, creditar moedas
          if (internalStatus === "paid" && payment.status !== "paid") {
            try {
              // Verificar idempotência para crédito
              const creditKey = `payment:credit:${payment._id.toString()}`;
              if (!(await this.checkIdempotency(creditKey))) {
                await ctx.call("auth.creditWallet", {
                  email: payment.userId,
                  coins: payment.coins,
                  transactionId: payment._id.toString()
                });
                await this.setIdempotency(creditKey, 86400); // 24 horas
                this.logger.info("Coins credited", { userId: payment.userId, coins: payment.coins });
              } else {
                this.logger.info("Coins already credited", { paymentId: payment._id.toString() });
              }
            } catch (err) {
              this.logger.error("Failed to credit wallet", { error: err?.message, paymentId: payment._id.toString() });
              // Não falha o webhook, mas loga o erro
            }

            // Emitir evento de pagamento completado
            ctx.emit("payment.completed", {
              paymentId: payment._id.toString(),
              userId: payment.userId,
              coins: payment.coins,
              amount: payment.amount
            });
          }

          this.logger.info("Webhook processed", { billingId, status: internalStatus });
          return { success: true, status: internalStatus };
        } catch (err) {
          this.logger.error("Failed to process webhook", { error: err?.message, stack: err?.stack, payload });
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Erro ao processar webhook", 500, "WEBHOOK_PROCESS_FAILED", err?.message);
        }
      }
    },

    listUserPayments: {
      params: {
        userId: { type: "string" }
      },
      async handler(ctx) {
        const schema = yup.object({
          userId: yup.string().email().required()
        });

        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("User ID inválido", 400, "INVALID_USER_ID");
        }

        const { userId } = ctx.params;

        try {
          const payments = await this.adapter.collection
            .find({ userId: userId.toLowerCase() })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

          return payments.map(p => ({
            paymentId: p._id.toString(),
            packageId: p.packageId,
            amount: p.amount,
            coins: p.coins,
            status: p.status,
            paidAt: p.paidAt || null,
            createdAt: p.createdAt
          }));
        } catch (err) {
          this.logger.error("Failed to list user payments", { error: err?.message });
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Erro ao listar pagamentos", 500, "LIST_PAYMENTS_FAILED");
        }
      }
    }
  },

  async started() {
    // Init Redis client
    try {
      const url = process.env.REDIS_URL;
      const host = process.env.REDIS_HOST;
      if (url) {
        this.redis = new IORedis(url);
      } else if (host) {
        this.redis = new IORedis({ host, port: 6379 });
      } else {
        this.redis = null;
        this.logger.warn("No REDIS_URL or REDIS_HOST set; idempotency disabled");
      }
    } catch (e) {
      this.redis = null;
      this.logger.error("Failed to initialize Redis client", e?.message || e);
    }

    // Ensure indexes
    try {
      await this.adapter.collection.createIndex({ userId: 1, createdAt: -1 });
      await this.adapter.collection.createIndex({ abacatePaymentId: 1 }, { unique: true });
      await this.adapter.collection.createIndex({ status: 1 });
    } catch (e) {
      this.logger.warn("Could not create indexes", e?.message || e);
    }

    // Validate Abacate Pay configuration
    if (!process.env.ABACATE_PAY_API_KEY) {
      this.logger.warn("ABACATE_PAY_API_KEY not configured; payment service will not work");
    }
  }
};
// AI_GENERATED_CODE_END
