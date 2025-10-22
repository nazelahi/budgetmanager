import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  FadeIn,
} from "react-native-reanimated";
import { useApp } from "../contexts/AppContext";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  formatCurrencyAmount,
} from "../utils/theme";
import { BudgetAlert, AlertHistory, SmartSuggestion } from "../types";

const AlertsDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    getUnreadAlerts,
    getAlertHistory,
    getSmartSuggestions,
    markAlertAsRead,
    deleteSmartSuggestion,
    refreshData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "alerts" | "history" | "suggestions"
  >("alerts");
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case "alerts":
          const unreadAlerts = await getUnreadAlerts();
          setAlerts(unreadAlerts);
          break;
        case "history":
          const history = await getAlertHistory(30);
          setAlertHistory(history);
          break;
        case "suggestions":
          const smartSuggestions = await getSmartSuggestions();
          setSuggestions(smartSuggestions);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      await loadData();
      await refreshData();
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await deleteSmartSuggestion(suggestionId);
      await loadData();
      await refreshData();
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "warning";
      case "exceeded":
        return "alert-circle";
      case "achieved":
        return "checkmark-circle";
      default:
        return "information-circle";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return colors.warning || "#FFA500";
      case "exceeded":
        return colors.error;
      case "achieved":
        return colors.success || "#4CAF50";
      default:
        return colors.primary;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "reduce_spending":
        return "trending-down";
      case "increase_budget":
        return "trending-up";
      case "reallocate_funds":
        return "swap-horizontal";
      case "spending_pattern":
        return "analytics";
      default:
        return "bulb";
    }
  };

  const getSuggestionColor = (priority: string) => {
    switch (priority) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning || "#FFA500";
      case "low":
        return colors.success || "#4CAF50";
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderAlertItem = (alert: BudgetAlert, index: number) => {
    const alertColor = getAlertColor(alert.type);
    const alertIcon = getAlertIcon(alert.type);

    return (
      <Animated.View
        key={alert.id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.alertItem, { borderLeftColor: alertColor }]}
      >
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View
              style={[styles.alertIcon, { backgroundColor: alertColor + "20" }]}
            >
              <Ionicons name={alertIcon as any} size={20} color={alertColor} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>
                {alert.type === "warning"
                  ? "Budget Warning"
                  : alert.type === "exceeded"
                    ? "Budget Exceeded"
                    : "Budget Achievement"}
              </Text>
              <Text style={styles.alertCategory}>{alert.categoryName}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          </View>
          <View style={styles.alertRight}>
            <Text style={styles.alertTime}>{formatDate(alert.createdAt)}</Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleMarkAsRead(alert.id)}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderHistoryItem = (alert: AlertHistory, index: number) => {
    const alertColor = getAlertColor(alert.type);
    const alertIcon = getAlertIcon(alert.type);

    return (
      <Animated.View
        key={alert.id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.alertItem, { borderLeftColor: alertColor }]}
      >
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View
              style={[styles.alertIcon, { backgroundColor: alertColor + "20" }]}
            >
              <Ionicons name={alertIcon as any} size={20} color={alertColor} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>
                {alert.type === "warning"
                  ? "Budget Warning"
                  : alert.type === "exceeded"
                    ? "Budget Exceeded"
                    : "Budget Achievement"}
              </Text>
              <Text style={styles.alertCategory}>{alert.categoryName}</Text>
              <Text style={styles.alertDetails}>
                {alert.type === "exceeded"
                  ? `Exceeded by ${formatCurrencyAmount(alert.amount - alert.budgetAmount, "USD")}`
                  : `At ${alert.percentageUsed.toFixed(0)}% of budget`}
              </Text>
            </View>
          </View>
          <View style={styles.alertRight}>
            <Text style={styles.alertTime}>{formatDate(alert.createdAt)}</Text>
            <Text style={styles.alertAmount}>
              {formatCurrencyAmount(alert.amount, "USD")}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSuggestionItem = (suggestion: SmartSuggestion, index: number) => {
    const suggestionColor = getSuggestionColor(suggestion.priority);
    const suggestionIcon = getSuggestionIcon(suggestion.type);

    return (
      <Animated.View
        key={suggestion.id}
        entering={FadeInDown.delay(index * 100)}
        style={[styles.alertItem, { borderLeftColor: suggestionColor }]}
      >
        <View style={styles.alertContent}>
          <View style={styles.alertLeft}>
            <View
              style={[
                styles.alertIcon,
                { backgroundColor: suggestionColor + "20" },
              ]}
            >
              <Ionicons
                name={suggestionIcon as any}
                size={20}
                color={suggestionColor}
              />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{suggestion.title}</Text>
              <Text style={styles.alertCategory}>
                {suggestion.categoryName}
              </Text>
              <Text style={styles.alertMessage}>{suggestion.message}</Text>
            </View>
          </View>
          <View style={styles.alertRight}>
            <Text style={styles.alertTime}>
              {formatDate(suggestion.createdAt)}
            </Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismissSuggestion(suggestion.id)}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
      <Ionicons
        name={
          activeTab === "alerts"
            ? "notifications-off"
            : activeTab === "history"
              ? "time-outline"
              : "bulb-outline"
        }
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === "alerts"
          ? "No Active Alerts"
          : activeTab === "history"
            ? "No Alert History"
            : "No Smart Suggestions"}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === "alerts"
          ? "You're all caught up! No budget alerts at the moment."
          : activeTab === "history"
            ? "Your budget alert history will appear here."
            : "Smart suggestions will appear here based on your spending patterns."}
      </Text>
    </Animated.View>
  );

  const getTabData = () => {
    switch (activeTab) {
      case "alerts":
        return { data: alerts, count: alerts.length };
      case "history":
        return { data: alertHistory, count: alertHistory.length };
      case "suggestions":
        return { data: suggestions, count: suggestions.length };
      default:
        return { data: [], count: 0 };
    }
  };

  const { data, count } = getTabData();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1B263B", "#0D1B2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.xs }]}
      >
        <Animated.View
          entering={SlideInLeft.delay(200)}
          style={styles.headerTitleContainer}
        >
          <Ionicons
            name="notifications"
            size={18}
            color={colors.white}
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>All Alerts</Text>
        </Animated.View>
        <Animated.View
          entering={SlideInRight.delay(300)}
          style={styles.headerActions}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("AlertSettings")}
          >
            <Ionicons name="settings" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Tab Navigation */}
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.tabContainer}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
          onPress={() => setActiveTab("alerts")}
        >
          <Ionicons
            name="notifications"
            size={16}
            color={activeTab === "alerts" ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "alerts" && styles.activeTabText,
            ]}
          >
            Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time"
            size={16}
            color={
              activeTab === "history" ? colors.white : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            History ({alertHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "suggestions" && styles.activeTab]}
          onPress={() => setActiveTab("suggestions")}
        >
          <Ionicons
            name="bulb"
            size={16}
            color={
              activeTab === "suggestions" ? colors.white : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "suggestions" && styles.activeTabText,
            ]}
          >
            Suggestions ({suggestions.length})
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : data.length > 0 ? (
          data.map((item, index) => {
            if (activeTab === "alerts") {
              return renderAlertItem(item as BudgetAlert, index);
            } else if (activeTab === "history") {
              return renderHistoryItem(item as AlertHistory, index);
            } else {
              return renderSuggestionItem(item as SmartSuggestion, index);
            }
          })
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  alertItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  alertCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertMessage: {
    ...typography.caption,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  alertDetails: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  alertRight: {
    alignItems: "flex-end",
  },
  alertTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertAmount: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});

export default AlertsDashboardScreen;
