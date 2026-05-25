/**
 * Minimal structured logger. Emits JSON lines so they're searchable when
 * shipped to Axiom/Logtail in production (spec §11.1d). Falls back to console.
 */
type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  orgId?: string;
  userId?: string;
  action?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function emit(level: Level, message: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, f?: LogFields) => emit("debug", m, f),
  info: (m: string, f?: LogFields) => emit("info", m, f),
  warn: (m: string, f?: LogFields) => emit("warn", m, f),
  error: (m: string, f?: LogFields) => emit("error", m, f),
};

/**
 * Error-capture integration point. Emits a structured error log today; the
 * production drop-in is Sentry — install `@sentry/nextjs`, run its wizard, and
 * forward here (guarded on `SENTRY_DSN`). Kept dependency-free so the build
 * stays clean without a Sentry account.
 */
export function captureException(err: unknown, fields: LogFields = {}) {
  const message = err instanceof Error ? err.message : String(err);
  emit("error", message, {
    ...fields,
    stack: err instanceof Error ? err.stack : undefined,
    sentry: Boolean(process.env.SENTRY_DSN),
  });
}
