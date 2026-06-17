/**
 * Minimal structured logger.
 *
 * IMPORTANT: MCP stdio servers must keep stdout clean for the JSON-RPC
 * protocol. Every log line therefore goes to stderr.
 */
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, scope: string, msg: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase().padEnd(5)} (${scope}) ${msg}`;
  if (meta !== undefined) {
    process.stderr.write(`${base} ${safeJson(meta)}\n`);
  } else {
    process.stderr.write(`${base}\n`);
  }
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, meta?: unknown) => emit("debug", scope, msg, meta),
    info: (msg: string, meta?: unknown) => emit("info", scope, msg, meta),
    warn: (msg: string, meta?: unknown) => emit("warn", scope, msg, meta),
    error: (msg: string, meta?: unknown) => emit("error", scope, msg, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
