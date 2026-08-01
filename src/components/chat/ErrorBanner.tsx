import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

interface Props {
  message: string
  isDark: boolean
  onRetry: () => void
  onDismiss: () => void
}

// Inline error card shown in the chat screen when the current run failed
// (free-limit, rate limit, server error, ...). Offers Try again (resends the
// last user prompt) and Dismiss instead of leaving the user stuck on a spinner.
export function ErrorBanner({ message, isDark, onRetry, onDismiss }: Props) {
  const { t } = useTranslation()

  return (
    <View style={[s.banner, isDark && s.bannerDark]}>
      <View style={s.header}>
        <Ionicons name="alert-circle-outline" size={18} color="#dc2626" />
        <Text style={[s.title, isDark && s.titleDark]}>{t("session.errors.title")}</Text>
      </View>
      <Text style={[s.message, isDark && s.messageDark]}>{message}</Text>
      <View style={s.actions}>
        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onRetry} activeOpacity={0.7}>
          <Text style={s.btnPrimaryText}>{t("session.errors.retry")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, isDark && s.btnDark]} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={[s.btnText, isDark && s.btnTextDark]}>{t("session.errors.dismiss")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fef2f2",
    borderTopWidth: 1,
    borderTopColor: "#fecaca",
  },
  bannerDark: { backgroundColor: "#2a1515", borderTopColor: "#4c1d1d" },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, fontWeight: "600", color: "#991b1b" },
  titleDark: { color: "#fca5a5" },
  message: { marginTop: 4, fontSize: 13, lineHeight: 18, color: "#7f1d1d" },
  messageDark: { color: "#fecaca" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  btnDark: { backgroundColor: "#1a1a2e", borderColor: "#2a2a2a" },
  btnPrimary: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  btnPrimaryText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  btnText: { fontSize: 13, fontWeight: "500", color: "#525252" },
  btnTextDark: { color: "#d4d4d4" },
})
