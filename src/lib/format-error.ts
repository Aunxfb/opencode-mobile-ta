// Format a server-side error (from `session.error` SSE events, API throws,
// etc.) into a human-readable string. Mirrors the server CLI's precedence in
// `run/session-data.ts`: error.data?.message ?? error.message ?? error.name
// ?? "unknown error". Pure + unit-testable — no React Native imports.

const FALLBACK = "Unknown error"

export function formatError(error: unknown): string {
  if (!error || typeof error !== "object") return FALLBACK
  const e = error as { data?: { message?: unknown }; message?: unknown; name?: unknown }
  if (typeof e.data?.message === "string" && e.data.message.trim()) return e.data.message
  if (typeof e.message === "string" && e.message.trim()) return e.message
  if (typeof e.name === "string" && e.name.trim()) return e.name
  return FALLBACK
}
