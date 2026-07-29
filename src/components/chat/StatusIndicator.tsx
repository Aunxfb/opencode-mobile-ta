import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { useTranslation } from "react-i18next"
import { useEvents, resyncSessionStatus } from "../../stores/events"
import { useSessions } from "../../stores/sessions"

const STALE_WARNING_MS = 300_000

interface Props {
  sessionID: string
  isDark: boolean
}

export function StatusIndicator({ sessionID, isDark }: Props) {
  const { t } = useTranslation()
  const status = useEvents((s) => s.sessionStatus[sessionID])
  const text = useEvents((s) => s.statusText[sessionID])
  const lastActivityAt = useEvents((s) => s.lastActivityAt[sessionID])
  const optimistic = useSessions((s) => s.sending[sessionID])

  const sseBusy = status && status.type !== "idle"
  const busy = sseBusy || (optimistic && !status)
  if (!busy) return null

  const isStale = status?.type === "busy" && lastActivityAt && Date.now() - lastActivityAt > STALE_WARNING_MS
  const isRetry = status?.type === "retry"

  const label = isRetry
    ? t("chat.statusIndicator.retrying", { attempt: status.attempt })
    : text || t("chat.statusIndicator.working")

  return (
    <TouchableOpacity
      style={[s.bar, isDark && s.barDark, isStale && s.barStale]}
      onPress={() => resyncSessionStatus(sessionID)}
      activeOpacity={0.7}
    >
      <ActivityIndicator size="small" color={isStale ? "#f59e0b" : "#8b5cf6"} />
      <Text style={[s.text, isDark && s.textDark, isStale && s.textStale]}>
        {label}{isStale ? t("chat.statusIndicator.stale") : ""}
      </Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f3ff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  barDark: { backgroundColor: "#1a1a2e", borderTopColor: "#2a2a2a" },
  barStale: { backgroundColor: "#fffbeb", borderTopColor: "#fde68a" },
  text: { fontSize: 13, color: "#6d28d9", fontWeight: "500" },
  textDark: { color: "#a78bfa" },
  textStale: { color: "#92400e" },
})
