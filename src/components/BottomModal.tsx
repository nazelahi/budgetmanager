import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, spacing } from "../utils/theme";

const { height: screenHeight } = Dimensions.get("window");

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCancelButton?: boolean;
  showSaveButton?: boolean;
  onSave?: () => void;
  saveButtonText?: string;
  saveButtonDisabled?: boolean;
  isLoading?: boolean;
  height?: number | string;
  maxHeight?: number | string;
}

const BottomModal: React.FC<BottomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCancelButton = true,
  showSaveButton = false,
  onSave,
  saveButtonText = "Save",
  saveButtonDisabled = false,
  isLoading = false,
  height = "90%",
  maxHeight = "95%",
}) => {
  // Animation values - set initial values based on visible prop
  const modalTranslateY = useSharedValue(visible ? 0 : screenHeight);
  const backdropOpacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      modalTranslateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const handleClose = () => {
    modalTranslateY.value = withTiming(screenHeight, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleSave = () => {
    if (onSave && !saveButtonDisabled && !isLoading) {
      onSave();
    }
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalBackdrop, animatedBackdropStyle]}>
        <Pressable
          style={styles.modalBackdropPressable}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            animatedModalStyle,
            { height: height as any, maxHeight: maxHeight as any },
          ]}
        >
          {/* Header with handle */}
          <View style={styles.modalHeader}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              {showCancelButton && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.headerActions}>
                {showSaveButton && (
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (saveButtonDisabled || isLoading) &&
                        styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={saveButtonDisabled || isLoading}
                  >
                    {isLoading ? (
                      <Ionicons
                        name="hourglass"
                        size={16}
                        color={colors.white}
                      />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.white}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>{children}</View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdropPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "90%",
    maxHeight: "95%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
});

export default BottomModal;
