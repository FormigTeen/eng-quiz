"use strict";

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
const jwt = require("jsonwebtoken");
const IORedis = require("ioredis");
const yup = require("yup");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dayjs = require("dayjs");
const { defaultsDeep } = require("lodash");

module.exports = {
  name: "auth",
  mixins: [DbService],
  adapter: new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost:27017/db_auth_service"),
  collection: "users",

  settings: {
    jwtSecret: process.env.JWT_SECRET,
    // disable rest actions from db mixin
    rest: false
  },

  methods: {
    getPasswordSeed() {
      const seed = process.env.PASSWORD_SEED || process.env.AUTH_PASSWORD_SEED;
      if (!seed) {
        throw new Error("PASSWORD_SEED not configured in environment");
      }
      return seed;
    },
    hashPassword(password) {
      const seed = this.getPasswordSeed();
      // Using HMAC-SHA256 with a global seed (pepper)
      return crypto.createHmac("sha256", seed).update(String(password)).digest("hex");
    },
    async sendInviteEmail(toEmail) {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_LOGIN;
      const pass = process.env.SMTP_KEY;
      const from = process.env.SMTP_FROM || user;

      if (!host || !user || !pass) {
        throw new Error("SMTP env not fully configured");
      }

      const transporter = nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } });
      await transporter.sendMail({ from, to: toEmail, subject: "Convite de Teste ENG QUIZ", text: "Convite de Teste ENG QUIZ" });
    }
  },

  actions: {
    // invite: sends email to :email if not already invited by the current user within 1 day
    invite: {
      auth: "required",
      async handler(ctx) {
        const schema = yup.object({ email: yup.string().email().required() });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const toEmail = String(ctx.params.email).trim().toLowerCase();
        const fromEmail = String(ctx.meta?.user?.email || "").trim().toLowerCase();
        if (!fromEmail) {
          // Not authenticated in context
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Unauthorized", 401, "UNAUTHORIZED");
        }
        if (!this.redis) {
          this.logger.warn("Redis client not initialized; cannot prevent duplicate invites");
        }
        const key = `${fromEmail}:${toEmail}`;
        try {
          if (this.redis) {
            const exists = await this.redis.get(key);
            if (exists) {
              const { MoleculerClientError } = require("moleculer").Errors;
              throw new MoleculerClientError("O convite para esse Email já foi enviado", 409, "ALREADY_INVITED");
            }
          }

          // Send email
          await this.sendInviteEmail(toEmail);

          // Set lock for 1 day
          if (this.redis) {
            await this.redis.set(key, "1", "EX", 24 * 60 * 60);
          }
          return true;
        } catch (err) {
          // Re-throw MoleculerClientErrors as-is; otherwise map to 500
          if (err && err.code && typeof err.code === "number") throw err;
          this.logger.error("Invite failed", err?.message || err);
          const { MoleculerClientError } = require("moleculer").Errors;
          throw new MoleculerClientError("Failed to send invite", 500, "INVITE_FAILED");
        }
      }
    },
    // logout receives a JWT token and blacklists it for 7 days
    logout: {
      async handler(ctx) {
        const schema = yup.object({ token: yup.string().min(1).required() });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const token = ctx.params.token;
        if (!this.redis) {
          // If Redis is not available, report failure to ensure logout effect is enforced only with Redis
          this.logger.warn("Redis client not initialized; cannot blacklist token");
          return false;
        }
        const key = `blacklist:${token}`;
        const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
        try {
          await this.redis.set(key, "1", "EX", ttlSeconds);
          return true;
        } catch (err) {
          this.logger.error("Failed to set blacklist token in Redis", err?.message || err);
          return false;
        }
      }
    },
    // register receives email & password; stores password hash
    register: {
      async handler(ctx) {
        const schema = yup.object({
          email: yup.string().email().required(),
          password: yup.string().min(6).required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const email = String(ctx.params.email).trim().toLowerCase();
        const password = String(ctx.params.password);
        const col = this.adapter.collection;
        const existing = await col.findOne({ email });
        if (existing) {
          return false;
        }
        const passwordHash = this.hashPassword(password);
        await col.insertOne({
          email,
          role: "basic",
          level: 1,
          xp: 0,
          sequence: { updated_at: null, count: 0 },
          score: { positive: 0, negative: 0 },
          wallet: { count: 0, credits: 0 },
          badges: [
            { iconUrl: null, title: 'Jogador Titular', description: 'Cadastro e Entrar no Jogo' }
          ],
          passwordHash,
          createdAt: new Date().toISOString()
        });
        return true;
      }
    },

    // login receives email & password and returns JWT for 30 days
    login: {
      async handler(ctx) {
        const schema = yup.object({
          email: yup.string().email().required(),
          password: yup.string().min(1).required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const email = String(ctx.params.email).trim().toLowerCase();
        const password = String(ctx.params.password);
        const col = this.adapter.collection;
        const user = await col.findOne({ email });
        if (!user) {
          // require user to be registered
          return false;
        }
        // verify password
        const passwordHash = this.hashPassword(password);
        if (!user.passwordHash || user.passwordHash !== passwordHash) {
          return false;
        }

        const secret = this.settings.jwtSecret || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error("JWT secret not configured");
        }

        // Update login sequence based solely on sequence.updated_at
        const now = dayjs();
        const nowISO = now.toISOString();
        const seq = (user && user.sequence) || {};
        const seqUpdatedAt = seq.updated_at ? dayjs(seq.updated_at) : null;
        const setUpdate = {};
        const incUpdate = {};

        if (!seqUpdatedAt) {
          setUpdate["sequence.updated_at"] = nowISO;
          incUpdate["sequence.count"] = 1;
        } else if (seqUpdatedAt.isSame(now.subtract(1, 'day'), 'day')) {
          setUpdate["sequence.updated_at"] = nowISO;
          incUpdate["sequence.count"] = 1;
        } else if (seqUpdatedAt.isSame(now.add(1, 'day'), 'day')) {
          // stored future by +1 day: reset streak to 1 and normalize date to now
          setUpdate["sequence.updated_at"] = nowISO;
          setUpdate["sequence.count"] = 1;
        } else if (seqUpdatedAt.isSame(now, 'day')) {
          // same day: do nothing
        } else {
          // any gap > 1 day (past or future beyond +1): reset to 1
          setUpdate["sequence.updated_at"] = nowISO;
          setUpdate["sequence.count"] = 1;
        }

        const updateOps = Object.keys(setUpdate).length || Object.keys(incUpdate).length
          ? { $set: setUpdate, ...(Object.keys(incUpdate).length ? { $inc: incUpdate } : {}) }
          : null;
        if (updateOps) {
          await this.adapter.collection.updateOne({ _id: user._id }, updateOps);
        }

        const token = jwt.sign({ email }, secret, { expiresIn: "30d" });

        // 12 - emit an event to ws service about user login to a private channel
        const channel = `user:${email}`;
        ctx.broadcast("user.logged", { email, channel, at: new Date().toISOString() });

        return { token };
      }
    },

    // 5 & 8 - auth receives JWT token, verifies, and returns user doc or false
    auth: {
      async handler(ctx) {
        const schema = yup.object({ token: yup.string().min(1).required() });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const token = ctx.params.token;

        // Check if token is blacklisted in Redis
        try {
          if (this.redis) {
            const blacklisted = await this.redis.get(`blacklist:${token}`);
            if (blacklisted) {
              return false;
            }
          }
        } catch (err) {
          this.logger.warn("Redis check failed in auth; proceeding with JWT verify", err?.message || err);
        }
        const secret = this.settings.jwtSecret || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error("JWT secret not configured");
        }
        let payload;
        try {
          payload = jwt.verify(token, secret);
        } catch (err) {
          return false;
        }
        const email = payload && payload.email;
        if (!email) return false;

        const user = await this.adapter.collection.findOne({ email: String(email).toLowerCase() });
        if (!user) return false;

        const defaultUser = {
          role: "basic",
          level: 1,
          xp: 0,
          sequence: { updated_at: null, count: 0 },
          score: { positive: 0, negative: 0 },
          wallet: { count: 0, credits: 0 },
          badges: [],
          createdAt: new Date().toISOString()
        };
        // Ensure defaults for missing properties only
        return defaultsDeep({}, user, defaultUser);
      }
    },

    // changePassword receives JWT token, old password and new password, validates and updates password
    changePassword: {
      async handler(ctx) {

        const schema = yup.object({
          token: yup.string().min(1).required(),
          oldPassword: yup.string().min(1).required(),
          newPassword: yup.string().min(6).required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return { success: false, error: "Parâmetros inválidos" };
        }

        const token = ctx.params.token;
        const oldPassword = String(ctx.params.oldPassword);
        const newPassword = String(ctx.params.newPassword);

        // Check if token is blacklisted in Redis
        try {
          if (this.redis) {
            const blacklisted = await this.redis.get(`blacklist:${token}`);
            if (blacklisted) {
              return { success: false, error: "Token inválido" };
            }
          }
        } catch (err) {
          this.logger.warn("Redis check failed in changePassword; proceeding with JWT verify", err?.message || err);
        }

        // Verify JWT token and get user email
        const secret = this.settings.jwtSecret || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error("JWT secret not configured");
        }
        let payload;
        try {
          payload = jwt.verify(token, secret);
        } catch (err) {
          return { success: false, error: "Token inválido ou expirado" };
        }
        const email = payload && payload.email;
        if (!email) {
          return { success: false, error: "Token inválido" };
        }

        // Find user by email
        const col = this.adapter.collection;
        const user = await col.findOne({ email: String(email).toLowerCase() });
        if (!user) {
          return { success: false, error: "Usuário não encontrado" };
        }

        // Verify old password
        const oldPasswordHash = this.hashPassword(oldPassword);
        if (!user.passwordHash || user.passwordHash !== oldPasswordHash) {
          return { success: false, error: "Senha antiga incorreta" };
        }

        // Check if new password is different from old password
        const newPasswordHash = this.hashPassword(newPassword);
        if (user.passwordHash === newPasswordHash) {
          return { success: false, error: "A nova senha deve ser diferente da senha atual" };
        }

        // Update password
        try {
          await col.updateOne(
            { _id: user._id },
            { $set: { passwordHash: newPasswordHash } }
          );
          return { success: true, message: "Senha alterada com sucesso" };
        } catch (err) {
          this.logger.error("Failed to update password", err?.message || err);
          return { success: false, error: "Erro ao atualizar senha" };
        }
      }
    },

    forgotPassword: {
      async handler(ctx) {
        const schema = yup.object({
          email: yup.string().email().required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return { success: false, error: "Email inválido" };
        }

        const email = String(ctx.params.email).trim().toLowerCase();
        const col = this.adapter.collection;
        const user = await col.findOne({ email });

        // Sempre retorna sucesso para não expor se o email existe ou não
        if (!user) {
          return { success: true, message: "Se o email existir, você receberá uma senha temporária" };
        }

        // Gera GUID como senha temporária
        const tempPassword = crypto.randomUUID();
        const tempPasswordHash = this.hashPassword(tempPassword);

        // Atualiza a senha no banco
        try {
          await col.updateOne(
            { _id: user._id },
            { $set: { passwordHash: tempPasswordHash } }
          );

          // Emite evento para envio de email
          await ctx.emit("forgotPassword", { email, tempPassword });

          return { success: true, message: "Senha temporária enviada por email" };
        } catch (err) {
          this.logger.error("Failed to reset password", err?.message || err);
          return { success: false, error: "Erro ao processar solicitação" };
        }
      }
    }
  },

  events: {
    async "invite"(ctx) {
      const email = String(ctx.params?.email || "").trim().toLowerCase();
      if (!email) {
        this.logger.warn("Invite event received without valid email");
        return;
      }

      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_LOGIN;
      const pass = process.env.SMTP_KEY;
      const from = process.env.SMTP_FROM || user;

      if (!host || !user || !pass) {
        this.logger.warn("SMTP env not fully configured; skipping email send");
        return;
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: false,
          auth: { user, pass }
        });

        await transporter.sendMail({
          from,
          to: email,
          subject: "Convite de Teste ENG QUIZ",
          text: "Convite de Teste ENG QUIZ"
        });

        this.logger.info(`Invite email sent to ${email}`);
      } catch (err) {
      this.logger.error("Failed to send invite email", err);
    }
    },

    async "engine.score.pick"(ctx) {
      try {
        const email = String(ctx.params?.email || "").trim().toLowerCase();
        const positive = Number(ctx.params?.positive || 0);
        const negative = Number(ctx.params?.negative || 0);
        if (!email) return;
        await this.adapter.collection.updateOne(
          { email },
          { $inc: { "score.positive": positive, "score.negative": negative } }
        );
      } catch (e) {
        this.logger.warn("Failed to apply engine.score.pick to user", e?.message || e);
      }
    },

    async "forgotPassword"(ctx) {
      const email = String(ctx.params?.email || "").trim().toLowerCase();
      const tempPassword = String(ctx.params?.tempPassword || "");
      
      if (!email || !tempPassword) {
        this.logger.warn("ForgotPassword event received without valid email or tempPassword");
        return;
      }

      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_LOGIN;
      const pass = process.env.SMTP_KEY;
      const from = process.env.SMTP_FROM || user;

      if (!host || !user || !pass) {
        this.logger.warn("SMTP env not fully configured; skipping email send");
        return;
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: false,
          auth: { user, pass }
        });

        const emailText = `Olá,\n\nVocê solicitou a recuperação de senha no Soccer Quiz.\n\nSua senha temporária é: ${tempPassword}\n\nPor favor, faça login com esta senha e altere-a para uma senha segura.\n\nAtenciosamente,\nEquipe Soccer Quiz`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Recuperação de Senha - Soccer Quiz</h2>
            <p>Olá,</p>
            <p>Você solicitou a recuperação de senha no Soccer Quiz.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Sua senha temporária é:</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-family: monospace; color: #e53935;">${tempPassword}</p>
            </div>
            <p>Por favor, faça login com esta senha e altere-a para uma senha segura.</p>
            <p>Atenciosamente,<br>Equipe Soccer Quiz</p>
          </div>
        `;

        await transporter.sendMail({
          from,
          to: email,
          subject: "Recuperação de Senha - Soccer Quiz",
          text: emailText,
          html: emailHtml
        });

        this.logger.info(`ForgotPassword email sent to ${email}`);
      } catch (err) {
        this.logger.error("Failed to send forgotPassword email", err);
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
        this.logger.warn("No REDIS_URL or REDIS_HOST set; token blacklist disabled");
      }
    } catch (e) {
      this.redis = null;
      this.logger.error("Failed to initialize Redis client", e?.message || e);
    }
    // ensure index on email
    try {
      await this.adapter.collection.createIndex({ email: 1 }, { unique: true });
    } catch (e) {
      this.logger.warn("Could not create unique index on users.email", e?.message || e);
    }
    // upsert admin account with default password
    try {
      const adminEmail = "admin@admin.com";
      const adminPasswordHash = this.hashPassword("admin123");
      const col = this.adapter.collection;
      await col.updateOne(
        { email: adminEmail },
        {
          $setOnInsert: {
            email: adminEmail,
            role: "admin",
            passwordHash: adminPasswordHash,
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      // Ensure passwordHash exists if admin already existed without it
      await col.updateOne(
        { email: adminEmail, passwordHash: { $exists: false } },
        { $set: { passwordHash: adminPasswordHash } }
      );
    } catch (e) {
      this.logger.warn("Admin upsert failed", e?.message || e);
    }
  }
};
