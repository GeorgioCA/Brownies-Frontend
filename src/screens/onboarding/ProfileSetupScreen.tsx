import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import type { ProfileSetupRequest } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { setupProfile, uploadPhoto } from '../../api/profile';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Avatar } from '../../components/Avatar';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';
import { GENDER_OPTIONS, INTENT_OPTIONS, LANGUAGE_OPTIONS } from '../../utils/constants';
import * as ImagePicker from 'expo-image-picker';

const TOTAL_STEPS = 5;

const GENDER_ICONS: Record<string, string> = {
  male: '♂️',
  female: '♀️',
};

const INTENT_ICONS: Record<string, string> = {
  lets_see: '👀',
  serious_relationship: '💑',
  casual: '☕',
  friendship: '🤝',
  marriage: '💍',
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i <= current ? styles.dotActive : styles.dotInactive,
            i === current && styles.dotCurrent,
          ]}
        />
      ))}
    </View>
  );
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

function calculateAgeFromYMD(year: number, month: number, day: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() + 1 - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default function ProfileSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<ProfileSetupRequest>({
    name: '',
    date_of_birth: '',
    gender: 'male',
    intent: 'lets_see',
    city: '',
    college: '',
    workplace: '',
    bio: '',
    height_cm: undefined,
    religion: '',
    education: '',
    occupation: '',
    languages: [],
    preferred_language: '',
  });

  const [dobYear, setDobYear] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');

  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  const updateField = useCallback(
    (field: keyof ProfileSetupRequest, value: unknown) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  // ─── Validation per step ───

  const validateBasicInfo = (): boolean => {
    const next: Record<string, string> = {};

    const name = form.name.trim();
    if (!name) {
      next.name = 'Name is required.';
    } else if (name.length < 2) {
      next.name = 'Name must be at least 2 characters.';
    } else if (name.length > 50) {
      next.name = 'Name must be 50 characters or fewer.';
    }

    const y = parseInt(dobYear, 10);
    const m = parseInt(dobMonth, 10);
    const d = parseInt(dobDay, 10);

    if (!dobYear || !dobMonth || !dobDay) {
      next.date_of_birth = 'Please enter your date of birth.';
    } else if (isNaN(y) || isNaN(m) || isNaN(d)) {
      next.date_of_birth = 'Please enter a valid date.';
    } else if (!isValidDate(y, m, d)) {
      next.date_of_birth = 'Please enter a valid date.';
    } else if (calculateAgeFromYMD(y, m, d) < 18) {
      next.date_of_birth = 'You must be at least 18 years old.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateGenderIntent = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.gender) next.gender = 'Please select your gender.';
    if (!form.intent) next.intent = 'Please select your intent.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateCity = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.city.trim() || form.city.trim().length < 2) {
      next.city = 'City is required (at least 2 characters).';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateOptionalFields = (): boolean => {
    const next: Record<string, string> = {};
    if (form.height_cm != null && (isNaN(form.height_cm) || form.height_cm < 50 || form.height_cm > 300)) {
      next.height_cm = 'Height must be between 50 and 300 cm.';
    }
    if (!form.preferred_language) {
      next.preferred_language = 'Please select a preferred language.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ─── Navigation ───

  const goNext = () => {
    let valid = true;

    switch (step) {
      case 0:
        valid = validateBasicInfo();
        break;
      case 1:
        valid = validateGenderIntent();
        break;
      case 2:
        valid = validateCity();
        break;
      case 3:
        valid = validateOptionalFields();
        break;
      default:
        break;
    }

    if (!valid) return;

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const retreatStep = () => {
    scrollToTop();
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  // ─── Submit ───

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const compiledDate = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
      const payload: ProfileSetupRequest = {
        ...form,
        date_of_birth: compiledDate,
      };

      await setupProfile(payload);

      if (photo) {
        const ext = photo.uri.split('.').pop() || 'jpg';
        await uploadPhoto({
          uri: photo.uri,
          name: `profile.${ext}`,
          type: photo.mimeType || `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        });
      }

      await fetchProfile();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set up profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPhoto = () => {
    handleSubmit();
  };

  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload a profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhoto(result.assets[0]);
        if (errors.photo) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.photo;
            return next;
          });
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  // ─── Language toggling ───

  const toggleLanguage = (code: string) => {
    setForm((prev) => {
      const exists = prev.languages.includes(code);
      return {
        ...prev,
        languages: exists ? prev.languages.filter((l) => l !== code) : [...prev.languages, code],
      };
    });
  };

  // ─── Step renderers ───

  const renderBasicInfo = () => (
    <View>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>Let us know your name and birthday</Text>

      <Input
        value={form.name}
        onChangeText={(text) => updateField('name', text)}
        placeholder="Your full name"
        label="Name"
        error={errors.name}
        maxLength={50}
        autoFocus
        returnKeyType="next"
      />

      <Text style={styles.sectionLabel}>Date of Birth</Text>
      <View style={styles.dobRow}>
        <View style={styles.dobField}>
          <Input
            value={dobDay}
            onChangeText={(text) => {
              setDobDay(text.replace(/[^0-9]/g, '').slice(0, 2));
              if (errors.date_of_birth) setErrors((e) => ({ ...e, date_of_birth: '' }));
            }}
            placeholder="DD"
            keyboardType="numeric"
            maxLength={2}
            inputStyle={styles.dobInput}
          />
        </View>
        <View style={styles.dobField}>
          <Input
            value={dobMonth}
            onChangeText={(text) => {
              setDobMonth(text.replace(/[^0-9]/g, '').slice(0, 2));
              if (errors.date_of_birth) setErrors((e) => ({ ...e, date_of_birth: '' }));
            }}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
            inputStyle={styles.dobInput}
          />
        </View>
        <View style={styles.dobField}>
          <Input
            value={dobYear}
            onChangeText={(text) => {
              setDobYear(text.replace(/[^0-9]/g, '').slice(0, 4));
              if (errors.date_of_birth) setErrors((e) => ({ ...e, date_of_birth: '' }));
            }}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            inputStyle={styles.dobInput}
          />
        </View>
      </View>
      {errors.date_of_birth ? (
        <Text style={styles.fieldError}>{errors.date_of_birth}</Text>
      ) : null}
    </View>
  );

  const renderGenderIntent = () => (
    <View>
      <Text style={styles.stepTitle}>Your identity</Text>
      <Text style={styles.stepSubtitle}>Select your gender and what you're looking for</Text>

      <Text style={styles.sectionLabel}>Gender</Text>
      <View style={styles.cardRow}>
        {GENDER_OPTIONS.map((opt) => {
          const selected = form.gender === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.selectCard, selected && styles.selectCardActive]}
              onPress={() => updateField('gender', opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardIcon}>{GENDER_ICONS[opt.value]}</Text>
              <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.gender ? <Text style={styles.fieldError}>{errors.gender}</Text> : null}

      <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>I'm looking for</Text>
      <View style={styles.intentGrid}>
        {INTENT_OPTIONS.map((opt) => {
          const selected = form.intent === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.intentCard, selected && styles.intentCardActive]}
              onPress={() => updateField('intent', opt.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.intentIcon}>{INTENT_ICONS[opt.value]}</Text>
              <Text style={[styles.intentLabel, selected && styles.intentLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.intent ? <Text style={styles.fieldError}>{errors.intent}</Text> : null}
    </View>
  );

  const renderCity = () => (
    <View>
      <Text style={styles.stepTitle}>Where are you based?</Text>
      <Text style={styles.stepSubtitle}>Help people in your area find you</Text>

      <Input
        value={form.city}
        onChangeText={(text) => updateField('city', text)}
        placeholder="Your city"
        label="City"
        error={errors.city}
        autoFocus
        returnKeyType="next"
      />

      <Input
        value={form.college || ''}
        onChangeText={(text) => updateField('college', text)}
        placeholder="Your college or university"
        label="College (optional)"
      />

      <Input
        value={form.workplace || ''}
        onChangeText={(text) => updateField('workplace', text)}
        placeholder="Where you work"
        label="Workplace (optional)"
      />
    </View>
  );

  const renderOptionalFields = () => (
    <View>
      <Text style={styles.stepTitle}>A little more about you</Text>
      <Text style={styles.stepSubtitle}>These help your profile stand out</Text>

      <Input
        value={form.bio || ''}
        onChangeText={(text) => updateField('bio', text)}
        placeholder="Write a short bio about yourself..."
        label="Bio"
        multiline
        numberOfLines={4}
        maxLength={500}
        autoFocus
      />

      <Input
        value={form.height_cm != null ? String(form.height_cm) : ''}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '');
          updateField('height_cm', cleaned ? parseInt(cleaned, 10) : undefined);
        }}
        placeholder="e.g. 170"
        label="Height (cm)"
        keyboardType="numeric"
        maxLength={3}
        error={errors.height_cm}
      />

      <Input
        value={form.religion || ''}
        onChangeText={(text) => updateField('religion', text)}
        placeholder="Your religion"
        label="Religion (optional)"
      />

      <Input
        value={form.education || ''}
        onChangeText={(text) => updateField('education', text)}
        placeholder="Your highest education"
        label="Education (optional)"
      />

      <Input
        value={form.occupation || ''}
        onChangeText={(text) => updateField('occupation', text)}
        placeholder="What you do"
        label="Occupation (optional)"
      />

      <Text style={[styles.sectionLabel, { marginTop: spacing.sm }]}>Languages you speak</Text>
      <View style={styles.languageGrid}>
        {LANGUAGE_OPTIONS.map((lang) => {
          const selected = form.languages.includes(lang.code);
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, selected && styles.langChipActive]}
              onPress={() => toggleLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langChipText, selected && styles.langChipTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Preferred language</Text>
      <View style={styles.preferredRow}>
        {LANGUAGE_OPTIONS.map((lang) => {
          const selected = form.preferred_language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.prefCard, selected && styles.prefCardActive]}
              onPress={() => updateField('preferred_language', lang.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.prefCardText, selected && styles.prefCardTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.preferred_language ? (
        <Text style={styles.fieldError}>{errors.preferred_language}</Text>
      ) : null}
    </View>
  );

  const renderPhotoUpload = () => (
    <View>
      <Text style={styles.stepTitle}>Profile photo</Text>
      <Text style={styles.stepSubtitle}>Add a photo so people can see you</Text>

      <View style={styles.photoPreview}>
        <Avatar
          uri={photo?.uri || null}
          name={form.name || undefined}
          size={160}
        />
      </View>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handlePickPhoto}
        activeOpacity={0.7}
      >
        <Text style={styles.uploadIcon}>{photo ? '📷' : '➕'}</Text>
        <Text style={styles.uploadText}>
          {photo ? 'Change Photo' : 'Upload Photo'}
        </Text>
      </TouchableOpacity>

      {photo && (
        <Text style={styles.photoHint}>Tap above to choose a different photo</Text>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderGenderIntent();
      case 2:
        return renderCity();
      case 3:
        return renderOptionalFields();
      case 4:
        return renderPhotoUpload();
      default:
        return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  if (loading && step === TOTAL_STEPS - 1) {
    return (
      <LoadingSpinner
        fullScreen
        message="Setting up your profile..."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <StepDots current={step} total={TOTAL_STEPS} />
        <Text style={styles.stepCounter}>
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentInner}>
          {renderStepContent()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <Button
            title="Back"
            onPress={retreatStep}
            variant="ghost"
            fullWidth={false}
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />

          {isLastStep ? (
            <View style={styles.lastStepButtons}>
              <Button
                title="Skip"
                onPress={handleSkipPhoto}
                variant="outline"
                fullWidth={false}
                style={styles.skipButton}
                loading={loading}
              />
              <Button
                title="Finish"
                onPress={handleSubmit}
                variant="primary"
                fullWidth={false}
                style={styles.finishButton}
                loading={loading}
              />
            </View>
          ) : (
            <Button
              title="Next"
              onPress={() => {
                scrollToTop();
                goNext();
              }}
              variant="primary"
              fullWidth={false}
              style={styles.nextButton}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
  dotCurrent: {
    transform: [{ scale: 1.3 }],
    backgroundColor: colors.primaryDark,
  },
  stepCounter: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  contentInner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerInner: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 70,
  },
  backButtonText: {
    fontSize: fontSize.md,
  },
  nextButton: {
    minWidth: 100,
  },
  lastStepButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipButton: {
    minWidth: 80,
  },
  finishButton: {
    minWidth: 100,
  },

  // ─── Step content ───

  stepTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // ─── Date of Birth ───

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dobRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dobField: {
    flex: 1,
  },
  dobInput: {
    textAlign: 'center',
  },

  // ─── Gender Cards ───

  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  selectCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  selectCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },
  cardLabelActive: {
    color: colors.primary,
  },

  // ─── Intent Cards ───

  intentGrid: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  intentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    ...shadow.sm,
  },
  intentCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  intentIcon: {
    fontSize: 24,
  },
  intentLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  intentLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },

  // ─── Language Picker ───

  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  langChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  langChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  langChipTextActive: {
    color: colors.white,
  },

  // ─── Preferred Language ───

  preferredRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  prefCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  prefCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  prefCardText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  prefCardTextActive: {
    color: colors.white,
  },

  // ─── Photo Upload ───

  photoPreview: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  uploadIcon: {
    fontSize: 20,
  },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.primary,
  },
  photoHint: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
  },

  // ─── Error ───

  fieldError: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
