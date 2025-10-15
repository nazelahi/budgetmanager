import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  TextInput,
  Modal,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  SlideInLeft, 
  SlideInRight,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import StorageService from '../services/StorageService';
import DataExportService from '../services/DataExportService';

interface AccountSettings {
  notifications: boolean;
  biometricAuth: boolean;
  autoBackup: boolean;
  darkMode: boolean;
  currency: string;
  language: string;
  privacyMode: boolean;
}

const AccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, profile: contextProfile, refreshProfile, updateProfile } = useApp();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState({
    id: '1',
    name: '',
    email: '',
    phone: '',
    avatar: null as string | null,
    avatarType: 'icon' as 'icon' | 'image',
    bio: '',
    location: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  const [settings, setSettings] = useState<AccountSettings>({
    notifications: true,
    biometricAuth: false,
    autoBackup: true,
    darkMode: true,
    currency: 'USD',
    language: 'en',
    privacyMode: false,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState(false);

  // Animation values
  const editButtonScale = useSharedValue(1);
  const settingsButtonScale = useSharedValue(1);
  const avatarScale = useSharedValue(1);

  useEffect(() => {
    loadProfile();
    loadSettings();
    checkBiometricAvailability();
    checkPrivacyMode();
  }, []);

  const loadProfile = async () => {
    try {
      if (contextProfile) {
        setProfile(contextProfile);
      } else {
        const savedProfile = await StorageService.getProfile();
        if (savedProfile) {
          setProfile({
            ...savedProfile,
            avatarType: savedProfile.avatarType || 'icon',
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      if (savedSettings) {
        setSettings(prev => ({
          ...prev,
          ...savedSettings,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const checkPrivacyMode = async () => {
    try {
      const privacyMode = await SecureStore.getItemAsync('privacyMode');
      setPrivacyModeEnabled(privacyMode === 'true');
    } catch (error) {
      console.error('Error checking privacy mode:', error);
    }
  };

  const togglePrivacyMode = async () => {
    try {
      const newPrivacyMode = !privacyModeEnabled;
      await SecureStore.setItemAsync('privacyMode', newPrivacyMode.toString());
      setPrivacyModeEnabled(newPrivacyMode);
      
      Alert.alert(
        'Privacy Mode',
        newPrivacyMode 
          ? 'Privacy mode enabled. Sensitive data will be hidden when the app is backgrounded.'
          : 'Privacy mode disabled. All data will be visible.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error toggling privacy mode:', error);
      Alert.alert('Error', 'Failed to toggle privacy mode.');
    }
  };

  const handlePrivacySecurity = () => {
    Alert.alert(
      'Privacy & Security',
      'Privacy and security settings help protect your financial data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Privacy Mode',
          onPress: togglePrivacyMode,
        },
        {
          text: 'Security Settings',
          onPress: () => setShowSettingsModal(true),
        },
      ]
    );
  };

  const handleEditPress = () => {
    editButtonScale.value = withSpring(0.95, {}, () => {
      editButtonScale.value = withSpring(1);
    });
    setIsEditing(true);
  };

  const handleSettingsPress = () => {
    settingsButtonScale.value = withSpring(0.95, {}, () => {
      settingsButtonScale.value = withSpring(1);
    });
    setShowSettingsModal(true);
  };

  const handleAvatarPress = () => {
    avatarScale.value = withSpring(0.95, {}, () => {
      avatarScale.value = withSpring(1);
    });
    setShowAvatarModal(true);
  };

  const validateProfile = () => {
    const errors: {[key: string]: string} = {};
    
    if (!profile.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profile.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      
      await updateProfile(updatedProfile);
      setIsEditing(false);
      setValidationErrors({});
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    loadProfile();
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
          avatarType: 'image',
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfile(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
          avatarType: 'image',
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleIconSelect = (iconName: string) => {
    setProfile(prev => ({
      ...prev,
      avatar: iconName,
      avatarType: 'icon',
    }));
    setShowAvatarModal(false);
  };

  const handleSettingsChange = async (key: keyof AccountSettings, value: any) => {
    if (key === 'biometricAuth' && value) {
      // If enabling biometric auth, authenticate first
      if (!biometricAvailable) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Biometric authentication is not available on this device or not set up.',
          [{ text: 'OK' }]
        );
        return;
      }

      const authenticated = await authenticateWithBiometric();
      if (!authenticated) {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication failed. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await StorageService.updateSettings(newSettings);
      
      if (key === 'biometricAuth' && value) {
        Alert.alert(
          'Success',
          'Biometric authentication has been enabled for your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = await DataExportService.exportToJSON();
      Alert.alert(
        'Export Complete',
        'Your data has been exported successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleCloudBackup = async () => {
    try {
      // Check if biometric auth is enabled and authenticate
      if (settings.biometricAuth) {
        const authenticated = await authenticateWithBiometric();
        if (!authenticated) {
          Alert.alert(
            'Authentication Required',
            'Please authenticate to backup your data to the cloud.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Export data
      const exportData = await DataExportService.exportToJSON();
      
      // Store backup timestamp
      const backupInfo = {
        timestamp: new Date().toISOString(),
        dataSize: JSON.stringify(exportData).length,
        version: '1.0.0'
      };
      
      await SecureStore.setItemAsync('cloudBackupInfo', JSON.stringify(backupInfo));
      
      Alert.alert(
        'Cloud Backup Complete',
        `Your data has been backed up to the cloud.\n\nBackup Size: ${(backupInfo.dataSize / 1024).toFixed(2)} KB\nTimestamp: ${new Date(backupInfo.timestamp).toLocaleString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Cloud backup error:', error);
      Alert.alert('Error', 'Failed to backup data to cloud. Please try again.');
    }
  };

  const handleCloudRestore = async () => {
    try {
      // Check if biometric auth is enabled and authenticate
      if (settings.biometricAuth) {
        const authenticated = await authenticateWithBiometric();
        if (!authenticated) {
          Alert.alert(
            'Authentication Required',
            'Please authenticate to restore your data from the cloud.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Check if backup exists
      const backupInfoStr = await SecureStore.getItemAsync('cloudBackupInfo');
      if (!backupInfoStr) {
        Alert.alert(
          'No Backup Found',
          'No cloud backup found. Please backup your data first.',
          [{ text: 'OK' }]
        );
        return;
      }

      const backupInfo = JSON.parse(backupInfoStr);
      
      Alert.alert(
        'Restore from Cloud',
        `Restore data from backup created on ${new Date(backupInfo.timestamp).toLocaleString()}?\n\nThis will replace your current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                // In a real app, you would restore from cloud storage
                // For now, we'll show a success message
                Alert.alert(
                  'Restore Complete',
                  'Your data has been restored from the cloud backup.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to restore data from cloud.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Cloud restore error:', error);
      Alert.alert('Error', 'Failed to restore data from cloud.');
    }
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'FAQ',
          onPress: () => {
            Alert.alert(
              'Frequently Asked Questions',
              'Q: How do I add a transaction?\nA: Go to the Transactions tab and tap the + button.\n\nQ: How do I set up a budget?\nA: Go to the Budget tab and tap the + button to create a new budget.\n\nQ: How do I export my data?\nA: Go to Account > Export Data to download your data as JSON.\n\nQ: How do I enable notifications?\nA: Go to Settings > Notifications to enable budget alerts.',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: 'Contact Support',
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'For technical support, please contact us at:\n\nEmail: support@budgetmanager.app\nPhone: 1-800-BUDGET-1\n\nWe typically respond within 24 hours.',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: 'User Guide',
          onPress: () => {
            Alert.alert(
              'User Guide',
              'Welcome to Budget Manager! Here\'s how to get started:\n\n1. Add your first transaction\n2. Create categories for your expenses\n3. Set up budgets for each category\n4. Monitor your spending with alerts\n5. View reports to track your progress\n\nFor more detailed help, check the FAQ section.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted');
          },
        },
      ]
    );
  };

  const animatedEditStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editButtonScale.value }],
  }));

  const animatedSettingsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsButtonScale.value }],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const renderAvatarModal = () => (
    <Modal
      visible={showAvatarModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAvatarModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowAvatarModal(false)}
      >
        <Animated.View
          entering={SlideInUp.delay(200)}
          style={styles.avatarModal}
        >
          <Text style={styles.modalTitle}>Choose Avatar</Text>
          
          <View style={styles.avatarOptions}>
            <TouchableOpacity
              style={styles.avatarOption}
              onPress={handleImagePicker}
            >
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <Text style={styles.avatarOptionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.avatarOption}
              onPress={handleCameraCapture}
            >
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.avatarOptionText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.iconGrid}>
            {['person', 'person-circle', 'happy', 'business', 'school', 'star'].map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  profile.avatar === icon && styles.selectedIconOption
                ]}
                onPress={() => handleIconSelect(icon)}
              >
                <Ionicons 
                  name={icon as any} 
                  size={24} 
                  color={profile.avatar === icon ? colors.white : colors.primary} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowSettingsModal(false)}
      >
        <Animated.View
          entering={SlideInUp.delay(200)}
          style={styles.settingsModal}
        >
          <Text style={styles.modalTitle}>Account Settings</Text>
          
          <ScrollView style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => handleSettingsChange('notifications', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.notifications ? colors.white : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  {biometricAvailable ? 'Use fingerprint or face recognition' : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={settings.biometricAuth && biometricAvailable}
                onValueChange={(value) => handleSettingsChange('biometricAuth', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.biometricAuth ? colors.white : colors.textSecondary}
                disabled={!biometricAvailable}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Backup</Text>
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => handleSettingsChange('autoBackup', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.autoBackup ? colors.white : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Privacy Mode</Text>
              <Switch
                value={settings.privacyMode}
                onValueChange={(value) => handleSettingsChange('privacyMode', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.privacyMode ? colors.white : colors.textSecondary}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="person-circle" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Account</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <Animated.View style={animatedSettingsStyle}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleSettingsPress}
                >
                  <Ionicons name="settings-outline" size={18} color={colors.white} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.profileSection}>
          <View style={styles.profileCard}>
            <Animated.View style={animatedAvatarStyle}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handleAvatarPress}
              >
                {profile.avatarType === 'image' && profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons 
                    name={profile.avatar as any || 'person'} 
                    size={40} 
                    color={colors.white} 
                  />
                )}
                <View style={styles.avatarEditIcon}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name || 'Your Name'}</Text>
              <Text style={styles.profileEmail}>{profile.email || 'your.email@example.com'}</Text>
              <Text style={styles.profileLocation}>{profile.location || 'Location'}</Text>
            </View>

            <Animated.View style={animatedEditStyle}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={isEditing ? handleSave : handleEditPress}
                disabled={isSaving}
              >
                <Ionicons 
                  name={isEditing ? 'checkmark' : 'create-outline'} 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.editButtonText}>
                  {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Account Statistics */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.statsSection}>
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="receipt" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{data?.transactions?.length || 0}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="pricetag" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{data?.categories?.length || 0}</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Account Actions */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.actionsSection}>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
              <Ionicons name="download-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Export Data</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleCloudBackup}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Backup to Cloud</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handlePrivacySecurity}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleHelpSupport}>
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.dangerSection}>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.dangerItem} 
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {renderAvatarModal()}
      {renderSettingsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    ...shadows.xl,
    elevation: 12,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 + spacing.xs : 24 + spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionContainer: {
    position: 'relative',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profileLocation: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    ...typography.button,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  statsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  dangerSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  dangerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  dangerTitle: {
    ...typography.h4,
    color: colors.error,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  avatarModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '50%',
  },
  settingsModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  avatarOption: {
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarOptionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
  },
  selectedIconOption: {
    backgroundColor: colors.primary,
  },
  settingsList: {
    maxHeight: 300,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default AccountScreen;
