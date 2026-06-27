import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList, ProfileUpdateRequest } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { updateProfile } from '../../api/profile';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors, spacing, radius, fontSize, fontWeight } from '../../theme';
import { INTENT_OPTIONS, LANGUAGE_OPTIONS } from '../../utils/constants';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [intent, setIntent] = useState(user?.intent ?? 'lets_see');
  const [college, setCollege] = useState(user?.college ?? '');
  const [workplace, setWorkplace] = useState(user?.workplace ?? '');
  const [height, setHeight] = useState(user?.height_cm != null ? String(user.height_cm) : '');
  const [religion, setReligion] = useState(user?.religion ?? '');
  const [education, setEducation] = useState(user?.education ?? '');
  const [occupation, setOccupation] = useState(user?.occupation ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language ?? '');

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload: ProfileUpdateRequest = {
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        intent: intent || undefined,
        city: city.trim() || undefined,
        college: college.trim() || undefined,
        workplace: workplace.trim() || undefined,
        religion: religion.trim() || undefined,
        education: education.trim() || undefined,
        occupation: occupation.trim() || undefined,
        preferred_language: preferredLanguage || undefined,
      };

      const heightNum = parseInt(height, 10);
      if (!isNaN(heightNum) && heightNum > 0) {
        payload.height_cm = heightNum;
      }

      await updateProfile(payload);
      await fetchProfile();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, bio, city, intent, college, workplace, height, religion, education, occupation, preferredLanguage, fetchProfile, navigation]);

  const handleShowIntentPicker = () => {
    const labels = INTENT_OPTIONS.map((opt) => opt.label);
    const values = INTENT_OPTIONS.map((opt) => opt.value);
    Alert.alert('Intent', 'What are you looking for?', [
      ...values.map((val, idx) => ({
        text: labels[idx],
        onPress: () => setIntent(val),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleShowLanguagePicker = () => {
    const labels = LANGUAGE_OPTIONS.map((l) => l.name);
    const values = LANGUAGE_OPTIONS.map((l) => l.code);
    Alert.alert('Preferred Language', 'Choose your preferred language', [
      ...values.map((val, idx) => ({
        text: labels[idx],
        onPress: () => setPreferredLanguage(val),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const getIntentLabel = () => {
    const opt = INTENT_OPTIONS.find((o) => o.value === intent);
    return opt ? opt.label : intent;
  };

  const getLanguageLabel = () => {
    const opt = LANGUAGE_OPTIONS.find((l) => l.code === preferredLanguage);
    return opt ? opt.name : preferredLanguage || 'Select...';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
          {/* ─── Name ─── */}
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            label="Name"
            maxLength={50}
            returnKeyType="next"
          />

          {/* ─── Bio ─── */}
          <Input
            value={bio}
            onChangeText={setBio}
            placeholder="Write a short bio about yourself..."
            label="Bio"
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          {/* ─── City ─── */}
          <Input
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
            label="City"
            returnKeyType="next"
          />

          {/* ─── Intent ─── */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Intent</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={handleShowIntentPicker}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{getIntentLabel()}</Text>
              <Text style={styles.pickerChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* ─── College ─── */}
          <Input
            value={college}
            onChangeText={setCollege}
            placeholder="Your college or university"
            label="College"
            returnKeyType="next"
          />

          {/* ─── Workplace ─── */}
          <Input
            value={workplace}
            onChangeText={setWorkplace}
            placeholder="Where you work"
            label="Workplace"
            returnKeyType="next"
          />

          {/* ─── Height ─── */}
          <Input
            value={height}
            onChangeText={(text) => setHeight(text.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 170"
            label="Height (cm)"
            keyboardType="numeric"
            maxLength={3}
          />

          {/* ─── Religion ─── */}
          <Input
            value={religion}
            onChangeText={setReligion}
            placeholder="Your religion"
            label="Religion"
            returnKeyType="next"
          />

          {/* ─── Education ─── */}
          <Input
            value={education}
            onChangeText={setEducation}
            placeholder="Your highest education"
            label="Education"
            returnKeyType="next"
          />

          {/* ─── Occupation ─── */}
          <Input
            value={occupation}
            onChangeText={setOccupation}
            placeholder="What you do"
            label="Occupation"
            returnKeyType="next"
          />

          {/* ─── Preferred Language ─── */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Preferred Language</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={handleShowLanguagePicker}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText}>{getLanguageLabel()}</Text>
              <Text style={styles.pickerChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Save Button ─── */}
          <View style={styles.saveButtonContainer}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              size="lg"
              loading={saving}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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

  // ─── Picker ───
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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

  // ─── Save ───
  saveButtonContainer: {
    marginTop: spacing.lg,
  },
});
