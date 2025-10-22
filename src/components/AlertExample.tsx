import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import ToastService from "../services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../contexts/AppContext";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from "../utils/theme";
import { BudgetAlert, AlertHistory, SmartSuggestion } from "../types";

/**
 * Example component showing how to get and display all types of alerts
 * This demonstrates the complete alert system usage
 */
const AlertExample: React.FC = () => {
  const {
    getUnreadAlerts,
    getAlertHistory,
    getSmartSuggestions,
    markAlertAsRead,
    deleteSmartSuggestion,
    refreshData,
  } = useApp();

  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all alert data
  const loadAllAlerts = async () => {
    try {
      setLoading(true);

      // Get all types of alerts in parallel
      const [unreadAlerts, history, smartSuggestions] = await Promise.all([
        getUnreadAlerts(), // Get current unread alerts
        getAlertHistory(30), // Get alert history for last 30 days
        getSmartSuggestions(), // Get smart suggestions
      ]);

      setAlerts(unreadAlerts);
      setAlertHistory(history);
      setSuggestions(smartSuggestions);

      console.log("📊 Alert Summary:");
      console.log(`- Unread Alerts: ${unreadAlerts.length}`);
      console.log(`- Alert History: ${history.length}`);
      console.log(`- Smart Suggestions: ${smartSuggestions.length}`);
    } catch (error) {
      console.error("Error loading alerts:", error);
      ToastService.error("Error", "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  // Load alerts when component mounts
  useEffect(() => {
    loadAllAlerts();
  }, []);

  // Handle marking alert as read
  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      await loadAllAlerts(); // Reload to update the list
      await refreshData(); // Refresh global data
      console.log("✅ Alert marked as read");
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  // Handle dismissing suggestion
  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      await deleteSmartSuggestion(suggestionId);
      await loadAllAlerts(); // Reload to update the list
      await refreshData(); // Refresh global data
      console.log("✅ Suggestion dismissed");
    } catch (error) {
      console.error("Error dismissing suggestion:", error);
    }
  };

  // Get alert color based on type
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

  // Get suggestion color based on priority
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alert System Example</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadAllAlerts}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Current Alerts ({alerts.length})
          </Text>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getAlertColor(alert.type) },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>
                    {alert.type.toUpperCase()}
                  </Text>
                  <TouchableOpacity onPress={() => handleMarkAsRead(alert.id)}>
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.alertCategory}>{alert.categoryName}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertDate}>
                  {formatDate(alert.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No current alerts</Text>
          )}
        </View>

        {/* Alert History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Alert History ({alertHistory.length})
          </Text>
          {alertHistory.length > 0 ? (
            alertHistory.slice(0, 5).map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getAlertColor(alert.type) },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>
                    {alert.type.toUpperCase()}
                  </Text>
                  <Text style={styles.alertAmount}>
                    ${alert.amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.alertCategory}>{alert.categoryName}</Text>
                <Text style={styles.alertDetails}>
                  {alert.percentageUsed.toFixed(0)}% of budget
                </Text>
                <Text style={styles.alertDate}>
                  {formatDate(alert.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No alert history</Text>
          )}
        </View>

        {/* Smart Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Smart Suggestions ({suggestions.length})
          </Text>
          {suggestions.length > 0 ? (
            suggestions.slice(0, 5).map((suggestion) => (
              <View
                key={suggestion.id}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getSuggestionColor(suggestion.priority) },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertType}>
                    {suggestion.priority.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDismissSuggestion(suggestion.id)}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.alertCategory}>{suggestion.title}</Text>
                <Text style={styles.alertMessage}>{suggestion.message}</Text>
                <Text style={styles.alertDate}>
                  {formatDate(suggestion.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No smart suggestions</Text>
          )}
        </View>

        {/* Usage Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use the Alert System</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              <Text style={styles.bold}>1. Get Unread Alerts:</Text>
              {"\n"}
              const alerts = await getUnreadAlerts();
            </Text>
            <Text style={styles.instructionText}>
              <Text style={styles.bold}>2. Get Alert History:</Text>
              {"\n"}
              const history = await getAlertHistory(30); // 30 days
            </Text>
            <Text style={styles.instructionText}>
              <Text style={styles.bold}>3. Get Smart Suggestions:</Text>
              {"\n"}
              const suggestions = await getSmartSuggestions();
            </Text>
            <Text style={styles.instructionText}>
              <Text style={styles.bold}>4. Mark Alert as Read:</Text>
              {"\n"}
              await markAlertAsRead(alertId);
            </Text>
            <Text style={styles.instructionText}>
              <Text style={styles.bold}>5. Dismiss Suggestion:</Text>
              {"\n"}
              await deleteSmartSuggestion(suggestionId);
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  refreshButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  alertType: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  alertAmount: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  alertCategory: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  alertMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertDetails: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  alertDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  instructionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  instructionText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontFamily: "monospace",
  },
  bold: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
});

export default AlertExample;
