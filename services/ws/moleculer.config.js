"use strict";

module.exports = {
  namespace: "",
  nodeID: null,
  metadata: {},

  logger: true,
  logLevel: "info",

  transporter: process.env.TRANSPORTER || null,

  serializer: "JSON",
  requestTimeout: 10 * 1000,
  retryPolicy: {
    enabled: false,
    retries: 5,
    delay: 100,
    maxDelay: 1000,
    factor: 2,
    check: err => err && !!err.retryable
  },

  metrics: { enabled: false },
  tracing: { enabled: false },

  middlewares: [],

  created(broker) {},
  async started(broker) {},
  async stopped(broker) {}
};

