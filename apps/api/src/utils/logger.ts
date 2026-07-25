type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, message: string, meta?: unknown) {
  const payload = meta === undefined ? message : `${message} ${typeof meta === "string" ? meta : JSON.stringify(meta)}`;
  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else if (level === "debug") {
    console.debug(payload);
  } else {
    console.info(payload);
  }
}

export const logger = {
  info(message: string, meta?: unknown) {
    log("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    log("error", message, meta);
  },
  debug(message: string, meta?: unknown) {
    log("debug", message, meta);
  }
};

