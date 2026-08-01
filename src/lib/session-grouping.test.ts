import { test } from "node:test"
import assert from "node:assert/strict"
import { groupByDirectory, splitByRecentness, DEFAULT_EARLIER_CUTOFF_MS } from "./session-grouping.ts"

test("groupByDirectory: buckets items by directory, preserving item order within a bucket", () => {
  const items = [
    { id: "1", directory: "/a" },
    { id: "2", directory: "/b" },
    { id: "3", directory: "/a" },
  ]
  const groups = groupByDirectory(items)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].directory, "/a")
  assert.deepEqual(groups[0].items.map((i) => i.id), ["1", "3"])
  assert.equal(groups[1].directory, "/b")
  assert.deepEqual(groups[1].items.map((i) => i.id), ["2"])
})

test("groupByDirectory: orders groups by first-seen directory, not alphabetically", () => {
  const items = [
    { id: "1", directory: "/z" },
    { id: "2", directory: "/a" },
  ]
  const groups = groupByDirectory(items)
  assert.deepEqual(
    groups.map((g) => g.directory),
    ["/z", "/a"],
  )
})

test("groupByDirectory: empty input returns no groups", () => {
  assert.deepEqual(groupByDirectory([]), [])
})

test("groupByDirectory: single directory yields a single group with all items", () => {
  const items = [
    { id: "1", directory: "/a" },
    { id: "2", directory: "/a" },
  ]
  const groups = groupByDirectory(items)
  assert.equal(groups.length, 1)
  assert.equal(groups[0].items.length, 2)
})

test("splitByRecentness: items updated within cutoff are recent, older ones are earlier", () => {
  const now = Date.now()
  const items = [
    { id: "1", time: { updated: now } },
    { id: "2", time: { updated: now - 60_000 } },
    { id: "3", time: { updated: now - DEFAULT_EARLIER_CUTOFF_MS - 1000 } },
  ]
  const { recent, earlier } = splitByRecentness(items)
  assert.deepEqual(
    recent.map((i) => i.id),
    ["1", "2"],
  )
  assert.deepEqual(
    earlier.map((i) => i.id),
    ["3"],
  )
})

test("splitByRecentness: preserves item order within each bucket", () => {
  const now = Date.now()
  const items = [
    { id: "a", time: { updated: now - DEFAULT_EARLIER_CUTOFF_MS - 5000 } },
    { id: "b", time: { updated: now - 1000 } },
    { id: "c", time: { updated: now - DEFAULT_EARLIER_CUTOFF_MS - 6000 } },
    { id: "d", time: { updated: now - 2000 } },
  ]
  const { recent, earlier } = splitByRecentness(items)
  assert.deepEqual(
    recent.map((i) => i.id),
    ["b", "d"],
  )
  assert.deepEqual(
    earlier.map((i) => i.id),
    ["a", "c"],
  )
})

test("splitByRecentness: treats missing or non-numeric updated as older", () => {
  const { recent, earlier } = splitByRecentness([
    { id: "1", time: { updated: Date.now() } },
    { id: "2" },
    { id: "3", time: {} },
  ])
  assert.deepEqual(
    recent.map((i) => i.id),
    ["1"],
  )
  assert.deepEqual(
    earlier.map((i) => i.id),
    ["2", "3"],
  )
})

test("splitByRecentness: empty input returns empty buckets", () => {
  assert.deepEqual(splitByRecentness([]), { recent: [], earlier: [] })
})
