import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import SetupScreen from './src/screens/SetupScreen';
import ModernBackground from './src/components/ModernBackground';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/utils/theme';

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
      await completeSetup();
      setSetupCompleted(true);
    } catch (error) {
      console.error('Error completing setup:', error);
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
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent', true);
        StatusBar.setTranslucent(true);
      }
    } catch (error) {
      console.error('Error setting status bar:', error);
    }
  }, []);

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
