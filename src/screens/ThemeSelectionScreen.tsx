import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser } from '../store/slices/userSlice';

const themes = [
  {
    id: 'light',
    name: 'Light Theme',
    description: 'Clean and bright interface',
    icon: 'sunny',
    gradient: ['#ffffff', '#f8fafc'],
    textColor: '#1f2937',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Easy on the eyes in low light',
    icon: 'moon',
    gradient: ['#1f2937', '#111827'],
    textColor: '#f9fafb',
    isDark: true,
  },
  {
    id: 'auto',
    name: 'Auto Theme',
    description: 'Follows system settings',
    icon: 'phone-portrait',
    gradient: ['#6366f1', '#8b5cf6'],
    textColor: '#ffffff',
    isDark: false,
  },
];

const ThemeSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(user?.theme as 'light' | 'dark' | 'auto' || 'light');

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId as 'light' | 'dark' | 'auto');
  };

  const handleSave = () => {
    if (user) {
      dispatch(updateUser({
        ...user,
        theme: selectedTheme,
      }));
      Alert.alert('Success', 'Theme updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const renderThemeItem = (theme: typeof themes[0]) => {
    const isSelected = selectedTheme === theme.id;
    
    return (
      <TouchableOpacity
        key={theme.id}
        onPress={() => handleThemeSelect(theme.id)}
        style={styles.themeItem}
      >
        <Card style={StyleSheet.flatten([
          styles.themeCard,
          isSelected && styles.selectedThemeCard
        ])}>
          <View style={styles.themeContent}>
            <View style={styles.themeLeft}>
              <View style={[
                styles.themeIconContainer,
                { backgroundColor: isSelected ? colors.primary + '20' : colors.gray100 }
              ]}>
                <Ionicons 
                  name={theme.icon as any} 
                  size={24} 
                  color={isSelected ? colors.primary : colors.gray600} 
                />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[
                  styles.themeName,
                  isSelected && styles.selectedText
                ]}>
                  {theme.name}
                </Text>
                <Text style={[
                  styles.themeDescription,
                  isSelected && styles.selectedTextSecondary
                ]}>
                  {theme.description}
                </Text>
              </View>
            </View>
            <View style={styles.themeRight}>
              {isSelected && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              )}
            </View>
          </View>
          
          {/* Theme Preview */}
          <View style={styles.themePreview}>
            <LinearGradient
              colors={theme.gradient as [string, string]}
              style={styles.previewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <View style={[styles.previewDot, { backgroundColor: theme.textColor + '40' }]} />
                  <View style={[styles.previewDot, { backgroundColor: theme.textColor + '40' }]} />
                  <View style={[styles.previewDot, { backgroundColor: theme.textColor + '40' }]} />
                </View>
                <View style={styles.previewBody}>
                  <View style={[styles.previewLine, { backgroundColor: theme.textColor + '60', width: '80%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: theme.textColor + '40', width: '60%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: theme.textColor + '40', width: '70%' }]} />
                </View>
              </View>
            </LinearGradient>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Select Theme"
        subtitle="Choose your preferred appearance"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Themes</Text>
          <Text style={styles.sectionSubtitle}>
            Select the theme that best suits your preferences and usage environment.
          </Text>
        </View>

        <View style={styles.themesList}>
          {themes.map(renderThemeItem)}
        </View>

        <View style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Theme Information</Text>
                <Text style={styles.infoDescription}>
                  • Light theme is ideal for daytime use and bright environments{'\n'}
                  • Dark theme reduces eye strain in low light conditions{'\n'}
                  • Auto theme automatically switches based on your system settings
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Theme</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100, // Space for footer button
  },
  section: {
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['4'],
  },
  sectionTitle: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['2'],
  },
  sectionSubtitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  themesList: {
    paddingHorizontal: spacing['4'],
  },
  themeItem: {
    marginBottom: spacing['3'],
  },
  themeCard: {
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedThemeCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['3'],
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['0.5'],
  },
  themeDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
  },
  themeRight: {
    alignItems: 'center',
  },
  selectedText: {
    color: colors.primary,
  },
  selectedTextSecondary: {
    color: colors.primary + 'CC',
  },
  themePreview: {
    marginTop: spacing['2'],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  previewGradient: {
    padding: spacing['3'],
    minHeight: 80,
  },
  previewContent: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    marginBottom: spacing['3'],
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing['2'],
  },
  previewBody: {
    flex: 1,
    justifyContent: 'space-around',
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
    marginBottom: spacing['1'],
  },
  infoCard: {
    padding: spacing['4'],
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
    borderWidth: 1,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: spacing['3'],
  },
  infoTitle: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['1'],
  },
  infoDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing['4'],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing['4'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  saveButtonText: {
    ...typography.textStyles.bodyLarge,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ThemeSelectionScreen;
