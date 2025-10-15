import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { 
  FadeInDown, 
  SlideInLeft, 
  SlideInRight,
  BounceIn,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, typography, borderRadius, shadows, getCurrencySymbol } from '../utils/theme';
import StorageService from '../services/StorageService';
import BottomModal from '../components/BottomModal';

const { height: screenHeight } = Dimensions.get('window');

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, updateSettings, exportToJSON, exportToCSV, refreshData } = useApp();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

  useEffect(() => {
    if (showCurrencyPicker) {
      setSelectedCurrency(data.settings.currency);
    }
  }, [showCurrencyPicker]);


  const handleCloseModal = () => {
    setShowCurrencyPicker(false);
    setSearchQuery('');
    setSelectedCurrency('');
  };

  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', country: 'United States' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', country: 'European Union' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', country: 'United Kingdom' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', country: 'Canada' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', country: 'Switzerland' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', country: 'China' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', country: 'India' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', country: 'Brazil' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽', country: 'Mexico' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', country: 'South Korea' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', country: 'Singapore' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', country: 'New Zealand' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', country: 'Sweden' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', country: 'Norway' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰', country: 'Denmark' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺', country: 'Russia' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', country: 'South Africa' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', country: 'Turkey' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩', country: 'Bangladesh' },
  ];

  // Filter currencies based on search query
  const filteredCurrencies = currencyOptions.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleSaveCurrency = async () => {
    if (isUpdatingCurrency || selectedCurrency === data.settings.currency) {
      handleCloseModal();
      return;
    }
    
    try {
      setIsUpdatingCurrency(true);
      await updateSettings({ currency: selectedCurrency });
      handleCloseModal();
    } catch (error) {
      console.error('Currency update error:', error);
      Alert.alert('Error', 'Failed to update currency. Please try again.');
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const handleThemeToggle = async (theme: 'light' | 'dark') => {
    try {
      await updateSettings({ theme });
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme');
    }
  };

  const handleNotificationsToggle = async (notifications: boolean) => {
    try {
      await updateSettings({ notifications });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notifications');
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'This will restore data from a backup file. Current data will be merged with imported data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              // Pick a JSON file
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'text/json'],
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                
                // Read the file content
                const response = await fetch(file.uri);
                const fileContent = await response.text();
                
                // Parse and validate JSON
                let importedData;
                try {
                  importedData = JSON.parse(fileContent);
                } catch (parseError) {
                  Alert.alert('Error', 'Invalid JSON file format');
                  return;
                }

                // Validate the data structure
                if (!importedData || typeof importedData !== 'object') {
                  Alert.alert('Error', 'Invalid data format');
                  return;
                }

                // Merge with existing data
                const currentData = await StorageService.getData();
                const mergedData = {
                  ...currentData,
                  ...importedData,
                  // Preserve current settings and setup status
                  settings: currentData.settings,
                  isSetupComplete: currentData.isSetupComplete,
                };

                // Save merged data
                await StorageService.saveData(mergedData);
                await refreshData();

                Alert.alert(
                  'Success',
                  'Data imported successfully! The app will refresh to show your imported data.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Error', 'Failed to import data. Please check the file format and try again.');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your transactions, categories, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert(
                'Success', 
                'All data has been cleared. You will be redirected to setup.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      (navigation as any).navigate('Setup');
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        'Export Options',
        'Choose export format:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'JSON (Full Backup)',
            onPress: async () => {
              try {
                const jsonData = await exportToJSON();
                // In a real app, you'd use react-native-share to save/share the file
                Alert.alert(
                  'Export Complete',
                  `Full backup exported successfully!\n\nData size: ${(jsonData.length / 1024).toFixed(1)} KB\n\nJSON content preview:\n${jsonData.substring(0, 200)}...`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to export JSON data');
              }
            }
          },
          {
            text: 'CSV (Transactions)',
            onPress: async () => {
              try {
                const csvData = await exportToCSV('transactions');
                Alert.alert(
                  'Export Complete',
                  `Transactions exported to CSV successfully!\n\nCSV content preview:\n${csvData.substring(0, 200)}...`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to export CSV data');
              }
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const generateCSV = () => {
    let csv = 'Type,Description,Amount,Category,Date\n';
    
    data.transactions.forEach(transaction => {
      const category = data.categories.find(c => c.name === transaction.category);
      csv += `${transaction.type},${transaction.description},${transaction.amount},${category?.name || 'Unknown'},${transaction.date}\n`;
    });
    
    csv += '\n\nCategories\n';
    csv += 'Name,Type,Color,Icon\n';
    data.categories.forEach(category => {
      csv += `${category.name},${category.type},${category.color},${category.icon}\n`;
    });
    
    
    return csv;
  };


  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }> = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      ))}
    </TouchableOpacity>
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
            <Ionicons name="settings" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Settings</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={18} color={colors.white} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <SettingItem
          icon="person-outline"
          title="Profile Information"
          subtitle="Manage your personal information and avatar"
          onPress={() => (navigation as any).navigate('Profile')}
        />
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        
        <SettingItem
          icon="cash-outline"
          title="Currency"
          subtitle={currencyOptions.find(c => c.code === data.settings.currency)?.name}
          onPress={() => setShowCurrencyPicker(true)}
        />

        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Receive budget alerts and reminders"
          rightComponent={
            <Switch
              value={data.settings.notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={data.settings.notifications ? colors.white : colors.gray500}
            />
          }
        />
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <SettingItem
          icon="moon-outline"
          title="Theme"
          subtitle={data.settings.theme === 'light' ? 'Light' : 'Dark'}
          rightComponent={
            <Switch
              value={data.settings.theme === 'dark'}
              onValueChange={(value) => handleThemeToggle(value ? 'dark' : 'light')}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={data.settings.theme === 'dark' ? colors.white : colors.gray500}
            />
          }
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <SettingItem
          icon="download-outline"
          title="Export Data"
          subtitle="Download your data as a file"
          onPress={handleExportData}
        />

        <SettingItem
          icon="cloud-upload-outline"
          title="Import Data"
          subtitle="Restore data from backup file"
          onPress={handleImportData}
        />

        <SettingItem
          icon="trash-outline"
          title="Clear All Data"
          subtitle="Permanently delete all data"
          onPress={handleClearData}
        />
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <SettingItem
          icon="information-circle-outline"
          title="App Version"
          subtitle="1.0.0"
        />

        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help using the app"
          onPress={() => Alert.alert('Help', 'For support, please contact us at support@budgetmanager.com')}
        />

        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          subtitle="How we protect your data"
          onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device and is never shared with third parties.')}
        />
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.transactions.length}</Text>
            <Text style={styles.statLabel}>Total Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </View>

      {/* Currency Picker Modal */}
      <BottomModal
        visible={showCurrencyPicker}
        onClose={handleCloseModal}
        title="Select Currency"
        showSaveButton={true}
        onSave={handleSaveCurrency}
        saveButtonDisabled={isUpdatingCurrency}
        isLoading={isUpdatingCurrency}
      >
        {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search currencies..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  selectionColor={colors.primary}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Currency Cards */}
            <View style={styles.currencyContainer}>
              {isUpdatingCurrency ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Updating currency...</Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.currencyScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.currencyScrollContent}
                >
                  {filteredCurrencies.map((currency, index) => {
                    const isSelected = currency.code === selectedCurrency;
                    return (
                      <Animated.View
                        key={currency.code}
                        entering={SlideInUp.delay(index * 50)}
                        style={styles.currencyCardContainer}
                      >
                        <TouchableOpacity
                          style={[
                            styles.currencyCard,
                            isSelected && styles.currencyCardSelected
                          ]}
                          onPress={() => handleCurrencySelect(currency.code)}
                          disabled={isUpdatingCurrency}
                          activeOpacity={0.7}
                        >
                          <View style={styles.currencyCardLeft}>
                            <Text style={styles.currencyFlag}>{currency.flag}</Text>
                            <View style={styles.currencyInfo}>
                              <Text style={[
                                styles.currencyName,
                                isSelected && styles.currencyNameSelected
                              ]}>
                                {currency.name}
                              </Text>
                              <Text style={[
                                styles.currencyCountry,
                                isSelected && styles.currencyCountrySelected
                              ]}>
                                {currency.country}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.currencyCardRight}>
                            <Text style={[
                              styles.currencySymbol,
                              isSelected && styles.currencySymbolSelected
                            ]}>
                              {currency.symbol}
                            </Text>
                            {isSelected && (
                              <Ionicons 
                                name="checkmark-circle" 
                                size={20} 
                                color={colors.primary} 
                                style={styles.checkIcon}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
      </BottomModal>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    paddingBottom: 100, // Account for tab bar
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Bottom Modal Styles
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.9,
    ...shadows.xl,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  currencyContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currencyScrollView: {
    flex: 1,
  },
  currencyScrollContent: {
    paddingBottom: spacing.md,
  },
  currencyCardContainer: {
    marginBottom: spacing.xs,
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  currencyCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  currencyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 1,
  },
  currencyNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  currencyCountry: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 12,
  },
  currencyCountrySelected: {
    color: colors.primary + 'AA',
  },
  currencyCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    marginRight: spacing.sm,
  },
  currencySymbolSelected: {
    color: colors.primary,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});

export default SettingsScreen;
