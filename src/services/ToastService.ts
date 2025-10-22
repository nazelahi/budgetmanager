import Toast from "react-native-toast-message";
import { colors, typography } from "../utils/theme";

export interface ToastConfig {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
  position?: "top" | "bottom";
  onPress?: () => void;
}

class ToastService {
  /**
   * Show a success toast notification
   */
  static success(title: string, message?: string, duration: number = 3000) {
    Toast.show({
      type: "success",
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: "bottom",
    });
  }

  /**
   * Show an error toast notification
   */
  static error(title: string, message?: string, duration: number = 4000) {
    Toast.show({
      type: "error",
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: "bottom",
    });
  }

  /**
   * Show an info toast notification
   */
  static info(title: string, message?: string, duration: number = 3000) {
    Toast.show({
      type: "info",
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: "bottom",
    });
  }

  /**
   * Show a warning toast notification
   */
  static warning(title: string, message?: string, duration: number = 3500) {
    Toast.show({
      type: "warning",
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: "bottom",
    });
  }

  /**
   * Show a custom toast notification
   */
  static show(config: ToastConfig) {
    Toast.show({
      type: config.type,
      text1: config.title,
      text2: config.message,
      visibilityTime: config.duration || 3000,
      position: config.position || "bottom",
      onPress: config.onPress,
    });
  }

  /**
   * Hide the current toast
   */
  static hide() {
    Toast.hide();
  }

  /**
   * Replace Alert.alert with toast for simple confirmations
   */
  static confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) {
    // For now, we'll show a toast with the message
    // In a more advanced implementation, you could create a custom modal
    this.info(title, message, 5000);

    // You might want to implement a custom confirmation modal here
    // For now, we'll just call onConfirm after a delay
    setTimeout(() => {
      onConfirm();
    }, 1000);
  }

  /**
   * Show a loading toast
   */
  static loading(title: string = "Loading...") {
    Toast.show({
      type: "info",
      text1: title,
      text2: "Please wait...",
      visibilityTime: 0, // Don't auto-hide
      position: "bottom",
    });
  }

  /**
   * Hide loading toast
   */
  static hideLoading() {
    Toast.hide();
  }
}

export default ToastService;
