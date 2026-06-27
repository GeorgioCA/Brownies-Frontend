import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList, UserProfile, Photo, VoicePrompt, VerificationStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  getMyProfile,
  uploadPhoto,
  deletePhoto,
  getVoicePrompts,
  uploadVoicePrompt,
  deleteVoicePrompt,
} from '../../api/profile';
import { getVerificationStatus, uploadVerificationPhoto } from '../../api/verification';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Avatar } from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';
import { calculateAge, getPhotoUrl } from '../../utils/helpers';
import { MAX_PHOTOS } from '../../utils/constants';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<ProfileStackParamList, 'MyProfile'>;

const INTENT_LABELS: Record<string, string> = {
  lets_see: "Let's See",
  serious_relationship: 'Serious Relationship',
  casual: 'Casual',
  friendship: 'Friendship',
  marriage: 'Marriage',
};

export default function MyProfileScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [voicePrompts, setVoicePrompts] = useState<VoicePrompt[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [voiceUploading, setVoiceUploading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, verifyRes, voiceRes] = await Promise.all([
        getMyProfile(),
        getVerificationStatus(),
        getVoicePrompts(),
      ]);
      setProfile(profileRes.data);
      setVerification(verifyRes.data);
      setVoicePrompts(voiceRes.data ?? []);
    } catch {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentProfile = profile ?? user;
  const photos = currentProfile?.photos ?? [];
  const prompts = voicePrompts.length > 0 ? voicePrompts : (currentProfile?.voice_prompts ?? []);

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'We need access to your photo library to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;

      setPhotoUploading(true);
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      await uploadPhoto({
        uri: asset.uri,
        name: `photo_${Date.now()}.${ext}`,
        type: asset.mimeType ?? `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });
      await fetchProfile();
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    if (photos.length <= 1) return;
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(photoId);
            await fetchProfile();
            await loadData();
          } catch {
            Alert.alert('Error', 'Failed to delete photo.');
          }
        },
      },
    ]);
  };

  const handleVerifyPhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'We need camera access for photo verification.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;

      setPhotoUploading(true);
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      await uploadVerificationPhoto({
        uri: asset.uri,
        name: `verify_${Date.now()}.${ext}`,
        type: asset.mimeType ?? `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });
      await fetchProfile();
      await loadData();
      Alert.alert('Submitted', 'Your verification photo has been submitted for review.');
    } catch {
      Alert.alert('Error', 'Failed to upload verification photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleAddVoicePrompt = async () => {
    Alert.alert(
      'Add Voice Prompt',
      'Record a voice prompt to add personality to your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record',
          onPress: async () => {
            setVoiceUploading(true);
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert('Permission Required', 'Microphone access is needed for voice prompts.');
                return;
              }
              await uploadVoicePrompt(
                { uri: '', name: 'prompt.m4a', type: 'audio/m4a' },
                'What makes a relationship great?',
                15,
              );
              await fetchProfile();
              await loadData();
            } catch {
              Alert.alert('Error', 'Failed to add voice prompt.');
            } finally {
              setVoiceUploading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteVoicePrompt = (id: number) => {
    Alert.alert('Delete Voice Prompt', 'Remove this voice prompt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVoicePrompt(id);
            await fetchProfile();
            await loadData();
          } catch {
            Alert.alert('Error', 'Failed to delete voice prompt.');
          }
        },
      },
    ]);
  };

  if (loading && !currentProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner fullScreen message="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (error && !currentProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Button title="Retry" onPress={loadData} variant="outline" fullWidth={false} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  const age = currentProfile ? calculateAge(currentProfile.date_of_birth) : 0;
  const isPhoneVerified = verification?.phone_verified ?? currentProfile?.phone_verified ?? false;
  const isPhotoVerified = verification?.photo_verified ?? currentProfile?.photo_verified ?? false;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Photos Section ─── */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoWrapper}>
                <Image source={{ uri: getPhotoUrl(photo.photo_url) }} style={styles.photoThumb} resizeMode="cover" />
                {photos.length > 1 && (
                  <TouchableOpacity
                    style={styles.photoDelete}
                    onPress={() => handleDeletePhoto(photo.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.photoDeleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {photos.length === 0 && (
              <View style={styles.photoPlaceholder}>
                <Avatar name={currentProfile?.name} size={120} />
              </View>
            )}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
                disabled={photoUploading}
              >
                <Text style={styles.addPhotoIcon}>{photoUploading ? '⏳' : '+'}</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ─── Premium Badge ─── */}
        {currentProfile?.is_premium && (
          <View style={styles.sectionCentered}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>★ Premium</Text>
            </View>
          </View>
        )}

        {/* ─── Verification Section ─── */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Verification</Text>
            <View style={styles.verifyRow}>
              <View style={[styles.verifyBadge, isPhoneVerified ? styles.verifyBadgeSuccess : styles.verifyBadgeWarning]}>
                <Text style={[styles.verifyBadgeText, isPhoneVerified ? styles.verifyBadgeTextSuccess : styles.verifyBadgeTextWarning]}>
                  {isPhoneVerified ? '✓ Phone Verified' : '○ Phone Not Verified'}
                </Text>
              </View>
              <View style={[styles.verifyBadge, isPhotoVerified ? styles.verifyBadgeSuccess : styles.verifyBadgeWarning]}>
                <Text style={[styles.verifyBadgeText, isPhotoVerified ? styles.verifyBadgeTextSuccess : styles.verifyBadgeTextWarning]}>
                  {isPhotoVerified ? '✓ Photo Verified' : '○ Photo Not Verified'}
                </Text>
              </View>
            </View>
            {!isPhotoVerified && (
              <Button
                title="Verify Photo"
                onPress={handleVerifyPhoto}
                variant="outline"
                size="sm"
                fullWidth={false}
                loading={photoUploading}
                style={styles.verifyButton}
              />
            )}
          </Card>
        </View>

        {/* ─── Profile Info ─── */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <View style={styles.infoHeader}>
              <View style={styles.infoHeaderLeft}>
                <Text style={styles.name}>{currentProfile?.name}, {age}</Text>
                <View style={styles.genderCityRow}>
                  <Text style={styles.genderBadge}>
                    {currentProfile?.gender === 'male' ? '♂' : '♀'}
                  </Text>
                  <Text style={styles.city}>{currentProfile?.city}</Text>
                </View>
              </View>
              <View style={styles.intentBadge}>
                <Text style={styles.intentText}>
                  {INTENT_LABELS[currentProfile?.intent ?? ''] ?? currentProfile?.intent}
                </Text>
              </View>
            </View>

            {!!currentProfile?.bio && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>About</Text>
                <Text style={styles.infoValue}>{currentProfile.bio}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              {currentProfile?.height_cm != null && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Height</Text>
                  <Text style={styles.statValue}>{currentProfile.height_cm} cm</Text>
                </View>
              )}
              {!!currentProfile?.religion && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Religion</Text>
                  <Text style={styles.statValue}>{currentProfile.religion}</Text>
                </View>
              )}
              {!!currentProfile?.education && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Education</Text>
                  <Text style={styles.statValue}>{currentProfile.education}</Text>
                </View>
              )}
              {!!currentProfile?.occupation && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Occupation</Text>
                  <Text style={styles.statValue}>{currentProfile.occupation}</Text>
                </View>
              )}
            </View>

            {(currentProfile?.college || currentProfile?.workplace) && (
              <>
                <View style={styles.divider} />
                {!!currentProfile?.college && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>College</Text>
                    <Text style={styles.infoValue}>{currentProfile.college}</Text>
                  </View>
                )}
                {!!currentProfile?.workplace && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Workplace</Text>
                    <Text style={styles.infoValue}>{currentProfile.workplace}</Text>
                  </View>
                )}
              </>
            )}

            {currentProfile?.languages && currentProfile.languages.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Languages</Text>
                  <View style={styles.chipsRow}>
                    {currentProfile.languages.map((lang, idx) => (
                      <View key={idx} style={styles.chip}>
                        <Text style={styles.chipText}>{lang.language}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* ─── Voice Prompts Section ─── */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <View style={styles.voiceHeader}>
              <Text style={styles.sectionTitle}>Voice Prompts</Text>
              <Button
                title="Add Voice Prompt"
                onPress={handleAddVoicePrompt}
                variant="outline"
                size="sm"
                fullWidth={false}
                loading={voiceUploading}
              />
            </View>
            {prompts.length === 0 ? (
              <Text style={styles.emptyText}>No voice prompts yet. Add one to stand out!</Text>
            ) : (
              prompts.map((vp) => (
                <View key={vp.id} style={styles.voiceItem}>
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceQuestion}>{vp.prompt_question}</Text>
                    <Text style={styles.voiceDuration}>{vp.duration_seconds}s</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteVoicePrompt(vp.id)}
                    activeOpacity={0.7}
                    style={styles.voiceDelete}
                  >
                    <Text style={styles.voiceDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* ─── Edit Profile Button ─── */}
        <View style={styles.section}>
          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            variant="primary"
            size="lg"
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.text,
  },

  // ─── Photos ───
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionCentered: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photosRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 130,
    height: 173,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  photoDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoDeleteText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 130,
    height: 173,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  addPhotoIcon: {
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  addPhotoText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // ─── Premium Badge ───
  premiumBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  premiumText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  // ─── Card ───
  card: {
    padding: spacing.md,
  },

  // ─── Verification ───
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  verifyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  verifyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  verifyBadgeSuccess: {
    backgroundColor: colors.success + '1A',
  },
  verifyBadgeWarning: {
    backgroundColor: colors.warning + '1A',
  },
  verifyBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  verifyBadgeTextSuccess: {
    color: colors.success,
  },
  verifyBadgeTextWarning: {
    color: colors.warning,
  },
  verifyButton: {
    alignSelf: 'flex-start',
  },

  // ─── Profile Info ───
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoHeaderLeft: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  genderCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  genderBadge: {
    fontSize: fontSize.lg,
  },
  city: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  intentBadge: {
    backgroundColor: colors.gold + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  intentText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
  },

  // ─── Stats Grid ───
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    width: '46%',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },

  // ─── Languages ───
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  // ─── Voice Prompts ───
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: colors.white,
    fontSize: 14,
    marginLeft: 2,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceQuestion: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  voiceDuration: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  voiceDelete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceDeleteText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },

  // ─── Error ───
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 160,
  },
});
