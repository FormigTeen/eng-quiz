"use strict";

const fs = require("fs");
const path = require("path");
const IORedis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  if (!Array.isArray(arr) || count <= 0) return [];
  const a = arr.slice();
  const result = [];
  while (result.length < count && a.length > 0) {
    const idx = Math.floor(Math.random() * a.length);
    result.push(a.splice(idx, 1)[0]);
  }
  return result;
}

module.exports = {
  name: "engine",

  async started() {
    // Init Redis client for cache
    try {
      const url = process.env.REDIS_URL;
      const host = process.env.REDIS_HOST;
      if (url) this.redis = new IORedis(url);
      else if (host) this.redis = new IORedis({ host, port: 6379 });
      else this.redis = null;
    } catch (e) {
      this.redis = null;
      this.logger.error("Failed to init Redis in engine", e?.message || e);
    }
    // Load mock questions from file
    try {
      const file = path.join(__dirname, "./mock.json");
      const raw = fs.readFileSync(file, "utf-8");
      const data = JSON.parse(raw);
      // Expecting array of entities with: { uuid, text, options: [{text}], answer: {text} }
      this.bank = Array.isArray(data) ? data : [];
    } catch (e) {
      this.logger.warn("mock.json not found or invalid. Using empty bank.");
      this.bank = [];
    }
  },

  methods: {
    getQuestionByUUID(id) {
      if (!this.bank) return null;
      return this.bank.find(q => String(q.uuid) === String(id));
    }
  },

  actions: {
    // GET random quiz with 5 questions
    randomQuiz: {
      auth: "required",
      async handler(ctx) {
        const bank = Array.isArray(this.bank) ? this.bank : [];
        if (bank.length < 5) {
          // Not enough data; return empty quiz but don't crash
          return { uuid: uuidv4(), questions: [] };
        }
        const quizUUID = uuidv4();
        const qs = pickRandom(bank, 5).map(q => {
          // Select 3 random options from q.options (which should NOT include the answer!)
          // If answer is mixed into options in mock, filter it out by text
          const optionsPool = Array.isArray(q.options) ? q.options.filter(o => o?.text !== q?.answer?.text) : [];
          const picked = pickRandom(optionsPool, 3);
          const opts4 = shuffleArray([...picked, { text: q?.answer?.text }]);
          return { uuid: q.uuid, text: q.text, options: opts4 };
        });

        // Cache state for 15 minutes
        const rest = qs.map(q => q.uuid);
        const cacheVal = JSON.stringify({ points: 0, rest });
        try {
          if (this.redis) await this.redis.set(`quiz:hash:${quizUUID}`, cacheVal, "EX", 15 * 60);
        } catch (e) {
          this.logger.warn("Failed to set quiz cache", e?.message || e);
        }

        return { uuid: quizUUID, questions: qs };
      }
    },

    // Validate/Track answer for a question
    validate: {
      auth: "required",
      params: {
        quiz_uuid: { type: "string", min: 8 },
        question_uuid: { type: "string", min: 1 },
        answer: { type: "string", min: 1 }
      },
      async handler(ctx) {
        const { quiz_uuid, question_uuid, answer } = ctx.params;
        const q = this.getQuestionByUUID(question_uuid);
        if (!q) return null;
        const correctText = q?.answer?.text || null;
        const isCorrect = String(answer) === String(correctText);

        if (this.redis) {
          const key = `quiz:hash:${quiz_uuid}`;
          try {
            const current = await this.redis.get(key);
            if (current) {
              const obj = JSON.parse(current);
              const rest = Array.isArray(obj?.rest) ? obj.rest : [];
              const idx = rest.findIndex(id => String(id) === String(question_uuid));
              if (idx >= 0) rest.splice(idx, 1);
              const points = Number(obj?.points || 0) + (isCorrect ? 1 : 0);
              const ttl = await this.redis.ttl(key);
              const payload = JSON.stringify({ points, rest });
              if (ttl > 0) await this.redis.set(key, payload, "EX", ttl);
              else await this.redis.set(key, payload, "EX", 15 * 60);
            }
          } catch (e) {
            this.logger.warn("validate cache update failed", e?.message || e);
          }
        }

        // Always return the correct answer text
        return { correct: correctText };
      }
    },

    // Finalize quiz and compute score; update user score via event
    pick: {
      auth: "required",
      params: { quiz_uuid: { type: "string", min: 8 } },
      async handler(ctx) {
        const { quiz_uuid } = ctx.params;
        let result = { positive: 0, negative: 5 };
        const email = ctx?.meta?.user?.email || null;
        if (this.redis) {
          const key = `quiz:hash:${quiz_uuid}`;
          try {
            const current = await this.redis.get(key);
            if (current) {
              const obj = JSON.parse(current);
              const rest = Array.isArray(obj?.rest) ? obj.rest : [];
              const points = Number(obj?.points || 0);
              if (rest.length === 0) {
                result = { positive: points, negative: 5 - points };
              } else {
                result = { positive: 0, negative: 5 };
              }
              await this.redis.del(key);
            }
          } catch (e) {
            this.logger.warn("pick cache read/del failed", e?.message || e);
          }
        }

        // Emit score update event for auth service to persist
        if (email) {
          ctx.broadcast("engine.score.pick", { email, ...result, at: new Date().toISOString() });
        }

        return result;
      }
    }
  }
};
