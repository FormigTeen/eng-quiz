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
    }
  },

  actions: {
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
