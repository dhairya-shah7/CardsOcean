import { app } from "./app.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";

// ── Global safety nets ────────────────────────────────────────────────────
// Catch async promise rejections that escape route handlers
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection", { reason, promise: String(promise) });
  // Do NOT exit in development — just log. In production you may want to exit and let the process manager restart.
  if (config.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Catch synchronous exceptions that escape all middleware
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception — server will exit", { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown on SIGTERM / SIGINT
const server = app.listen(config.PORT, "0.0.0.0", () => {
  logger.info(`Cards Ocean API listening on port ${config.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  // Force-exit after 10 s if connections hang
  setTimeout(() => {
    logger.error("Forced exit after graceful shutdown timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
