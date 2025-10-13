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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown, 
  SlideInLeft, 
  SlideInRight,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import StorageService from '../services/StorageService';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null; // Can be icon name or image URI
  avatarType: 'icon' | 'image'; // Type of avatar
  bio: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, profile: contextProfile, refreshProfile } = useApp();
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: '',
    email: '',
    phone: '',
    avatar: null,
    avatarType: 'icon',
    bio: '',
    location: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);



  const loadProfile = async () => {
    try {
      if (contextProfile) {
        setProfile(contextProfile);
      } else {
        // Fallback to loading from storage if context profile is not available
        const savedProfile = await StorageService.getProfile();
        if (savedProfile) {
          const profileWithType = {
            ...savedProfile,
            avatarType: savedProfile.avatarType || 'icon',
          };
          setProfile(profileWithType);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      await StorageService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleAvatarPress = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarSelect = (avatarType: string) => {
    setProfile(prev => ({
      ...prev,
      avatar: avatarType,
      avatarType: 'icon',
    }));
    setShowAvatarModal(false);
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload photos!');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setProfile(prev => ({
        ...prev,
        avatar: result.assets[0].uri,
        avatarType: 'image',
      }));
      setShowAvatarModal(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setProfile(prev => ({
        ...prev,
        avatar: result.assets[0].uri,
        avatarType: 'image',
      }));
      setShowAvatarModal(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const errors: {[key: string]: string} = {};

      // Validate email if provided
      if (profile.email && !validateEmail(profile.email)) {
        errors.email = 'Please enter a valid email address.';
      }

      // Validate phone if provided
      if (profile.phone && !validatePhone(profile.phone)) {
        errors.phone = 'Please enter a valid phone number.';
      }

      // If there are validation errors, show them and return
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setIsSaving(false);
        return;
      }

      // Clear validation errors
      setValidationErrors({});

      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      await StorageService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      await refreshProfile(); // Refresh context profile
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarOptions = [
    { id: 'avatar1', name: 'Avatar 1', icon: 'person-circle' },
    { id: 'avatar2', name: 'Avatar 2', icon: 'person-circle-outline' },
    { id: 'avatar3', name: 'Avatar 3', icon: 'happy-outline' },
    { id: 'avatar4', name: 'Avatar 4', icon: 'happy' },
    { id: 'avatar5', name: 'Avatar 5', icon: 'person-outline' },
    { id: 'avatar6', name: 'Avatar 6', icon: 'person' },
  ];

  const renderAvatarModal = () => (
    <Modal
      visible={showAvatarModal}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowAvatarModal(false)}
    >
      <Pressable 
        style={styles.modalBackdrop}
        onPress={() => setShowAvatarModal(false)}
      >
        <Animated.View 
          entering={SlideInUp.delay(100)}
          exiting={SlideOutDown}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={[colors.background, colors.backgroundSecondary]}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAvatarModal(false)}
              >
                <Ionicons name="close" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Photo Upload Options */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadSectionTitle}>Upload Photo</Text>
              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Icon Avatars */}
            <View style={styles.iconSection}>
              <Text style={styles.iconSectionTitle}>Choose Icon</Text>
              <View style={styles.avatarGrid}>
                {avatarOptions.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      profile.avatar === avatar.id && profile.avatarType === 'icon' && styles.selectedAvatar
                    ]}
                    onPress={() => handleAvatarSelect(avatar.id)}
                  >
                    <Ionicons 
                      name={avatar.icon as any} 
                      size={40} 
                      color={profile.avatar === avatar.id && profile.avatarType === 'icon' ? colors.white : colors.textSecondary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
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
            <Ionicons name="person" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Profile</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Alerts')}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.white} />
                {unreadAlertsCount > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>
                      {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
            <Animated.View entering={SlideInRight.delay(400)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => (navigation as any).navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Avatar Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            disabled={!isEditing}
          >
            <View style={styles.avatarPlaceholder}>
              {profile.avatarType === 'image' && profile.avatar ? (
                <Image 
                  source={{ uri: profile.avatar }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons 
                  name={profile.avatar ? avatarOptions.find(a => a.id === profile.avatar)?.icon as any || 'person' : 'person'} 
                  size={60} 
                  color={colors.primary} 
                />
              )}
            </View>
            {isEditing && (
              <View style={styles.editAvatarOverlay}>
                <Ionicons name="camera" size={20} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>
            {isEditing ? 'Tap to change avatar' : 'Profile Picture'}
          </Text>
        </Animated.View>

        {/* Profile Information */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.buttonContainer}>
              {isEditing && (
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                >
                  <Ionicons 
                    name="close" 
                    size={16} 
                    color={colors.error} 
                  />
                  <Text style={[styles.editButtonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.editButton, isSaving && styles.disabledButton]}
                onPress={isEditing ? handleSaveProfile : () => {
                  setIsEditing(true);
                  setValidationErrors({});
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Ionicons name="hourglass" size={16} color={colors.textSecondary} />
                ) : (
                  <Ionicons 
                    name={isEditing ? "checkmark" : "pencil"} 
                    size={16} 
                    color={colors.primary} 
                  />
                )}
                <Text style={[styles.editButtonText, isSaving && styles.disabledButtonText]}>
                  {isSaving ? 'Saving...' : (isEditing ? 'Save' : 'Edit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={profile.name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textTertiary}
              />
            ) : (
              <View style={styles.detailContainer}>
                <Text style={styles.detailText}>{profile.name || 'Not provided'}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.email && styles.errorInput
                  ]}
                  value={profile.email}
                  onChangeText={(text) => {
                    setProfile(prev => ({ ...prev, email: text }));
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </>
            ) : (
              <View style={styles.detailContainer}>
                <Text style={styles.detailText}>{profile.email || 'Not provided'}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.phone && styles.errorInput
                  ]}
                  value={profile.phone}
                  onChangeText={(text) => {
                    setProfile(prev => ({ ...prev, phone: text }));
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
                {validationErrors.phone && (
                  <Text style={styles.errorText}>{validationErrors.phone}</Text>
                )}
              </>
            ) : (
              <View style={styles.detailContainer}>
                <Text style={styles.detailText}>{profile.phone || 'Not provided'}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={profile.location}
                onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                placeholderTextColor={colors.textTertiary}
              />
            ) : (
              <View style={styles.detailContainer}>
                <Text style={styles.detailText}>{profile.location || 'Not provided'}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={profile.bio}
                onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            ) : (
              <View style={styles.detailContainer}>
                <Text style={styles.detailText}>{profile.bio || 'Not provided'}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Account Statistics */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          <View style={styles.statsGrid}>
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
            <View style={styles.statItem}>
              <Ionicons name="pie-chart" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{data?.budgets?.length || 0}</Text>
              <Text style={styles.statLabel}>Budgets</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {renderAvatarModal()}
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
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  alertBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    ...shadows.lg,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  editButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.error + '20',
  },
  cancelButtonText: {
    color: colors.error,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: colors.textSecondary + '20',
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoText: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  detailContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  errorInput: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  statsSection: {
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalGradient: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSection: {
    marginBottom: spacing.sm,
  },
  uploadSectionTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  uploadButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  iconSection: {
    marginBottom: spacing.sm,
  },
  iconSectionTitle: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
});

export default ProfileScreen;
