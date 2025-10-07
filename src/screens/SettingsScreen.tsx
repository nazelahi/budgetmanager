import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Header from '../components/Header';
import SettingsNavigationBar from '../components/SettingsNavigationBar';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { RootState } from '../store/store';
import { updateUser } from '../store/slices/userSlice';
import { SyncService } from '../services/syncService';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'about'>('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'USD',
  });

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(updateUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      currency: formData.currency,
    }));

    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currency: user?.currency || 'USD',
    });
    setIsEditing(false);
  };

  const handleExportData = async () => {
    try {
      await SyncService.exportData();
      Alert.alert('Success', 'Data exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
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
            // Implement account deletion logic
            Alert.alert('Account Deleted', 'Your account has been deleted');
          },
        },
      ]
    );
  };

  const renderProfileContent = () => (
    <>
      {/* Profile Section */}
      <Card style={styles.section}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons
              name={isEditing ? 'close' : 'pencil'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={styles.editForm}>
            <Input
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
              style={styles.input}
            />
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
              style={styles.input}
            />
            <View style={styles.editButtons}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                gradient="primary"
                style={styles.saveButton}
              />
            </View>
          </View>
        )}
      </Card>
    </>
  );

  const renderPreferencesContent = () => (
    <>
      {/* Currency Settings */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            // Handle currency selection
            Alert.alert('Currency', 'Currency selection coming soon');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="cash-outline" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Currency</Text>
              <Text style={styles.settingSubtitle}>
                {currencies.find(c => c.code === user?.currency)?.name || 'US Dollar'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>

      {/* Theme Settings */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert('Theme', 'Theme selection coming soon');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Theme</Text>
              <Text style={styles.settingSubtitle}>Light Mode</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>

      {/* Notifications */}
      <Card style={styles.section}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert('Notifications', 'Notification settings coming soon');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage your notifications</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>
    </>
  );

  const renderSecurityContent = () => (
    <>
      {/* Data Management */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleExportData}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="download-outline" size={24} color={colors.success} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Export Data</Text>
              <Text style={styles.settingSubtitle}>Download your data as CSV</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert('Import Data', 'Import functionality coming soon');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="cloud-upload-outline" size={24} color={colors.info} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Import Data</Text>
              <Text style={styles.settingSubtitle}>Upload CSV file</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>

      {/* Account Actions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleDeleteAccount}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>Delete Account</Text>
              <Text style={styles.settingSubtitle}>Permanently delete your account</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>
    </>
  );

  const renderAboutContent = () => (
    <>
      {/* App Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2024.01.01</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Developer</Text>
          <Text style={styles.infoValue}>Budget Manager Team</Text>
        </View>
      </Card>

      {/* Support */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Help Center</Text>
              <Text style={styles.settingSubtitle}>Get help and support</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="mail-outline" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Contact Us</Text>
              <Text style={styles.settingSubtitle}>Send us feedback</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="star-outline" size={24} color={colors.warning} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Rate App</Text>
              <Text style={styles.settingSubtitle}>Rate us on the App Store</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </Card>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Header
        title="Settings"
        subtitle="Manage your account and preferences"
        variant="gradient"
      />
      
      {/* Navigation Bar */}
      <SettingsNavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Render content based on active tab */}
        {activeTab === 'profile' && renderProfileContent()}
        {activeTab === 'preferences' && renderPreferencesContent()}
        {activeTab === 'security' && renderSecurityContent()}
        {activeTab === 'about' && renderAboutContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for floating navigation
  },
  section: {
    margin: spacing.md,
    marginBottom: 0,
  },
  sectionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: typography.fontWeight.semibold,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.textStyles.headline4,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.textStyles.body2,
    color: colors.textSecondary,
  },
  editButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  editForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    marginBottom: spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...typography.textStyles.body1,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    ...typography.textStyles.body2,
    color: colors.textSecondary,
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  appVersion: {
    ...typography.textStyles.body2,
    color: colors.textSecondary,
  },
  appCopyright: {
    ...typography.textStyles.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  
  // New styles for tab-based content
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default SettingsScreen;