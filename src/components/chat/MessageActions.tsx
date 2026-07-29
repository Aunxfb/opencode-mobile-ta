import { useCallback, useMemo } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet"
import { useTranslation } from "react-i18next"

interface Action {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  color?: string
  destructive?: boolean
}

interface Props {
  sheetRef: React.RefObject<BottomSheet | null>
  isDark: boolean
  isUser: boolean
  messageText: string
  onAction: (action: string) => void
}

export function MessageActions({ sheetRef, isDark, isUser, messageText, onAction }: Props) {
  const { t } = useTranslation()

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = [
      { key: "copy", label: t("session.actions.copyMessage"), icon: "copy-outline" },
    ]
    if (isUser) {
      list.push({ key: "edit", label: t("session.actions.editMessage"), icon: "create-outline" })
    } else {
      list.push({ key: "regenerate", label: t("session.actions.regenerate"), icon: "refresh-outline" })
    }
    list.push({ key: "fork", label: t("session.actions.fork"), icon: "git-branch-outline" })
    list.push({
      key: "delete",
      label: t("common.delete"),
      icon: "trash-outline",
      color: "#ef4444",
      destructive: true,
    })
    return list
  }, [isUser, t])

  const handlePress = useCallback(
    (key: string) => {
      sheetRef.current?.close()
      onAction(key)
    },
    [sheetRef, onAction],
  )

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["20%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      backgroundStyle={isDark ? styles.sheetDark : styles.sheet}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#666666" : "#cccccc" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      )}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textWhite]}>{t("session.alerts.messageActionsTitle")}</Text>
      </View>
      <BottomSheetFlatList
        data={actions}
        keyExtractor={(item: Action) => item.key}
        renderItem={({ item }: { item: Action }) => (
          <TouchableOpacity
            style={[styles.row, isDark && styles.rowDark]}
            onPress={() => handlePress(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.color || (isDark ? "#ffffff" : "#0a0a0a")}
            />
            <Text
              style={[
                styles.label,
                item.destructive && styles.destructive,
                isDark && !item.destructive && styles.textWhite,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.content}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: "#ffffff" },
  sheetDark: { backgroundColor: "#1a1a1a" },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },
  textWhite: { color: "#ffffff" },
  content: { paddingBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDark: { backgroundColor: "#1a1a1a" },
  label: { fontSize: 15, color: "#0a0a0a" },
  destructive: { color: "#ef4444" },
})
