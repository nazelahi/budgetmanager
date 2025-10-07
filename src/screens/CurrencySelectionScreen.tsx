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

import Card from '../components/Card';
import Header from '../components/Header';
import { colors, gradients } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, shadows, borderRadius } from '../constants/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser } from '../store/slices/userSlice';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
];

const CurrencySelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'USD');

  const handleCurrencySelect = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
  };

  const handleSave = () => {
    if (user) {
      dispatch(updateUser({
        ...user,
        currency: selectedCurrency,
      }));
      Alert.alert('Success', 'Currency updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const renderCurrencyItem = (currency: typeof currencies[0]) => {
    const isSelected = selectedCurrency === currency.code;
    
    return (
      <TouchableOpacity
        key={currency.code}
        onPress={() => handleCurrencySelect(currency.code)}
        style={styles.currencyItem}
      >
        <Card style={StyleSheet.flatten([
          styles.currencyCard,
          isSelected && styles.selectedCurrencyCard
        ])}>
          <View style={styles.currencyContent}>
            <View style={styles.currencyLeft}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <View style={styles.currencyInfo}>
                <Text style={[
                  styles.currencyName,
                  isSelected && styles.selectedText
                ]}>
                  {currency.name}
                </Text>
                <Text style={[
                  styles.currencyCode,
                  isSelected && styles.selectedText
                ]}>
                  {currency.code}
                </Text>
              </View>
            </View>
            <View style={styles.currencyRight}>
              <Text style={[
                styles.currencySymbol,
                isSelected && styles.selectedText
              ]}>
                {currency.symbol}
              </Text>
              {isSelected && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={colors.primary} 
                />
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Select Currency"
        subtitle="Choose your preferred currency"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Currencies</Text>
          <Text style={styles.sectionSubtitle}>
            Select the currency you want to use for your transactions and budgets.
          </Text>
        </View>

        <View style={styles.currenciesList}>
          {currencies.map(renderCurrencyItem)}
        </View>

        <View style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color={colors.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Currency Information</Text>
                <Text style={styles.infoDescription}>
                  Changing your currency will affect how amounts are displayed throughout the app. 
                  Historical transactions will keep their original amounts.
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
          <Text style={styles.saveButtonText}>Save Currency</Text>
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
  currenciesList: {
    paddingHorizontal: spacing['4'],
  },
  currencyItem: {
    marginBottom: spacing['2'],
  },
  currencyCard: {
    padding: spacing['4'],
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCurrencyCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  currencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 32,
    marginRight: spacing['3'],
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    ...typography.textStyles.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing['0.5'],
  },
  currencyCode: {
    ...typography.textStyles.bodySmall,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    ...typography.textStyles.headline6,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing['2'],
  },
  selectedText: {
    color: colors.primary,
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

export default CurrencySelectionScreen;
