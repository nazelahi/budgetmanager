type LogLevel = "debug" | "info" | "warn" | "error";
let Updates: any = null;
let Constants: any = null;
try {
  // Lazy require to avoid bundling issues in non-Expo environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Updates = require("expo-updates");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Constants = require("expo-constants").default;
} catch (_) {
  // no-op if expo modules aren't available
}

interface LogContext {
  [key: string]: unknown;
}

class LoggerService {
  private privacyModeEnabled = false;
  private enabled = (typeof __DEV__ !== "undefined" ? __DEV__ : true);

  constructor() {
    const channel: string | undefined = Updates?.channel;
    const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra;
    const extraEnabled = Boolean(extra?.loggingEnabled);
    // Enable logging if dev, or extra flag enabled, or non-production channel
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      this.enabled = true;
    } else if (extraEnabled) {
      this.enabled = true;
    } else if (channel && channel !== "production") {
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  setPrivacyMode(enabled: boolean) {
    this.privacyModeEnabled = enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private mask(value: unknown): unknown {
    if (!this.privacyModeEnabled) return value;
    if (value == null) return value;
    if (typeof value === "number") return "***"; // mask amounts
    if (typeof value === "string") {
      if (value.length <= 3) return "***";
      // mask all but first and last char to keep some shape
      return `${value[0]}***${value[value.length - 1]}`;
    }
    if (Array.isArray(value)) return value.map((v) => this.mask(v));
    if (typeof value === "object") {
      const masked: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        // Common sensitive fields to mask
        if ([
          "amount",
          "description",
          "email",
          "phone",
          "categoryName",
          "category",
          "name",
        ].includes(k)) {
          masked[k] = this.mask(v);
        } else {
          masked[k] = v;
        }
      }
      return masked;
    }
    return value;
  }

  private emit(level: LogLevel, message: string, context?: LogContext) {
    if (!this.enabled) return;
    const payload = context ? this.mask(context) : undefined;
    const entry = {
      level,
      message,
      context: payload,
      timestamp: new Date().toISOString(),
    };
    // Use console.* as transport; could be swapped for file/remote later
    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(entry);
        break;
      case "info":
        // eslint-disable-next-line no-console
        console.info(entry);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(entry);
        break;
      case "error":
        // eslint-disable-next-line no-console
        console.error(entry);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.emit("debug", message, context);
  }
  info(message: string, context?: LogContext) {
    this.emit("info", message, context);
  }
  warn(message: string, context?: LogContext) {
    this.emit("warn", message, context);
  }
  error(message: string, context?: LogContext) {
    this.emit("error", message, context);
  }
}

const Logger = new LoggerService();
export default Logger;


