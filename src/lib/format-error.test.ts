import { test } from "node:test"
import assert from "node:assert/strict"
import { formatError } from "./format-error.ts"

test("formatError: prefers error.data.message over message and name", () => {
  assert.equal(
    formatError({ name: "AbortError", message: "boom", data: { message: "Free tier limit reached" } }),
    "Free tier limit reached",
  )
})

test("formatError: falls back to message when there is no data.message", () => {
  assert.equal(formatError({ name: "RateLimitError", message: "too many requests" }), "too many requests")
})

test("formatError: falls back to name when message is empty or whitespace", () => {
  assert.equal(formatError({ name: "SessionError", message: "   " }), "SessionError")
})

test("formatError: returns fallback for non-object input", () => {
  assert.equal(formatError(null), "Unknown error")
  assert.equal(formatError(undefined), "Unknown error")
  assert.equal(formatError("oops"), "Unknown error")
  assert.equal(formatError(42), "Unknown error")
})

test("formatError: returns fallback when nothing usable is present", () => {
  assert.equal(formatError({}), "Unknown error")
})
