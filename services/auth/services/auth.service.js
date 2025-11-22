"use strict";

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
const jwt = require("jsonwebtoken");
const yup = require("yup");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

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

  actions: {
    // 4 - register only receives email: string and password: string
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
        // Hash da senha antes de armazenar
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        await col.insertOne({ 
          email, 
          password: passwordHash,
          role: "basic", 
          createdAt: new Date().toISOString() 
        });
        return true;
      }
    },

    // 7 - login receives email: string and password: string and returns JWT for 30 days
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

        // Validar senha - obrigatória para todos os usuários
        if (!user.password) {
          // Usuário antigo sem senha cadastrada - não permitir login
          // O usuário precisa redefinir a senha através de outro mecanismo
          return false;
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
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
    },

    // logout - confirma logout do usuário (JWT é stateless, mas emite evento)
    logout: {
      auth: "required",
      async handler(ctx) {
        const user = ctx.meta.user;
        if (!user || !user.email) {
          return false;
        }
        const email = String(user.email).toLowerCase();
        
        // Emitir evento de logout
        const channel = `user:${email}`;
        ctx.broadcast("user.loggedOut", { email, channel, at: new Date().toISOString() });
        
        return true;
      }
    },

    // changePassword - altera senha do usuário autenticado
    changePassword: {
      auth: "required",
      async handler(ctx) {
        const schema = yup.object({
          currentPassword: yup.string().min(1).required(),
          newPassword: yup.string().min(6).required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }

        const user = ctx.meta.user;
        if (!user || !user.email) {
          return false;
        }

        const email = String(user.email).toLowerCase();
        const currentPassword = String(ctx.params.currentPassword);
        const newPassword = String(ctx.params.newPassword);
        const col = this.adapter.collection;

        // Buscar usuário atualizado do banco
        const dbUser = await col.findOne({ email });
        if (!dbUser || !dbUser.password) {
          return false;
        }

        // Validar senha atual
        const passwordMatch = await bcrypt.compare(currentPassword, dbUser.password);
        if (!passwordMatch) {
          return false;
        }

        // Hash da nova senha
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Atualizar senha
        await col.updateOne(
          { email },
          { $set: { password: newPasswordHash, updatedAt: new Date().toISOString() } }
        );

        return true;
      }
    },

    // resetPassword - gera nova senha temporária e envia por email
    resetPassword: {
      async handler(ctx) {
        const schema = yup.object({
          email: yup.string().email().required()
        });
        try {
          await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }

        const email = String(ctx.params.email).trim().toLowerCase();
        const col = this.adapter.collection;
        const user = await col.findOne({ email });
        
        // Sempre retornar true para não expor se o email existe ou não
        if (!user) {
          return true;
        }

        // Gerar senha temporária (8 caracteres alfanuméricos)
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        const tempPasswordClean = tempPassword.substring(0, 12);

        // Hash da senha temporária
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(tempPasswordClean, saltRounds);

        // Atualizar senha no banco
        await col.updateOne(
          { email },
          { $set: { password: passwordHash, updatedAt: new Date().toISOString() } }
        );

        // Enviar email com nova senha
        await this.sendPasswordResetEmail(email, tempPasswordClean);

        return true;
      }
    }
  },

  methods: {
    async sendPasswordResetEmail(email, newPassword) {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_LOGIN;
      const pass = process.env.SMTP_KEY;
      const from = process.env.SMTP_FROM || user;

      if (!host || !user || !pass) {
        this.logger.warn("SMTP env not fully configured; skipping password reset email send");
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
          subject: "Redefinição de Senha - ENG QUIZ",
          text: `Sua nova senha temporária é: ${newPassword}\n\nPor favor, altere esta senha após fazer login.`,
          html: `<p>Sua nova senha temporária é: <strong>${newPassword}</strong></p><p>Por favor, altere esta senha após fazer login.</p>`
        });

        this.logger.info(`Password reset email sent to ${email}`);
      } catch (err) {
        this.logger.error("Failed to send password reset email", err);
        throw err;
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
    // upsert admin account
    try {
      const adminEmail = "admin@admin.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const existingAdmin = await this.adapter.collection.findOne({ email: adminEmail });
      
      if (!existingAdmin) {
        // Criar admin com senha
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
        await this.adapter.collection.insertOne({
          email: adminEmail,
          password: passwordHash,
          role: "admin",
          createdAt: new Date().toISOString()
        });
        this.logger.info(`Admin account created with default password (change it in production!)`);
      } else if (!existingAdmin.password) {
        // Atualizar admin existente sem senha para incluir senha padrão
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
        await this.adapter.collection.updateOne(
          { email: adminEmail },
          { $set: { password: passwordHash } }
        );
        this.logger.info(`Admin account updated with default password (change it in production!)`);
      }
    } catch (e) {
      this.logger.warn("Admin upsert failed", e?.message || e);
    }
  }
};
