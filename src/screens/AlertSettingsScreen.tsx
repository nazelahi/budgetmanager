import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
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
} from "../utils/theme";
import { AlertSettings } from "../types";
import BudgetService from "../services/BudgetService";
import ToastService from "../services/ToastService";

const { width: screenWidth } = Dimensions.get("window");

const AlertSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { refreshData } = useApp();

  const [settings, setSettings] = useState<AlertSettings>({
    warningThresholds: [70, 80, 90],
    enablePushNotifications: true,
    enableEmailNotifications: false,
    quietHours: { enabled: true, start: "22:00", end: "08:00" },
    alertFrequency: "immediate",
    smartSuggestions: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const alertSettings = await BudgetService.getAlertSettings();
      setSettings(alertSettings);
    } catch (error) {
      console.error("Error loading alert settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AlertSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await BudgetService.updateAlertSettings(newSettings);
      await refreshData();
      ToastService.success(
        "Alert Settings Updated",
        "Your alert preferences have been saved.",
      );
    } catch (error) {
      console.error("Error updating alert settings:", error);
      ToastService.error(
        "Error",
        "Failed to update settings. Please try again.",
      );
    }
  };

  const handleThresholdChange = (threshold: number, enabled: boolean) => {
    let newThresholds = [...settings.warningThresholds];

    if (enabled) {
      if (!newThresholds.includes(threshold)) {
        newThresholds.push(threshold);
        newThresholds.sort((a, b) => a - b);
      }
    } else {
      newThresholds = newThresholds.filter((t) => t !== threshold);
    }

    updateSettings({ warningThresholds: newThresholds });
  };

  const handleQuietHoursChange = (
    field: "enabled" | "start" | "end",
    value: any,
  ) => {
    updateSettings({
      quietHours: { ...settings.quietHours, [field]: value },
    });
  };

  const handleFrequencyChange = (
    frequency: "immediate" | "daily" | "weekly",
  ) => {
    updateSettings({ alertFrequency: frequency });
  };

  const thresholdOptions = [50, 60, 70, 80, 90, 95];
  const frequencyOptions = [
    {
      value: "immediate",
      label: "Immediate",
      description: "Get alerts as soon as thresholds are reached",
    },
    {
      value: "daily",
      label: "Daily Summary",
      description: "Receive a daily summary of budget alerts",
    },
    {
      value: "weekly",
      label: "Weekly Summary",
      description: "Receive a weekly summary of budget alerts",
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Alert Settings</Text>
        </Animated.View>
        <Animated.View
          entering={SlideInRight.delay(300)}
          style={styles.headerActionContainer}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Thresholds */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Warning Thresholds</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose when you want to receive budget warnings
          </Text>
          <View style={styles.thresholdGrid}>
            {thresholdOptions.map((threshold) => (
              <TouchableOpacity
                key={threshold}
                style={[
                  styles.thresholdButton,
                  settings.warningThresholds.includes(threshold) &&
                    styles.thresholdButtonActive,
                ]}
                onPress={() =>
                  handleThresholdChange(
                    threshold,
                    !settings.warningThresholds.includes(threshold),
                  )
                }
              >
                <Text
                  style={[
                    styles.thresholdText,
                    settings.warningThresholds.includes(threshold) &&
                      styles.thresholdTextActive,
                  ]}
                >
                  {threshold}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts on your device
              </Text>
            </View>
            <Switch
              value={settings.enablePushNotifications}
              onValueChange={(value) =>
                updateSettings({ enablePushNotifications: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                settings.enablePushNotifications
                  ? colors.white
                  : colors.textSecondary
              }
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts via email
              </Text>
            </View>
            <Switch
              value={settings.enableEmailNotifications}
              onValueChange={(value) =>
                updateSettings({ enableEmailNotifications: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                settings.enableEmailNotifications
                  ? colors.white
                  : colors.textSecondary
              }
            />
          </View>
        </Animated.View>

        {/* Alert Frequency */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Alert Frequency</Text>
          </View>
          <Text style={styles.sectionDescription}>
            How often you want to receive budget alerts
          </Text>
          {frequencyOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.frequencyOption,
                settings.alertFrequency === option.value &&
                  styles.frequencyOptionActive,
              ]}
              onPress={() => handleFrequencyChange(option.value as any)}
            >
              <View style={styles.frequencyInfo}>
                <Text
                  style={[
                    styles.frequencyTitle,
                    settings.alertFrequency === option.value &&
                      styles.frequencyTitleActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.frequencyDescription,
                    settings.alertFrequency === option.value &&
                      styles.frequencyDescriptionActive,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              {settings.alertFrequency === option.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Quiet Hours */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="moon" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Don't receive alerts during these hours
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                Pause notifications during specified hours
              </Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={(value) =>
                handleQuietHoursChange("enabled", value)
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                settings.quietHours.enabled
                  ? colors.white
                  : colors.textSecondary
              }
            />
          </View>

          {settings.quietHours.enabled && (
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>
                    {settings.quietHours.start}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TouchableOpacity style={styles.timeButton}>
                  <Text style={styles.timeText}>{settings.quietHours.end}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Smart Suggestions */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Smart Suggestions</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Get personalized recommendations for better budget management
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Smart Suggestions</Text>
              <Text style={styles.settingDescription}>
                Receive AI-powered budget advice and tips
              </Text>
            </View>
            <Switch
              value={settings.smartSuggestions}
              onValueChange={(value) =>
                updateSettings({ smartSuggestions: value })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                settings.smartSuggestions ? colors.white : colors.textSecondary
              }
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
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
  headerActionContainer: {
    position: "relative",
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  thresholdGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  thresholdButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  thresholdButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  thresholdText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  thresholdTextActive: {
    color: colors.white,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: spacing.sm,
  },
  frequencyOptionActive: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  frequencyInfo: {
    flex: 1,
  },
  frequencyTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  frequencyTitleActive: {
    color: colors.primary,
  },
  frequencyDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  frequencyDescriptionActive: {
    color: colors.primary,
  },
  timeRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  timeText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});

export default AlertSettingsScreen;
