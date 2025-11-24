"use strict";

const MongoAdapter = require("moleculer-db-adapter-mongo");
const { v4: uuidv4 } = require("uuid");
const yup = require("yup");

module.exports = {
  name: "content",

  created() {
    this.adapter = new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost:27017/db_content_service");
    this.adapter.init(this.broker, this);
  },

  async started() {
    await this.adapter.connect();
    this.db = this.adapter.db;
    this.quizzes = this.db.collection("quizzes");
    this.questions = this.db.collection("questions");
    this.teams = this.db.collection("teams");

    await Promise.all([
      this.quizzes.createIndex({ uuid: 1 }, { unique: true }),
      this.questions.createIndex({ uuid: 1 }, { unique: true }),
      this.teams.createIndex({ uuid: 1 }, { unique: true })
    ]);
  },

  actions: {
    // 4 - createQuiz
    createQuiz: {
      async handler(ctx) {
        // Validation
        const answerSchema = yup.object({
          text: yup.string().required()
        }).noUnknown(true);

        const teamSchema = yup.object({
          uuid: yup.string().uuid().optional(),
          text: yup.string().required(),
          image_url: yup.string().nullable().optional()
        }).noUnknown(true);

        const questionSchema = yup.object({
          uuid: yup.string().uuid().optional(),
          text: yup.string().required(),
          value: answerSchema.required(),
          options: yup.array().of(answerSchema).required(),
          team: teamSchema.required()
        }).noUnknown(true);

        const quizSchema = yup.object({
          name: yup.string().nullable().default(null),
          image_url: yup.string().nullable().default(null),
          games: yup.number().integer().default(0),
          question_time: yup.number().integer().default(60),
          qustion_point: yup.number().integer().default(100),
          is_active: yup.boolean().default(false),
          start_at: yup.date().nullable().default(null),
          finish_at: yup.date().nullable().default(null),
          questions: yup.array().of(questionSchema).default([])
        }).noUnknown(true);

        let data;
        try {
          data = await quizSchema.validate(ctx.params || {}, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }

        const now = new Date().toISOString();
        const quiz = {
          uuid: uuidv4(),
          ...data,
          createdAt: now,
          updatedAt: now
        };
        // Ensure nested items have uuid if present
        if (Array.isArray(quiz.questions)) {
          quiz.questions = quiz.questions.map(q => ({
            uuid: q.uuid || uuidv4(),
            text: q.text,
            value: { text: q.value.text },
            options: Array.isArray(q.options) ? q.options.map(o => ({ text: o.text })) : [],
            team: {
              uuid: (q.team && q.team.uuid) || uuidv4(),
              text: q.team.text,
              image_url: q.team.image_url ?? null
            }
          }));
        }

        await this.quizzes.insertOne(quiz);
        return quiz;
      }
    },

    // 5 - createTeam
    createTeam: {
      async handler(ctx) {
        const schema = yup.object({
          text: yup.string().required(),
          image_url: yup.string().nullable().optional()
        }).noUnknown(true);
        let data;
        try {
          data = await schema.validate(ctx.params || {}, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const doc = { uuid: uuidv4(), ...data, createdAt: new Date().toISOString() };
        await this.teams.insertOne(doc);
        return doc;
      }
    },

    // 5 - createQuestion
    createQuestion: {
      async handler(ctx) {
        const answerSchema = yup.object({ text: yup.string().required() }).noUnknown(true);
        const teamSchema = yup.object({
          uuid: yup.string().uuid().optional(),
          text: yup.string().required(),
          image_url: yup.string().nullable().optional()
        }).noUnknown(true);
        const schema = yup.object({
          text: yup.string().required(),
          value: answerSchema.required(),
          options: yup.array().of(answerSchema).required(),
          team: teamSchema.required()
        }).noUnknown(true);
        let data;
        try {
          data = await schema.validate(ctx.params || {}, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const doc = {
          uuid: uuidv4(),
          text: data.text,
          value: { text: data.value.text },
          options: data.options.map(o => ({ text: o.text })),
          team: { uuid: data.team.uuid || uuidv4(), text: data.team.text, image_url: data.team.image_url ?? null },
          createdAt: new Date().toISOString()
        };
        await this.questions.insertOne(doc);
        return doc;
      }
    },

    // 5 - toggleQuizQuestion
    toggleQuizQuestion: {
      async handler(ctx) {
        const schema = yup.object({
          quizId: yup.string().uuid().required(),
          questionId: yup.string().uuid().required()
        }).noUnknown(true);
        let params;
        try {
          params = await schema.validate(ctx.params || {}, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        const quiz = await this.quizzes.findOne({ uuid: params.quizId });
        if (!quiz) return false;
        const question = await this.questions.findOne({ uuid: params.questionId });
        if (!question) return false;

        const exists = Array.isArray(quiz.questions) && quiz.questions.find(q => q.uuid === question.uuid);
        if (exists) {
          await this.quizzes.updateOne(
            { uuid: quiz.uuid },
            { $pull: { questions: { uuid: question.uuid } }, $set: { updatedAt: new Date().toISOString() } }
          );
        } else {
          await this.quizzes.updateOne(
            { uuid: quiz.uuid },
            { $push: { questions: question }, $set: { updatedAt: new Date().toISOString() } }
          );
        }
        return await this.quizzes.findOne({ uuid: quiz.uuid });
      }
    },

    // 5 - getQuizzes (without questions)
    getQuizzes: {
      async handler() {
        const cursor = this.quizzes.find({}, { projection: { questions: 0 } });
        return await cursor.toArray();
      }
    },

    // 5 - getQuiz (full)
    getQuiz: {
      async handler(ctx) {
        const schema = yup.object({ id: yup.string().uuid().required() });
        let params;
        try {
          params = await schema.validate(ctx.params || {}, { abortEarly: false, stripUnknown: true });
        } catch (e) {
          return false;
        }
        return await this.quizzes.findOne({ uuid: params.id });
      }
    }
  }
};

