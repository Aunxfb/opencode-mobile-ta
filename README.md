# OpenCode Mobile

---

## TA PERSONAL CHANGES

All changes below are local modifications made during TA-assisted development. They are not part of the upstream codebase.

### Bugfix: Keyboard hides input on Android (portrait)

`app/session/[id].tsx` — Changed `keyboardVerticalOffset` on Android from `0` to `insets.top + 56` so the input stays visible when the keyboard opens. Added `keyboardShouldPersistTaps="handled"` to the FlatList so tapping outside the input dismisses the keyboard without losing scroll position.

### Bugfix: Tasks stuck "in progress" / text streaming not appearing

**Root cause:** The server streams text incrementally via `message.part.delta` SSE events (with `field: "text"` and partial `delta` content), but the mobile client only handled `message.part.updated` (which fires at start and end). Delta events were silently ignored — text never appeared until the entire response completed.

**`src/stores/events.ts`** — Added `"message.part.delta"` case (line 434) that finds the part by `partID` in the sessions store, appends the `delta` to the part's `.text` field, and updates state — triggering incremental re-render in real time.

**Watchdog fallback** — Added `lastActivityAt` tracking in all SSE handlers, a 30s watchdog interval, and `clearStaleBusySessions()` that force-idles sessions silent for >10min (emits error + notification). Exported `resyncSessionStatus()` for manual single-session refresh.

**`src/components/chat/StatusIndicator.tsx`** — Amber bar + " · Still working..." suffix when busy >5min with no activity; tap triggers `resyncSessionStatus()`.

### Bugfix: Long content clipped in reasoning / tool call output

**`src/components/chat/ReasoningBlock.tsx`** — Wrapped expanded text in `<ScrollView maxHeight={300}>`.

**`src/components/chat/ToolCallCard.tsx`** — Removed `numberOfLines={N}` clipping from all inside-scroll text blocks (bash output, write content, edit fallback, patch, glob/grep results, task prompts, generic details, error banners) — the ScrollView's `maxHeight: 300` is the sole constraint.

### Feature: Per-message action sheet (long-press any message)

**New file** `src/components/chat/MessageActions.tsx` — `@gorhom/bottom-sheet`-based action sheet with role-aware options:

| Action | User | Assistant | Behavior |
|--------|------|-----------|----------|
| **Copy** | ✅ | ✅ | Message text via `expo-clipboard` |
| **Edit** | ✅ | ❌ | Revert session → prefill composer |
| **Regenerate** | ❌ | ✅ | Delete assistant msg + re-send last user msg |
| **Fork** | ✅ | ✅ | Create child session from this message |
| **Delete** | ✅ | ✅ | `DELETE /session/:id/message/:id` + local removal |

**`src/stores/sessions.ts`** — Added `deleteMessage()`, `regenerateMessage()`, `forkSession()`.

**`src/lib/sdk.ts`** — Added `client.session.deleteMessage()`.

**`src/components/chat/MessageBubble.tsx`** — Long-press enabled for assistant messages too (was user-only).

**`app/session/[id].tsx`** — Replaced bare `Alert.alert` action picker with the bottom sheet; wired copy, delete, edit, regenerate, fork.

### Feature: Fork, Rename, Compact

**`src/lib/sdk.ts`** — Added `client.session.fork()` (POST `/session/:id/fork`) and `client.session.summarize()` (POST `/session/:id/summarize`).

**`src/stores/sessions.ts`** — Added `forkSession()` (returns new session for navigation), `renameSession()` (PATCH title), `summarizeSession()`.

**`src/components/chat/SessionInfo.tsx`** — Added **Rename** and **Compact** action buttons.

**`app/session/[id].tsx`** — Rename opens a modal with `TextInput` pre-filled with current title; Compact calls summarize with the selected model; Fork navigates to the new child session via `router.push()`.

### i18n

**`src/lib/i18n/en.json`** and `zh-Hans.json` — Added keys: `copyMessage`, `regenerate`, `fork`, `rename`, `compact`, `deleteConfirmTitle`, `deleteConfirmMessage`, `compactStartedTitle`, `compactStartedMessage`.

---

## <end of TA changes>

---

**The open-source Android client for the [opencode](https://github.com/sst/opencode) AI coding agent.**
AI-assisted coding from your phone — Android, via Google Play, F-Droid, or a direct APK.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![F-Droid repo](https://img.shields.io/badge/F--Droid-add_our_repo-1976D2?logo=f-droid)](https://dzianisv.github.io/opencode-mobile/fdroid/repo)
[![Download APK](https://img.shields.io/badge/Download-APK-green?logo=android)](https://github.com/dzianisv/opencode-mobile/releases/latest)
[![Google Play](https://img.shields.io/badge/Google_Play-Available-4CAF50?logo=google-play)](https://play.google.com/store/apps/details?id=cc.agentlabs.opencode)

> **Not affiliated with opencode.** OpenCode Mobile is an independent, community-built client and is
> not made by, endorsed by, or affiliated with the opencode / Anomaly team. It talks to an opencode
> server you run yourself, using opencode's open HTTP API.

---

**New: tap "Try a Demo" in the app to see the agent fix a real bug — reasoning, a grep, a diff, a permission prompt — in about 30 seconds, no server needed.**

---

## Install (Android)

There are **three working ways** to install OpenCode Mobile today, all for Android:

1. **Google Play** — **https://play.google.com/store/apps/details?id=cc.agentlabs.opencode**

2. **F-Droid (self-hosted repo)** — add our self-hosted repo to any F-Droid client, then install/update from there:
   ```
   https://dzianisv.github.io/opencode-mobile/fdroid/repo
   ```
   In the F-Droid app: **Settings → Repositories → + (add)** and paste the URL above. Current version: **v0.4.7**.

3. **Direct signed APK** — download the latest release and install it manually:
   **https://github.com/dzianisv/opencode-mobile/releases/latest**

> iOS is not available (see [Roadmap](#roadmap)). IzzyOnDroid submission is pending.

---

OpenCode Mobile is a React Native / Expo app that brings the power of the [opencode](https://github.com/sst/opencode) AI coding agent to your phone. Connect to your own self-hosted opencode server over your local network, a Cloudflare Tunnel, ngrok, or Tailscale — and write, review, and ship code from anywhere. The mobile client is **free and open-source** under the MIT license. There is no feature gate, no telemetry you did not opt into, and no ad network.

---

<p align="center">
  <img src="distribution/demo.gif" width="240" alt="OpenCode Mobile demo — connect to your server, browse sessions, and watch the AI agent stream a reply" />
</p>

<sub>Real on-device capture: add a connection, browse sessions, and watch the agent stream a response. Verified end-to-end on an Android emulator against a live opencode server (build cc.agentlabs.opencode).</sub>

---

## Features

- **Offline demo mode** — tap "Try a Demo" to see a full bug-fix walkthrough (reasoning → grep → diff → permission prompt) with zero setup, right from the empty state
- **Multi-connection** — manage multiple opencode servers (local network, Cloudflare Tunnel, ngrok, or Tailscale)
- **Biometric unlock** — Face ID, Touch ID, or Android fingerprint protects the app and individual message sends
- **Streaming chat** — token-by-token streaming responses directly from your opencode server
- **Diff viewer** — inline side-by-side diffs of every file change the agent makes
- **Tool call approval** — review and approve (or reject) tool calls before the agent executes them
- **Secure credential storage** — server credentials stored in the Android Keystore via `expo-secure-store`
- **Session management** — browse, create, and resume coding sessions

---

## Get OpenCode Mobile

Package: `cc.agentlabs.opencode` · Android only · current version v0.4.7

| Channel | Status | How |
|---|---|---|
| **Google Play** | **Live** | [play.google.com/store/apps/details?id=cc.agentlabs.opencode](https://play.google.com/store/apps/details?id=cc.agentlabs.opencode) |
| **F-Droid (self-hosted repo)** | **Live** | Add [`https://dzianisv.github.io/opencode-mobile/fdroid/repo`](https://dzianisv.github.io/opencode-mobile/fdroid/repo) in your F-Droid client |
| **Direct APK** | **Live** | [github.com/dzianisv/opencode-mobile/releases/latest](https://github.com/dzianisv/opencode-mobile/releases/latest) |
| IzzyOnDroid | Submission pending | Not live yet |
| Apple App Store / iOS | Not available | See [Roadmap](#roadmap) |

> The three live, supported install channels are **Google Play**, the **F-Droid self-hosted repo**, and the **direct signed APK**, all Android. IzzyOnDroid is pending, and there is no iOS build.

---

## Quick Start

**Don't have a server yet?** Install the app and tap **Try a Demo** on the Sessions screen first — no setup required. It plays back a scripted bug-fix session through the app's real chat, diff, and permission-approval UI, offline, in about 30 seconds.

**Step 1 — Start opencode on your machine**

```bash
# Install opencode (if you haven't already)
npm install -g opencode-ai

# Run opencode in server mode
OPENCODE_SERVER_PASSWORD=yourpassword opencode serve --hostname 0.0.0.0 --port 4096
```

**Step 2 — Install OpenCode Mobile** via [Google Play, F-Droid, or a direct APK](#install-android) (or build from source — see [CONTRIBUTING.md](CONTRIBUTING.md)).

**Step 3 — Add a connection in the app**

Open the app, tap **Add Connection**, and choose your connection type:

- **Local network** — your machine's LAN IP, e.g. `http://192.168.1.100:4096`
- **Tunnel** — a Cloudflare Tunnel or ngrok URL, e.g. `https://my-opencode.trycloudflare.com`
- **Tailscale** — your machine's Tailscale IP, e.g. `http://100.x.x.x:4096`
- **opencode Cloud** *(planned — not yet shipped)* — one-tap managed hosting, no server to run

Enter the password you set in Step 1, tap **Connect**, and you're in.

---

## How It Works

OpenCode Mobile is a thin client. It speaks the opencode HTTP + SSE API: listing sessions, sending messages, streaming responses, and subscribing to file-change events. All AI model calls are handled by your opencode server — you bring your own API keys (OpenAI, Anthropic, etc.) and the app never touches them. The app never proxies your code or conversation through our servers.

```
┌─────────────────────────────────────┐
│         OpenCode Mobile             │
│  (React Native / Expo, this repo)   │
└──────────────┬──────────────────────┘
               │  HTTP + SSE
               │  (local network / tunnel)
               ▼
┌─────────────────────────────────────┐
│       opencode server               │
│  (github.com/sst/opencode, MIT)     │
│  Running on your laptop / VPS       │
└──────────────┬──────────────────────┘
               │  API calls
               ▼
┌─────────────────────────────────────┐
│   Your AI provider                  │
│  (OpenAI / Anthropic / Gemini / …)  │
│  Your keys, your bill               │
└─────────────────────────────────────┘
```

---

## Project Status

**Current version: v0.4.7**

| Feature | Status |
|---|---|
| Offline demo mode | Stable |
| First-run onboarding clarity | Stable |
| Multi-connection management | Stable |
| Session list + creation | Stable |
| Streaming chat | Stable |
| Diff viewer | Stable |
| Biometric unlock | Stable |
| Tool call approval UI | Stable |
| Sentry crash reporting (opt-in) | Stable |
| Cloudflare / ngrok tunnel wizard | Beta |
| opencode Cloud one-tap connect | Planned |
| iPad / tablet layout | Planned |
| Offline session history | Planned |

---

## Supporters and Sponsors

OpenCode Mobile is built and maintained by [VIBE TECHNOLOGIES, LLC](https://agentlabs.cc/opencode). GitHub Sponsors help cover Sentry, EAS Build, and CI costs (~$60/month). The opencode Cloud hosted backend (planned, $10/mo) is the long-term revenue model.

If OpenCode Mobile saves you time, consider sponsoring:

**[github.com/sponsors/VibeTechnologies](https://github.com/sponsors/VibeTechnologies)**

| Tier | Price | Perk |
|---|---|---|
| Supporter | $5/mo | Your name in `SUPPORTERS.md` |
| Backer | $15/mo | Name + early access to opencode Cloud beta |
| Business | $50/mo | Logo on [agentlabs.cc/opencode](https://agentlabs.cc/opencode) + quarterly support call |

Questions or private support: [support@agentlabs.cc](mailto:support@agentlabs.cc)

---

## Roadmap

Tracked on the [GitHub Projects board](https://github.com/dzianisv/opencode-mobile/projects) and in the [open milestones](https://github.com/dzianisv/opencode-mobile/milestones).

Near-term priorities:
- opencode Cloud one-tap connect + managed hosting
- F-Droid mainline acceptance (FCM audit + reproducible build verification)
- Tunnel setup wizard (Cloudflare / ngrok / Tailscale)
- iPad / tablet layout
- Offline session history cache

---

## Contributing

We welcome bug reports, feature requests, and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up a dev environment and the contribution process.

---

## Privacy

OpenCode Mobile does not collect personal data. Optional Sentry crash reporting (opt-in, off by default) sends anonymised crash traces to Sentry. No analytics SDKs are bundled. Credentials are stored exclusively on-device in the OS keystore.

Full privacy policy: [dzianisv.github.io/opencode-mobile/privacy](https://dzianisv.github.io/opencode-mobile/privacy/)

---

## License

MIT — see [LICENSE](LICENSE).

Copyright (c) 2026 VIBE TECHNOLOGIES, LLC

---

## Acknowledgments

- [sst/opencode](https://github.com/sst/opencode) — the AI coding agent this app connects to (MIT)
- [Expo](https://expo.dev) — the React Native toolchain powering the app
- Every contributor who filed a bug, opened a PR, or starred the repo
