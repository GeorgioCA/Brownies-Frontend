import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList, Preferences } from '../../types';
import { getPreferences, updatePreferences } from '../../api/preferences';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';
import { INTENT_OPTIONS } from '../../utils/constants';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Preferences'>;

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Both', value: 'both' },
] as const;

export default function PreferencesScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('60');
  const [preferredGender, setPreferredGender] = useState<'male' | 'female' | 'both'>('both');
  const [maxDistance, setMaxDistance] = useState('50');
  const [intentFilter, setIntentFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('');

  const loadPreferences = useCallback(async () => {
    try {
      const res = await getPreferences();
      const prefs: Preferences = res.data;
      setMinAge(String(prefs.min_age));
      setMaxAge(String(prefs.max_age));
      setPreferredGender(prefs.preferred_gender);
      setMaxDistance(String(prefs.max_distance_km));
      setIntentFilter(prefs.intent_filter);
      setCityFilter(prefs.city_filter || '');
    } catch {
      Alert.alert('Error', 'Failed to load preferences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = useCallback(async () => {
    const min = parseInt(minAge, 10);
    const max = parseInt(maxAge, 10);
    const dist = parseInt(maxDistance, 10);

    if (isNaN(min) || isNaN(max) || min < 18 || max > 100 || min > max) {
      Alert.alert('Invalid Age Range', 'Please enter a valid age range (18-100).');
      return;
    }

    if (isNaN(dist) || dist < 1 || dist > 500) {
      Alert.alert('Invalid Distance', 'Please enter a valid distance (1-500 km).');
      return;
    }

    setSaving(true);
    try {
      await updatePreferences({
        min_age: min,
        max_age: max,
        preferred_gender: preferredGender,
        max_distance_km: dist,
        intent_filter: intentFilter,
        city_filter: cityFilter.trim() || null,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [minAge, maxAge, preferredGender, maxDistance, intentFilter, cityFilter, navigation]);

  const handleShowIntentPicker = () => {
    const labels = INTENT_OPTIONS.map((opt) => opt.label);
    const values = INTENT_OPTIONS.map((opt) => opt.value);
    Alert.alert('Intent Filter', 'Filter by intent', [
      { text: 'Any', onPress: () => setIntentFilter(null) },
      ...values.map((val, idx) => ({
        text: labels[idx],
        onPress: () => setIntentFilter(val),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const getIntentLabel = () => {
    if (!intentFilter) return 'Any';
    const opt = INTENT_OPTIONS.find((o) => o.value === intentFilter);
    return opt ? opt.label : intentFilter;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading preferences..." />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Age Range</Text>
        <Text style={styles.sectionSubtitle}>
          Only show profiles within this age range
        </Text>
        <View style={styles.ageRow}>
          <View style={styles.ageField}>
            <Text style={styles.fieldLabel}>Min</Text>
            <TextInput
              style={styles.ageInput}
              value={minAge}
              onChangeText={(text) => setMinAge(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={colors.textLight}
            />
          </View>
          <Text style={styles.ageTo}>to</Text>
          <View style={styles.ageField}>
            <Text style={styles.fieldLabel}>Max</Text>
            <TextInput
              style={styles.ageInput}
              value={maxAge}
              onChangeText={(text) => setMaxAge(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferred Gender</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((opt) => {
            const selected = preferredGender === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setPreferredGender(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Max Distance</Text>
        <View style={styles.distanceRow}>
          <TextInput
            style={styles.distanceInput}
            value={maxDistance}
            onChangeText={(text) => setMaxDistance(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={3}
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.distanceSuffix}>km</Text>
        </View>

        <Text style={styles.sectionTitle}>Intent Filter</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={handleShowIntentPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerText}>{getIntentLabel()}</Text>
          <Text style={styles.pickerChevron}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>City Filter</Text>
        <TextInput
          style={styles.cityInput}
          value={cityFilter}
          onChangeText={setCityFilter}
          placeholder="Filter by city..."
          placeholderTextColor={colors.textLight}
          autoCapitalize="words"
        />

        <View style={styles.saveButtonContainer}>
          <Button
            title="Save Preferences"
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={saving}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  backText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  saveText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },

  ageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  ageField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ageInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  ageTo: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    paddingBottom: spacing.sm + 4,
  },

  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    ...shadow.sm,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semiBold,
  },

  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distanceInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
  },
  distanceSuffix: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },

  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  pickerText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerChevron: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  cityInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
  },

  saveButtonContainer: {
    marginTop: spacing.xl,
  },
});
