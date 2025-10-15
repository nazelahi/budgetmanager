import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../utils/theme';
import { useApp } from '../contexts/AppContext';
import { UserProfile } from '../contexts/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SetupScreenProps {
  onComplete?: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { updateSettings, addCategory, updateProfile } = useApp();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatarType: 'icon',
  });
  const [currency, setCurrency] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const progressValue = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const steps = [
    { id: 'welcome', title: 'Welcome', icon: 'hand-left' },
    { id: 'profile', title: 'Profile', icon: 'person' },
    { id: 'currency', title: 'Currency', icon: 'cash' },
    { id: 'categories', title: 'Categories', icon: 'grid' },
    { id: 'notifications', title: 'Notifications', icon: 'notifications' },
    { id: 'complete', title: 'Complete', icon: 'checkmark-circle' },
  ];

  const currencies = [
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

  const defaultCategories = [
    { name: 'Food & Dining', type: 'expense', color: '#F44336', icon: 'restaurant' },
    { name: 'Transportation', type: 'expense', color: '#607D8B', icon: 'car' },
    { name: 'Shopping', type: 'expense', color: '#9C27B0', icon: 'bag' },
    { name: 'Entertainment', type: 'expense', color: '#FF9800', icon: 'game-controller' },
    { name: 'Healthcare', type: 'expense', color: '#E91E63', icon: 'medical' },
    { name: 'Utilities', type: 'expense', color: '#795548', icon: 'flash' },
    { name: 'Education', type: 'expense', color: '#3F51B5', icon: 'school' },
    { name: 'Travel', type: 'expense', color: '#00BCD4', icon: 'airplane' },
    { name: 'Salary', type: 'income', color: '#2196F3', icon: 'briefcase' },
    { name: 'Freelance', type: 'income', color: '#42A5F5', icon: 'laptop' },
    { name: 'Investment', type: 'income', color: '#FFC107', icon: 'trending-up' },
    { name: 'Gift', type: 'income', color: '#FF5722', icon: 'gift' },
  ];

  useEffect(() => {
    progressValue.value = withTiming((currentStep + 1) / steps.length, { duration: 500 });
  }, [currentStep]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1: // Profile step
        if (!profile.name || profile.name.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters long';
        }
        if (profile.email && !validateEmail(profile.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        if (profile.phone && !validatePhone(profile.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        }
        break;
      case 2: // Currency step
        if (!currency) {
          newErrors.currency = 'Please select a currency';
        }
        break;
      default:
        return true;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < steps.length - 1) {
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Save profile if name is provided
      if (profile.name && profile.name.trim().length > 0) {
        await updateProfile(profile as UserProfile);
      }

      // Update settings
      await updateSettings({
        currency,
        theme: 'dark',
        notifications,
      });

      // Add selected categories
      for (const categoryName of selectedCategories) {
        const category = defaultCategories.find(c => c.name === categoryName);
        if (category) {
          await addCategory({
            ...category,
            type: category.type as 'income' | 'expense'
          });
        }
      }

      // If no categories selected, add default ones
      if (selectedCategories.length === 0) {
        const defaultExpenseCategories = defaultCategories.filter(c => c.type === 'expense').slice(0, 5);
        const defaultIncomeCategories = defaultCategories.filter(c => c.type === 'income').slice(0, 2);
        
        for (const category of [...defaultExpenseCategories, ...defaultIncomeCategories]) {
          await addCategory({
            ...category,
            type: category.type as 'income' | 'expense'
          });
        }
      }

      onComplete?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
      console.error('Setup completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.stepContainer}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="wallet" size={60} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Welcome to Budget Manager</Text>
            <Text style={styles.stepDescription}>
              Let's set up your personal budget management system in just a few steps.
              We'll help you organize your finances and track your spending habits.
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Track income and expenses</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Get spending insights</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={styles.featureText}>Smart notifications</Text>
              </View>
            </View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View entering={SlideInRight.delay(200)} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create Your Profile</Text>
            <Text style={styles.stepDescription}>
              Tell us a bit about yourself to personalize your experience.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.textInputError]}
                value={profile.name}
                onChangeText={(text) => {
                  setProfile(prev => ({ ...prev, name: text }));
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Full name input"
                accessibilityHint="Enter your full name for personalization"
                autoComplete="name"
                textContentType="name"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, errors.email && styles.textInputError]}
                value={profile.email}
                onChangeText={(text) => {
                  setProfile(prev => ({ ...prev, email: text }));
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address (optional)"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={[styles.textInput, errors.phone && styles.textInputError]}
                value={profile.phone}
                onChangeText={(text) => {
                  setProfile(prev => ({ ...prev, phone: text }));
                  if (errors.phone) {
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                accessibilityLabel="Phone number input"
                accessibilityHint="Enter your phone number (optional)"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={profile.location}
                onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                placeholder="Enter your city/country"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={SlideInRight.delay(200)} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Your Currency</Text>
            <Text style={styles.stepDescription}>
              Choose the currency you'll be using for your transactions.
            </Text>
            
            {!currency ? (
              <View style={styles.placeholderContainer}>
                <Ionicons name="cash-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.placeholderText}>Select a currency to continue</Text>
                <Text style={styles.placeholderSubtext}>Choose from the tabs below</Text>
              </View>
            ) : null}
            
            {errors.currency && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.currency}</Text>
              </View>
            )}
            
            <View style={styles.currencyListContainer}>
              {currencies.map((curr, index) => (
                <Animated.View 
                  key={curr.code}
                  entering={FadeInDown.delay(300 + (index * 30))}
                >
                  <TouchableOpacity
                    style={[
                      styles.currencyListItem,
                      currency === curr.code && styles.currencyListItemSelected
                    ]}
                    onPress={() => {
                      setCurrency(curr.code);
                      if (errors.currency) {
                        setErrors(prev => ({ ...prev, currency: '' }));
                      }
                    }}
                  >
                    <View style={styles.currencyListLeft}>
                      <Text style={styles.currencyFlag}>{curr.flag}</Text>
                      <View style={styles.currencyListInfo}>
                        <Text style={[
                          styles.currencyListName,
                          currency === curr.code && styles.currencyListNameSelected
                        ]}>
                          {curr.name}
                        </Text>
                        <Text style={[
                          styles.currencyListCountry,
                          currency === curr.code && styles.currencyListCountrySelected
                        ]}>
                          {curr.country}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.currencyListRight}>
                      <Text style={[
                        styles.currencyListSymbol,
                        currency === curr.code && styles.currencyListSymbolSelected
                      ]}>
                        {curr.symbol}
                      </Text>
                      <Text style={[
                        styles.currencyListCode,
                        currency === curr.code && styles.currencyListCodeSelected
                      ]}>
                        {curr.code}
                      </Text>
                      {currency === curr.code && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={20} 
                          color={colors.primary} 
                          style={styles.currencyCheckIcon}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            
            {currency && (
              <Animated.View entering={FadeInUp.delay(500)} style={styles.selectedCurrencyInfo}>
                <View style={styles.selectedCurrencyCard}>
                  <Text style={styles.selectedCurrencyFlag}>
                    {currencies.find(c => c.code === currency)?.flag}
                  </Text>
                  <View style={styles.selectedCurrencyDetails}>
                    <Text style={styles.selectedCurrencyName}>
                      {currencies.find(c => c.code === currency)?.name}
                    </Text>
                    <Text style={styles.selectedCurrencyCountry}>
                      {currencies.find(c => c.code === currency)?.country}
                    </Text>
                  </View>
                  <View style={styles.selectedCurrencyRight}>
                    <Text style={styles.selectedCurrencySymbol}>
                      {currencies.find(c => c.code === currency)?.symbol}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={SlideInRight.delay(200)} style={styles.stepContainer}>
            {selectedCategories.length === 0 ? (
              <View style={styles.placeholderContainer}>
                <Ionicons name="grid-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.placeholderText}>Select categories to get started</Text>
                <Text style={styles.placeholderSubtext}>Choose from the list below (optional)</Text>
              </View>
            ) : null}
            
            <View style={styles.categoriesListContainer}>
              {defaultCategories.map((category, index) => (
                <Animated.View 
                  key={category.name}
                  entering={FadeInDown.delay(300 + (index * 30))}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryListItem,
                      selectedCategories.includes(category.name) && styles.categoryListItemSelected
                    ]}
                    onPress={() => toggleCategory(category.name)}
                  >
                    <View style={styles.categoryListLeft}>
                      <View style={[
                        styles.categoryListIcon,
                        { backgroundColor: category.color + '20' }
                      ]}>
                        <Ionicons 
                          name={category.icon as any} 
                          size={18} 
                          color={category.color} 
                        />
                      </View>
                      <View style={styles.categoryListInfo}>
                        <Text style={[
                          styles.categoryListName,
                          selectedCategories.includes(category.name) && styles.categoryListNameSelected
                        ]}>
                          {category.name}
                        </Text>
                        <Text style={[
                          styles.categoryListType,
                          selectedCategories.includes(category.name) && styles.categoryListTypeSelected
                        ]}>
                          {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryListRight}>
                      {selectedCategories.includes(category.name) && (
                        <Ionicons 
                          name="checkmark-circle" 
                          size={18} 
                          color={colors.primary} 
                          style={styles.categoryCheckIcon}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View entering={SlideInRight.delay(200)} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Notification Preferences</Text>
            <Text style={styles.stepDescription}>
              Choose how you'd like to receive notifications about your budget.
            </Text>
            
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <Ionicons name="notifications" size={24} color={colors.primary} />
                <Text style={styles.notificationTitle}>Budget Alerts</Text>
              </View>
              <Text style={styles.notificationDescription}>
                Get notified when you're approaching or exceeding your budget limits.
              </Text>
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => setNotifications(!notifications)}
              >
                <Text style={styles.toggleLabel}>
                  {notifications ? 'Enabled' : 'Disabled'}
                </Text>
                <View style={[
                  styles.toggle,
                  notifications && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    notifications && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationFeatures}>
              <View style={styles.notificationFeature}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.notificationFeatureText}>
                  Warning at 80% of budget
                </Text>
              </View>
              <View style={styles.notificationFeature}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.notificationFeatureText}>
                  Alert when budget exceeded
                </Text>
              </View>
              <View style={styles.notificationFeature}>
                <Ionicons name="calendar" size={16} color={colors.info} />
                <Text style={styles.notificationFeatureText}>
                  Monthly budget reminders
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.stepContainer}>
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Setup Complete!</Text>
            <Text style={styles.stepDescription}>
              Your budget manager is ready to use. You can now start tracking your income and expenses.
            </Text>
            
            <View style={styles.completeFeatures}>
              <View style={styles.completeFeature}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
                <Text style={styles.completeFeatureText}>Start adding transactions</Text>
              </View>
              <View style={styles.completeFeature}>
                <Ionicons name="pie-chart" size={20} color={colors.primary} />
                <Text style={styles.completeFeatureText}>Create your first budget</Text>
              </View>
              <View style={styles.completeFeature}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={styles.completeFeatureText}>View spending insights</Text>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profile.name && profile.name.trim().length > 0;
      case 2:
        return currency && currency.trim().length > 0;
      default:
        return true;
    }
  };

  const canSkip = () => {
    switch (currentStep) {
      case 1: // Profile step - can skip if name is provided
        return profile.name && profile.name.trim().length > 0;
      case 3: // Categories step - always skippable
        return true;
      case 4: // Notifications step - always skippable
        return true;
      default:
        return false;
    }
  };

  const handleSkip = () => {
    if (canSkip()) {
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Custom Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContainer}>
        <LinearGradient
          colors={['#1B263B', '#0D1B2A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.sm }]}
        >
          <Animated.View entering={SlideInLeft.delay(200)} style={styles.headerTitleContainer}>
            <Ionicons name="wallet" size={18} color={colors.white} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Budget Manager</Text>
          </Animated.View>
          <View style={styles.headerActions}>
            <Animated.View entering={SlideInRight.delay(300)} style={styles.headerActionContainer}>
              <View style={styles.progressContainer}>
                <View style={styles.stepDotsContainer}>
                  {steps.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.stepDot,
                        index <= currentStep && styles.stepDotActive,
                        index === currentStep && styles.stepDotCurrent,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {steps.length}
                </Text>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.stepCard, animatedCardStyle]}>
            {renderStep()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <Animated.View entering={FadeInUp.delay(400)} style={styles.footer}>
        <LinearGradient
          colors={gradients.surface}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerGradient}
        >
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handlePrevious}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.footerRight}>
              {canSkip() && currentStep < steps.length - 1 && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!canProceed() || isLoading) && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={!canProceed() || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Setting up...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[
                      styles.nextButtonText,
                      (!canProceed() || isLoading) && styles.nextButtonTextDisabled
                    ]}>
                      {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Ionicons 
                      name={currentStep === steps.length - 1 ? 'checkmark' : 'chevron-forward'} 
                      size={20} 
                      color={canProceed() && !isLoading ? colors.white : colors.textTertiary} 
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
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
  progressContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  stepDotCurrent: {
    backgroundColor: colors.white,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  
  // Welcome Step
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  featuresList: {
    width: '100%',
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  
  // Profile Step
  inputGroup: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 16,
  },
  
  // Currency Step - Compact List View
  currencyListContainer: {
    width: '100%',
    marginVertical: spacing.md,
  },
  currencyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyListItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  currencyListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  currencyListInfo: {
    flex: 1,
  },
  currencyListName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  currencyListNameSelected: {
    color: colors.primary,
  },
  currencyListCountry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  currencyListCountrySelected: {
    color: colors.primary,
  },
  currencyListRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  currencyListSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  currencyListSymbolSelected: {
    color: colors.primary,
  },
  currencyListCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  currencyListCodeSelected: {
    color: colors.primary,
  },
  currencyCheckIcon: {
    marginLeft: spacing.xs,
  },
  
  // Selected Currency Info
  selectedCurrencyInfo: {
    width: '100%',
    marginTop: spacing.md,
  },
  selectedCurrencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  selectedCurrencyFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  selectedCurrencyDetails: {
    flex: 1,
  },
  selectedCurrencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  selectedCurrencyCountry: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedCurrencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCurrencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Categories Step - Compact List View
  categoriesListContainer: {
    width: '100%',
    marginVertical: spacing.md,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryListItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  categoryListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryListIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryListInfo: {
    flex: 1,
  },
  categoryListName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoryListNameSelected: {
    color: colors.primary,
  },
  categoryListType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  categoryListTypeSelected: {
    color: colors.primary,
  },
  categoryListRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckIcon: {
    marginLeft: spacing.xs,
  },
  
  // Notifications Step
  notificationCard: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notificationTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  notificationDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: colors.gray600,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: colors.white,
    borderRadius: 13,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  notificationFeatures: {
    gap: spacing.sm,
  },
  notificationFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationFeatureText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  
  // Complete Step
  completeIcon: {
    marginBottom: spacing.sm,
  },
  completeFeatures: {
    width: '100%',
    gap: spacing.sm,
  },
  completeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  completeFeatureText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  
  // Footer
  footer: {
    ...shadows.lg,
    elevation: 8,
  },
  footerGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray600,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
    marginRight: spacing.sm,
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
  
  // Error styles
  textInputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  
  // Footer improvements
  footerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  footerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.button,
    color: colors.white,
    marginRight: spacing.sm,
  },
});

export default SetupScreen;
