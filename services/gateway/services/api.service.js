"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	settings: {
		port: process.env.PORT || 3000,

		ip: "0.0.0.0",

		use: [],

    routes: [
            {
                path: "/",
                cors: {
                    origin: "*",
                    methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE", "PATCH"],
                    allowedHeaders: ["Content-Type", "Authorization"],
                    exposedHeaders: [],
                    credentials: false,
                    maxAge: 3600
                },
                whitelist: [
                    "gateway.ping.v1.trigger",
                    "gateway.auth.v1.register",
                    "gateway.auth.v1.login",
                    "gateway.auth.v1.auth",
                    "gateway.auth.v1.logout",
                    "gateway.auth.v1.invite",
                    "gateway.auth.v1.changePassword",
                    "gateway.auth.v1.forgotPassword",
                    "gateway.content.v1.createQuiz",
                    "gateway.content.v1.createTeam",
                    "gateway.content.v1.createQuestion",
                    "gateway.content.v1.toggleQuizQuestion",
                    "gateway.content.v1.getQuizzes",
                    "gateway.content.v1.getQuiz",
                    "gateway.engine.v1.quizRandom",
                    "gateway.engine.v1.track",
                    "gateway.engine.v1.pick",
                    "gateway.payment.v1.createPayment",
                    "gateway.payment.v1.getPaymentStatus",
                    "gateway.payment.v1.listPayments",
                    "gateway.payment.v1.webhook"
                ],
                use: [
                  // Middleware para passar headers do webhook
                  (req, res, next) => {
                    if (req.$route && req.$route.path === "/payment/v1/webhook") {
                      // Armazenar headers no req para acesso posterior
                      req.webhookHeaders = req.headers;
                    }
                    next();
                  }
                ],
                mergeParams: true,
                authentication: true,
                authorization: false,
                autoAliases: true,
                aliases: {
                    "GET ping/v1/ping": "gateway.ping.v1.trigger",
                    "POST auth/v1/register": "gateway.auth.v1.register",
                    "POST auth/v1/login": "gateway.auth.v1.login",
                    "POST auth/v1/auth": "gateway.auth.v1.auth",
                    "POST auth/v1/logout": "gateway.auth.v1.logout",
                    "POST auth/v1/invite": "gateway.auth.v1.invite",
                    "POST auth/v1/change-password": "gateway.auth.v1.changePassword",
                    "POST auth/v1/forgot-password": "gateway.auth.v1.forgotPassword",
                    "POST content/v1/quiz": "gateway.content.v1.createQuiz",
                    "POST content/v1/team": "gateway.content.v1.createTeam",
                    "POST content/v1/question": "gateway.content.v1.createQuestion",
                    "POST content/v1/quiz/toggle-question": "gateway.content.v1.toggleQuizQuestion",
                    "GET content/v1/quizzes": "gateway.content.v1.getQuizzes",
                    "GET content/v1/quiz/:id": "gateway.content.v1.getQuiz",
                    "GET engine/v1/quiz/random": "gateway.engine.v1.quizRandom",
                    "POST engine/v1/track": "gateway.engine.v1.track",
                    "POST engine/v1/pick": "gateway.engine.v1.pick",
                    "POST payment/v1/create": "gateway.payment.v1.createPayment",
                    "GET payment/v1/status/:id": "gateway.payment.v1.getPaymentStatus",
                    "GET payment/v1/list": "gateway.payment.v1.listPayments",
                    "POST payment/v1/webhook": "gateway.payment.v1.webhook"
                },
                callOptions: {},
                bodyParsers: {
                    json: {
                        strict: false,
                        limit: "1MB"
                    },
                    urlencoded: {
                        extended: true,
                        limit: "1MB"
                    }
                },
                mappingPolicy: "all", // Available values: "all", "restrict"
                logging: true
            },
		],

		log4XXResponses: false,
		logRequestParams: null,
		logResponseData: null,


		assets: {
			folder: "public",
			options: {}
		}
	},

	started() {
	},

    events: {},

	methods: {
		async authenticate(ctx, route, req) {
        const auth = req.headers["authorization"];
        if (auth && auth.startsWith("Bearer ")) {
            const token = auth.slice(7).trim();
            try {
                const user = await ctx.call("auth.auth", { token });
                if (!user) {
                    throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
                }
                return user; // becomes ctx.meta.user
            } catch (err) {
                // Map all failures to invalid token
                throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
            }
        }
        return null;
        },

		async authorize(ctx, route, req) {
			// Get the authenticated user.
			const user = ctx.meta.user;

			// It check the `auth` property in action schema.
			if (req.$action.auth == "required" && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
		}

	}
};
