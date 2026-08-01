import type { Client, Message, Part } from "./sdk"

const TITLE_AGENT = "title"
const SCRATCH_TITLE = "Temporary title generation"
const MAX_CONTENT_CHARS = 3000
const MAX_USER_MESSAGES = 6
const POLL_INTERVAL_MS = 1000
const POLL_TIMEOUT_MS = 60_000
const TITLE_MAX_LEN = 50

// User text parts in conversation order, skipping optimistic temp messages.
function userMessageTexts(messages: Message[], parts: Record<string, Part[]>): string[] {
  const texts: string[] = []
  for (const msg of messages) {
    if (msg.role !== "user" || msg.id.startsWith("temp-")) continue
    const text = (parts[msg.id] || [])
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text as string)
      .join("\n")
    if (text.trim()) texts.push(text.trim())
  }
  return texts
}

export function buildTitlePrompt(messages: Message[], parts: Record<string, Part[]>): string {
  const texts = userMessageTexts(messages, parts)
  if (texts.length === 0) return ""
  const ordered = texts.length <= MAX_USER_MESSAGES ? texts : [texts[0], ...texts.slice(-(MAX_USER_MESSAGES - 1))]
  let budget = MAX_CONTENT_CHARS
  const lines: string[] = []
  for (const text of ordered) {
    if (budget <= 0) break
    const slice = text.slice(0, budget)
    lines.push(slice)
    budget -= slice.length + 2
  }
  return lines.join("\n\n")
}

export function sanitizeTitle(raw: string): string {
  let out = raw.trim()
  out = out.replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, ""))
  out = out.replace(/`/g, "")
  out = out.replace(/^["'\u201c\u201d]+/, "").replace(/["'\u201c\u201d]+$/, "")
  out = out.replace(/\s+/g, " ").trim()
  return out.length > TITLE_MAX_LEN ? out.slice(0, TITLE_MAX_LEN).trim() : out
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pollForTitle(client: Client, sessionID: string): Promise<string | null> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const items = await client.session.messages(sessionID)
    const last = items.filter((item) => item.info.role === "assistant").pop()
    if (last) {
      if (last.info.error) return null
      if (last.info.time?.completed) {
        const text = last.parts
          .filter((p) => p.type === "text" && p.text)
          .map((p) => p.text as string)
          .join(" ")
          .trim()
        return text || null
      }
    }
    await sleep(POLL_INTERVAL_MS)
  }
  return null
}

// Regenerates a session title by running the server's built-in "title" agent
// against a throwaway session that is deleted once the title is produced. The
// request is a real AI turn on the user's server, so it appears in the server
// log and counts toward API billing.
export async function regenerateTitle(
  client: Client,
  sessionID: string,
  messages: Message[],
  parts: Record<string, Part[]>,
): Promise<string | null> {
  const promptText = buildTitlePrompt(messages, parts)
  if (!promptText) return null

  const scratch = await client.session.create({ title: SCRATCH_TITLE })
  try {
    await client.session.prompt(scratch.id, {
      parts: [{ type: "text", text: promptText }],
      agent: TITLE_AGENT,
    })
    const raw = await pollForTitle(client, scratch.id)
    if (!raw) return null
    return sanitizeTitle(raw) || null
  } finally {
    await client.session.delete(scratch.id).catch(() => {})
  }
}
