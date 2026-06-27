import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DiscoverStackParamList, UserProfile, SwipeResponse } from '../../types';
import { PhotoCarousel } from '../../components/PhotoCarousel';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';
import { getUserProfile } from '../../api/profile';
import { swipe } from '../../api/discovery';
import { reportUser, blockUser } from '../../api/reports';
import { calculateAge } from '../../utils/helpers';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'ProfileDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTENT_LABELS: Record<string, string> = {
  lets_see: "Let's See",
  serious_relationship: 'Serious Relationship',
  casual: 'Casual',
  friendship: 'Friendship',
  marriage: 'Marriage',
};

export default function ProfileDetailScreen({ navigation, route }: Props) {
  const { user_id } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const matchFadeAnim = useRef(new Animated.Value(0)).current;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserProfile(user_id);
      setProfile(res.data);
    } catch {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (showMatch) {
      matchFadeAnim.setValue(0);
      Animated.spring(matchFadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [showMatch]);

  const handleSwipeAction = useCallback(
    async (direction: 'like' | 'super_like' | 'pass') => {
      if (actionLoading || !profile) return;
      setActionLoading(true);
      try {
        const res = await swipe({ swiped_id: profile.id, direction });
        const data = res.data as SwipeResponse;
        if (data.is_match) {
          setShowMatch(true);
        }
      } catch {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, profile],
  );

  const handleReport = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportUser({ reported_id: profile.id, reason: 'Inappropriate Behavior' });
              Alert.alert('Reported', 'Thank you for letting us know.');
            } catch {
              Alert.alert('Error', 'Failed to report. Please try again.');
            }
          },
        },
      ],
    );
  }, [profile]);

  const handleBlock = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Block User',
      "Are you sure you want to block this user? You won't see their profile again.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser({ blocked_id: profile.id });
              Alert.alert('Blocked', 'User has been blocked.');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to block. Please try again.');
            }
          },
        },
      ],
    );
  }, [profile, navigation]);

  const handleKeepSwiping = useCallback(() => {
    setShowMatch(false);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner fullScreen message="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error ?? 'Profile not found.'}</Text>
          <Button
            title="Retry"
            onPress={fetchProfile}
            variant="outline"
            fullWidth={false}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const photos = profile.photos ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Photo Carousel ─── */}
        <View style={styles.photoContainer}>
          <PhotoCarousel photos={photos} height={400} width={SCREEN_WIDTH} />
          <View style={styles.photoOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.nameAgeContainer}>
              <Text style={styles.nameAgeOverlay}>
                {profile.name}, {age}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Basic Info ─── */}
        <View style={styles.section}>
          <Card style={styles.card}>
            <Text style={styles.name}>
              {profile.name}, {age}
            </Text>
            <Text style={styles.city}>{profile.city}</Text>
          </Card>
        </View>

        {/* ─── Photo Verified Badge ─── */}
        {profile.photo_verified && (
          <View style={styles.sectionCentered}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Photo Verified</Text>
            </View>
          </View>
        )}

        {/* ─── Intent Badge ─── */}
        <View style={styles.sectionCentered}>
          <View style={styles.intentBadge}>
            <Text style={styles.intentText}>
              {INTENT_LABELS[profile.intent] ?? profile.intent}
            </Text>
          </View>
        </View>

        {/* ─── Bio ─── */}
        {!!profile.bio && (
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </Card>
          </View>
        )}

        {/* ─── Stats Grid ─── */}
        {(profile.height_cm || profile.religion || profile.education || profile.occupation) && (
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.statsGrid}>
                {!!profile.height_cm && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Height</Text>
                    <Text style={styles.statValue}>{profile.height_cm} cm</Text>
                  </View>
                )}
                {!!profile.religion && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Religion</Text>
                    <Text style={styles.statValue}>{profile.religion}</Text>
                  </View>
                )}
                {!!profile.education && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Education</Text>
                    <Text style={styles.statValue}>{profile.education}</Text>
                  </View>
                )}
                {!!profile.occupation && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Occupation</Text>
                    <Text style={styles.statValue}>{profile.occupation}</Text>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* ─── Languages ─── */}
        {profile.languages && profile.languages.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.chipsRow}>
                {profile.languages.map((lang, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{lang.language}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* ─── Voice Prompts ─── */}
        {profile.voice_prompts && profile.voice_prompts.length > 0 && (
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Voice Prompts</Text>
              {profile.voice_prompts.map((vp) => (
                <TouchableOpacity
                  key={vp.id}
                  style={styles.voiceItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceQuestion}>{vp.prompt_question}</Text>
                    <Text style={styles.voiceDuration}>{vp.duration_seconds}s</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* ─── College / Workplace ─── */}
        {(profile.college || profile.workplace) && (
          <View style={styles.section}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Work & Education</Text>
              {!!profile.college && (
                <View style={styles.schoolItem}>
                  <Text style={styles.schoolLabel}>College</Text>
                  <Text style={styles.schoolValue}>{profile.college}</Text>
                </View>
              )}
              {!!profile.workplace && (
                <View style={styles.schoolItem}>
                  <Text style={styles.schoolLabel}>Workplace</Text>
                  <Text style={styles.schoolValue}>{profile.workplace}</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* ─── Report & Block ─── */}
        <View style={styles.reportBlockRow}>
          <TouchableOpacity onPress={handleReport} activeOpacity={0.6}>
            <Text style={styles.reportBlockText}>Report</Text>
          </TouchableOpacity>
          <Text style={styles.reportBlockDivider}>·</Text>
          <TouchableOpacity onPress={handleBlock} activeOpacity={0.6}>
            <Text style={styles.reportBlockText}>Block</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomAction}>
          <Button
            title="Pass"
            onPress={() => handleSwipeAction('pass')}
            variant="outline"
            loading={actionLoading}
            fullWidth
            style={styles.bottomButton}
            textStyle={styles.passButtonText}
          />
        </View>
        <View style={styles.bottomAction}>
          <Button
            title="Like"
            onPress={() => handleSwipeAction('like')}
            variant="primary"
            loading={actionLoading}
            fullWidth
            style={styles.bottomButton}
          />
        </View>
        <View style={styles.bottomAction}>
          <Button
            title="Super Like"
            onPress={() => handleSwipeAction('super_like')}
            variant="primary"
            loading={actionLoading}
            fullWidth
            style={[styles.bottomButton, styles.superLikeButton]}
            textStyle={styles.superLikeButtonText}
          />
        </View>
      </View>

      {/* ─── Match Modal ─── */}
      <Modal
        visible={showMatch}
        transparent
        animationType="fade"
        onRequestClose={handleKeepSwiping}
      >
        <View style={styles.matchOverlay}>
          <Animated.View
            style={[
              styles.matchCard,
              {
                opacity: matchFadeAnim,
                transform: [
                  {
                    scale: matchFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.matchHeader}>It's a Match!</Text>
            <Text style={styles.matchSubtext}>
              You and {profile.name} liked each other
            </Text>
            <View style={styles.matchButtons}>
              <Button
                title="Keep Swiping"
                onPress={handleKeepSwiping}
                variant="ghost"
                fullWidth={false}
                style={styles.matchButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
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

  // ─── Photo ───
  photoContainer: {
    position: 'relative',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  backButton: {
    marginTop: spacing.md,
    marginLeft: spacing.md,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
  },
  nameAgeContainer: {
    marginBottom: spacing.lg,
    marginLeft: spacing.md,
  },
  nameAgeOverlay: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ─── Sections ───
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionCentered: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },

  // ─── Basic Info ───
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  city: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },

  // ─── Verified ───
  verifiedBadge: {
    backgroundColor: colors.success + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verifiedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },

  // ─── Intent ───
  intentBadge: {
    backgroundColor: colors.gold + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  intentText: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // ─── Bio ───
  bioText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
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

  // ─── College / Workplace ───
  schoolItem: {
    marginBottom: spacing.sm,
  },
  schoolLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  schoolValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },

  // ─── Report & Block ───
  reportBlockRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  reportBlockText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  reportBlockDivider: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },

  // ─── Bottom Bar ───
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  bottomAction: {
    flex: 1,
  },
  bottomButton: {
    borderRadius: radius.md,
  },
  passButtonText: {
    color: colors.pass,
  },
  superLikeButton: {
    backgroundColor: colors.superLike,
  },
  superLikeButtonText: {
    color: colors.white,
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

  // ─── Match Modal ───
  matchOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    width: SCREEN_WIDTH - spacing.lg * 2,
    alignItems: 'center',
    ...shadow.lg,
  },
  matchHeader: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  matchSubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  matchButton: {
    minWidth: 130,
    flex: 1,
  },
});
