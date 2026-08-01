import { test } from "node:test"
import assert from "node:assert/strict"
import { buildTitlePrompt, sanitizeTitle } from "./regenerate-title.ts"
import type { Message, Part } from "./sdk.ts"

function msg(id: string, role: "user" | "assistant", text: string): { message: Message; part: Part } {
  return {
    message: { id, sessionID: "s", role, time: { created: 1 } },
    part: { id: `${id}-p`, messageID: id, type: "text", text },
  }
}

test("buildTitlePrompt: collects user text in order, skips assistants and temp messages", () => {
  const a = msg("m1", "user", "hello")
  const b = msg("m2", "assistant", "hi there")
  const c = msg("temp-3", "user", "world")
  const d = msg("m4", "user", "final")
  const messages = [a.message, b.message, c.message, d.message]
  const parts = { [a.message.id]: [a.part], [c.message.id]: [c.part], [d.message.id]: [d.part] }
  assert.equal(buildTitlePrompt(messages, parts), "hello\n\nfinal")
})

test("buildTitlePrompt: picks first + recent messages when there are many", () => {
  const all = Array.from({ length: 10 }, (_, i) => msg(`m${i}`, "user", `msg ${i}`))
  const messages = all.map((m) => m.message)
  const parts = Object.fromEntries(all.map((m) => [m.message.id, [m.part]]))
  assert.equal(buildTitlePrompt(messages, parts), "msg 0\n\nmsg 5\n\nmsg 6\n\nmsg 7\n\nmsg 8\n\nmsg 9")
})

test("buildTitlePrompt: returns empty when there is no user text", () => {
  const a = msg("m1", "assistant", "hello")
  assert.equal(buildTitlePrompt([a.message], { [a.message.id]: [a.part] }), "")
  assert.equal(buildTitlePrompt([], {}), "")
})

test("sanitizeTitle: strips code fences, backticks, quotes and collapses whitespace", () => {
  assert.equal(sanitizeTitle('`Fix bug in parser`'), "Fix bug in parser")
  assert.equal(sanitizeTitle("```\nfix things\nin code\n```"), "fix things in code")
  assert.equal(sanitizeTitle('"Debug 500s"'), "Debug 500s")
  assert.equal(sanitizeTitle("  Add\n\n  dark   mode  "), "Add dark mode")
})

test("sanitizeTitle: truncates long titles to 50 characters", () => {
  const long = "x".repeat(80)
  assert.equal(sanitizeTitle(long).length, 50)
  assert.equal(sanitizeTitle(""), "")
})
