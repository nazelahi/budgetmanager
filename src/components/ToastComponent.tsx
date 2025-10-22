import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../utils/theme";

interface ToastProps {
  text1?: string;
  text2?: string;
  type?: "success" | "error" | "info" | "warning";
  onPress?: () => void;
}

const CustomToast = (props: ToastProps) => {
  const { text1, text2, type = "info", onPress } = props;

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      case "info":
      default:
        return "information-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return colors.success;
      case "error":
        return colors.error;
      case "warning":
        return colors.warning;
      case "info":
      default:
        return colors.primary;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return colors.success + "33";
      case "error":
        return colors.error + "33";
      case "warning":
        return colors.warning + "33";
      case "info":
      default:
        return colors.primary + "33";
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        shadows.md,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons
          name={getIconName() as any}
          size={18}
          color={getIconColor()}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          {text1 && (
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {text1}
            </Text>
          )}
          {text2 && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
  warning: (props: any) => <CustomToast {...props} type="warning" />,
};

const ToastComponent: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Toast
      config={toastConfig}
      bottomOffset={Math.max(insets.bottom + 72, 64)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: "700",
    marginBottom: 0,
  },
  message: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
});

export default ToastComponent;
