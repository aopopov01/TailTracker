import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type TemperatureUnit = 'celsius' | 'fahrenheit';
type WeightUnit = 'kg' | 'lbs';

interface AppPreferences {
  theme: Theme;
  language: Language;
  dateFormat: DateFormat;
  temperatureUnit: TemperatureUnit;
  weightUnit: WeightUnit;
  fontSize: 'small' | 'medium' | 'large';
  hapticFeedback: boolean;
  soundEffects: boolean;
  animations: boolean;
  autoSave: boolean;
  offlineMode: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'system',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  temperatureUnit: 'celsius',
  weightUnit: 'kg',
  fontSize: 'medium',
  hapticFeedback: true,
  soundEffects: true,
  animations: true,
  autoSave: true,
  offlineMode: false,
};

export default function AppPreferencesScreen() {
  const navigation = useNavigation();
  const [preferences, setPreferences] =
    useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('appPreferences');
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: AppPreferences) => {
    try {
      setLoading(true);
      await AsyncStorage.setItem(
        'appPreferences',
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => savePreferences(DEFAULT_PREFERENCES),
        },
      ]
    );
  };

  const getLanguageLabel = (lang: Language) => {
    const labels = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    };
    return labels[lang];
  };

  const getThemeLabel = (theme: Theme) => {
    const labels = {
      light: 'Light',
      dark: 'Dark',
      system: 'System Default',
    };
    return labels[theme];
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderSwitchSetting = (
    title: string,
    subtitle: string,
    key: keyof AppPreferences,
    value: boolean
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={newValue => updatePreference(key, newValue)}
        trackColor={{ false: colors.gray200, true: colors.primary }}
        thumbColor={value ? colors.white : colors.gray400}
        disabled={loading}
      />
    </View>
  );

  const renderPickerSetting = (
    title: string,
    subtitle: string,
    options: { label: string; value: any }[],
    selectedValue: any,
    onValueChange: (value: any) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          enabled={!loading}
        >
          {options.map(option => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Ionicons name='chevron-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Preferences</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetToDefaults}
          disabled={loading}
        >
          <Ionicons name='refresh' size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        {renderSectionHeader('Appearance')}

        {renderPickerSetting(
          'Theme',
          'Choose your preferred color scheme',
          [
            { label: 'System Default', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
          preferences.theme,
          (value: Theme) => updatePreference('theme', value)
        )}

        {renderPickerSetting(
          'Font Size',
          'Adjust text size for better readability',
          [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
          ],
          preferences.fontSize,
          (value: 'small' | 'medium' | 'large') =>
            updatePreference('fontSize', value)
        )}

        {renderSwitchSetting(
          'Animations',
          'Enable smooth transitions and animations',
          'animations',
          preferences.animations
        )}

        {/* Language & Region */}
        {renderSectionHeader('Language & Region')}

        {renderPickerSetting(
          'Language',
          'Select your preferred language',
          [
            { label: 'English', value: 'en' },
            { label: 'Español', value: 'es' },
            { label: 'Français', value: 'fr' },
            { label: 'Deutsch', value: 'de' },
          ],
          preferences.language,
          (value: Language) => updatePreference('language', value)
        )}

        {renderPickerSetting(
          'Date Format',
          'Choose how dates are displayed',
          [
            { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
            { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
            { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
          ],
          preferences.dateFormat,
          (value: DateFormat) => updatePreference('dateFormat', value)
        )}

        {/* Units */}
        {renderSectionHeader('Units')}

        {renderPickerSetting(
          'Temperature Unit',
          'Select temperature measurement unit',
          [
            { label: 'Celsius (°C)', value: 'celsius' },
            { label: 'Fahrenheit (°F)', value: 'fahrenheit' },
          ],
          preferences.temperatureUnit,
          (value: TemperatureUnit) => updatePreference('temperatureUnit', value)
        )}

        {renderPickerSetting(
          'Weight Unit',
          'Select weight measurement unit',
          [
            { label: 'Kilograms (kg)', value: 'kg' },
            { label: 'Pounds (lbs)', value: 'lbs' },
          ],
          preferences.weightUnit,
          (value: WeightUnit) => updatePreference('weightUnit', value)
        )}

        {/* Experience */}
        {renderSectionHeader('Experience')}

        {renderSwitchSetting(
          'Haptic Feedback',
          'Feel vibrations for app interactions',
          'hapticFeedback',
          preferences.hapticFeedback
        )}

        {renderSwitchSetting(
          'Sound Effects',
          'Play sounds for app interactions',
          'soundEffects',
          preferences.soundEffects
        )}

        {renderSwitchSetting(
          'Auto Save',
          'Automatically save changes as you type',
          'autoSave',
          preferences.autoSave
        )}

        {renderSwitchSetting(
          'Offline Mode',
          'Enable offline access to your data',
          'offlineMode',
          preferences.offlineMode
        )}

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <Text
              style={[
                styles.previewText,
                {
                  fontSize:
                    preferences.fontSize === 'small'
                      ? 14
                      : preferences.fontSize === 'large'
                        ? 20
                        : 16,
                },
              ]}
            >
              This is how text will appear with your current font size setting.
            </Text>
            <Text style={styles.previewDate}>
              {preferences.dateFormat === 'MM/DD/YYYY'
                ? '12/31/2024'
                : preferences.dateFormat === 'DD/MM/YYYY'
                  ? '31/12/2024'
                  : '2024-12-31'}
            </Text>
            <Text style={styles.previewTemp}>
              Temperature:{' '}
              {preferences.temperatureUnit === 'celsius' ? '22°C' : '72°F'}
            </Text>
            <Text style={styles.previewWeight}>
              Weight: {preferences.weightUnit === 'kg' ? '25 kg' : '55 lbs'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  resetButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    minHeight: 64,
  },
  settingText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pickerContainer: {
    minWidth: 120,
  },
  picker: {
    height: 44,
    width: 120,
  },
  previewSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  previewText: {
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  previewDate: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewTemp: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewWeight: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
