"use strict";

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
const jwt = require("jsonwebtoken");
const yup = require("yup");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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
        await col.insertOne({ email, role: "basic", passwordHash, createdAt: new Date().toISOString() });
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
        return user || false;
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
