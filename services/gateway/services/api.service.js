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
                    "gateway.auth.v1.invite",
                    "gateway.content.v1.createQuiz",
                    "gateway.content.v1.createTeam",
                    "gateway.content.v1.createQuestion",
                    "gateway.content.v1.toggleQuizQuestion",
                    "gateway.content.v1.getQuizzes",
                    "gateway.content.v1.getQuiz"
                ],
                use: [],
                mergeParams: true,
                authentication: true,
                authorization: false,
                autoAliases: true,
                aliases: {
                    "GET ping/v1/ping": "gateway.ping.v1.trigger",
                    "POST auth/v1/register": "gateway.auth.v1.register",
                    "POST auth/v1/login": "gateway.auth.v1.login",
                    "POST auth/v1/auth": "gateway.auth.v1.auth",
                    "POST auth/v1/invite": "gateway.auth.v1.invite",
                    "POST content/v1/quiz": "gateway.content.v1.createQuiz",
                    "POST content/v1/team": "gateway.content.v1.createTeam",
                    "POST content/v1/question": "gateway.content.v1.createQuestion",
                    "POST content/v1/quiz/toggle-question": "gateway.content.v1.toggleQuizQuestion",
                    "GET content/v1/quizzes": "gateway.content.v1.getQuizzes",
                    "GET content/v1/quiz/:id": "gateway.content.v1.getQuiz"
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
        // No token provided; allow anonymous unless route requires auth
        return null;
        },

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} req
		 * @returns {Promise}
		 */
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
