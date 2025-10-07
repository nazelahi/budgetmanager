import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricAuthSettings {
  enabled: boolean;
  requireOnAppOpen: boolean;
  requireForTransactions: boolean;
  requireForSensitiveData: boolean;
  fallbackToPasscode: boolean;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  availableTypes: LocalAuthentication.AuthenticationType[];
}

class BiometricAuthService {
  private static instance: BiometricAuthService;
  private settings: BiometricAuthSettings = {
    enabled: false,
    requireOnAppOpen: false,
    requireForTransactions: false,
    requireForSensitiveData: true,
    fallbackToPasscode: true,
  };

  private constructor() {}

  public static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  // Initialize biometric authentication
  async initialize(): Promise<boolean> {
    try {
      // Load saved settings
      await this.loadSettings();
      
      // Check if biometric authentication is available
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.hasHardware) {
        console.log('Biometric authentication not available on this device');
        return false;
      }

      if (!capabilities.isEnrolled) {
        console.log('No biometric data enrolled on this device');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing biometric authentication:', error);
      return false;
    }
  }

  // Get biometric capabilities
  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const availableTypes = await LocalAuthentication.availableAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        availableTypes,
      };
    } catch (error) {
      console.error('Error getting biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        availableTypes: [],
      };
    }
  }

  // Authenticate with biometrics
  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      if (!this.settings.enabled) {
        return true; // Biometric auth is disabled, allow access
      }

      const capabilities = await this.getCapabilities();
      
      if (!capabilities.hasHardware || !capabilities.isEnrolled) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Biometric authentication is not available on this device or no biometric data is enrolled.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: this.settings.fallbackToPasscode ? 'Use Passcode' : undefined,
        disableDeviceFallback: !this.settings.fallbackToPasscode,
      });

      if (result.success) {
        return true;
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled authentication
          return false;
        } else if (result.error === 'not_available') {
          Alert.alert(
            'Authentication Error',
            'Biometric authentication is not available. Please try again.',
            [{ text: 'OK' }]
          );
        } else if (result.error === 'not_enrolled') {
          Alert.alert(
            'Authentication Error',
            'No biometric data is enrolled. Please set up biometric authentication in your device settings.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication failed. Please try again.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  // Check if authentication is required for a specific action
  isAuthenticationRequired(action: 'app_open' | 'transaction' | 'sensitive_data'): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    switch (action) {
      case 'app_open':
        return this.settings.requireOnAppOpen;
      case 'transaction':
        return this.settings.requireForTransactions;
      case 'sensitive_data':
        return this.settings.requireForSensitiveData;
      default:
        return false;
    }
  }

  // Authenticate for app opening
  async authenticateForAppOpen(): Promise<boolean> {
    if (!this.isAuthenticationRequired('app_open')) {
      return true;
    }

    return await this.authenticate('Unlock Budget Manager');
  }

  // Authenticate for transactions
  async authenticateForTransaction(): Promise<boolean> {
    if (!this.isAuthenticationRequired('transaction')) {
      return true;
    }

    return await this.authenticate('Authenticate to add transaction');
  }

  // Authenticate for sensitive data access
  async authenticateForSensitiveData(): Promise<boolean> {
    if (!this.isAuthenticationRequired('sensitive_data')) {
      return true;
    }

    return await this.authenticate('Authenticate to access sensitive data');
  }

  // Update biometric settings
  async updateSettings(newSettings: Partial<BiometricAuthSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  // Get current settings
  getSettings(): BiometricAuthSettings {
    return { ...this.settings };
  }

  // Enable biometric authentication
  async enableBiometricAuth(): Promise<boolean> {
    try {
      // First check if biometric authentication is available
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.hasHardware) {
        Alert.alert(
          'Not Supported',
          'Biometric authentication is not supported on this device.',
          [{ text: 'OK' }]
        );
        return false;
      }

      if (!capabilities.isEnrolled) {
        Alert.alert(
          'Not Set Up',
          'Please set up biometric authentication in your device settings first.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Test authentication before enabling
      const testResult = await this.authenticate('Enable biometric authentication');
      
      if (testResult) {
        await this.updateSettings({ enabled: true });
        Alert.alert(
          'Biometric Authentication Enabled',
          'Biometric authentication has been enabled successfully.',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      Alert.alert(
        'Error',
        'Failed to enable biometric authentication. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  // Disable biometric authentication
  async disableBiometricAuth(): Promise<void> {
    await this.updateSettings({ enabled: false });
    Alert.alert(
      'Biometric Authentication Disabled',
      'Biometric authentication has been disabled.',
      [{ text: 'OK' }]
    );
  }

  // Check if biometric authentication is enabled
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  // Get available authentication types
  getAvailableAuthTypes(): string[] {
    // This would be populated from getCapabilities()
    return ['fingerprint', 'facial_recognition', 'iris_scan'];
  }

  // Private methods
  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem('biometric_auth_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_auth_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  }

  // Reset all settings
  async resetSettings(): Promise<void> {
    this.settings = {
      enabled: false,
      requireOnAppOpen: false,
      requireForTransactions: false,
      requireForSensitiveData: true,
      fallbackToPasscode: true,
    };
    await this.saveSettings();
  }

  // Get authentication status
  async getAuthenticationStatus(): Promise<{
    isEnabled: boolean;
    isAvailable: boolean;
    isEnrolled: boolean;
    capabilities: BiometricCapabilities;
  }> {
    const capabilities = await this.getCapabilities();
    
    return {
      isEnabled: this.settings.enabled,
      isAvailable: capabilities.hasHardware,
      isEnrolled: capabilities.isEnrolled,
      capabilities,
    };
  }
}

export default BiometricAuthService;
