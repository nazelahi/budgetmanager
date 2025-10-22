import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { StatusBar, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "./src/contexts/AppContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SetupScreen from "./src/screens/SetupScreen";
import ModernBackground from "./src/components/ModernBackground";
import ErrorBoundary from "./src/components/ErrorBoundary";
import Logger from "./src/services/Logger";
import BudgetAlerts from "./src/components/BudgetAlerts";
import ToastComponent from "./src/components/ToastComponent";
import { colors } from "./src/utils/theme";

// Main App Component that handles setup flow
const MainApp: React.FC = () => {
  const { isSetupComplete, loading, completeSetup } = useApp();
  const [setupCompleted, setSetupCompleted] = useState(false);

  // Watch for setup completion changes
  useEffect(() => {
    if (isSetupComplete) {
      setSetupCompleted(true);
    }
  }, [isSetupComplete]);

  const handleSetupComplete = async () => {
    try {
      Logger.info("Setup screen completed - calling completeSetup");
      await completeSetup();
      Logger.info("completeSetup finished - updating setupCompleted state");
      setSetupCompleted(true);
      Logger.info("Setup flow completed successfully");
    } catch (error) {
      Logger.error("Error completing setup", { error: String(error) });
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <ModernBackground variant="gradient">
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />
          </ModernBackground>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  if (!isSetupComplete && !setupCompleted) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <ModernBackground variant="gradient">
            <SetupScreen onComplete={handleSetupComplete} />
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />
          </ModernBackground>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <BudgetAlerts />
        <ToastComponent />
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default function App() {
  useEffect(() => {
    // Configure status bar for better visibility
    try {
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("transparent", true);
        StatusBar.setTranslucent(true);
      }
    } catch (error) {
      console.error("Error setting status bar:", error);
    }
  }, []);

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
