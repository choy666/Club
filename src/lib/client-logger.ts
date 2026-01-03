"use client";

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, ...args: unknown[]) {
  if (typeof window === "undefined") {
    return;
  }

  const prefix = `[client:${level}]`;

  console[level === "debug" ? "log" : level](prefix, ...args);
}

export const clientLogger = {
  debug: (...args: unknown[]) => log("debug", ...args),
  info: (...args: unknown[]) => log("info", ...args),
  warn: (...args: unknown[]) => log("warn", ...args),
  error: (...args: unknown[]) => log("error", ...args),
};
