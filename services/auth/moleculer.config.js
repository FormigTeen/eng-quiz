"use strict";

module.exports = {
  namespace: "",
  nodeID: null,
  metadata: {},

  logger: true,
  logLevel: process.env.LOGLEVEL || "info",

  transporter: process.env.TRANSPORTER || null,

  serializer: "JSON",
  requestTimeout: 10 * 1000,
  validator: true,
  metrics: { enabled: false },
  tracing: { enabled: false },
};

