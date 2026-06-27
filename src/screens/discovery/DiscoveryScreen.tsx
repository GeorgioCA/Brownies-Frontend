import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DiscoverStackParamList } from '../../types';
import { useDiscoveryStore } from '../../store/discoveryStore';
import { useAuthStore } from '../../store/authStore';
import { SwipeCard } from '../../components/SwipeCard';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'Discovery'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_BUTTON_SIZE = 52;
const LARGE_BUTTON_SIZE = 60;

export default function DiscoveryScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const {
    profiles,
    currentIndex,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    stats,
    lastMatchId,
    fetchProfiles,
    swipe,
    undoLastSwipe,
    fetchStats,
    goToNext,
    getCurrentProfile,
    canSwipe,
  } = useDiscoveryStore();

  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<{ id: number; name: string; photoUrl: string | null } | null>(null);
  const [directionOverlay, setDirectionOverlay] = useState<'like' | 'super_like' | 'pass' | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const matchFadeAnim = useRef(new Animated.Value(0)).current;
  const directionOpacity = useRef(new Animated.Value(0)).current;

  const currentProfile = getCurrentProfile();
  const hasProfiles = profiles.length > 0;
  const isEmpty = !isLoading && !hasProfiles && !currentProfile;
  const showEmpty = !isLoading && hasProfiles && !currentProfile;

  useEffect(() => {
    fetchProfiles();
    fetchStats();
  }, []);

  useEffect(() => {
    if (hasProfiles && currentIndex >= profiles.length - 2 && hasMore && !isLoading) {
      fetchProfiles();
    }
  }, [currentIndex, profiles.length, hasMore, isLoading]);

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

  const showDirectionOverlay = useCallback((direction: 'like' | 'super_like' | 'pass') => {
    setDirectionOverlay(direction);
    directionOpacity.setValue(1);
    Animated.timing(directionOpacity, {
      toValue: 0,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start(() => setDirectionOverlay(null));
  }, [directionOpacity]);

  const handleSwipe = useCallback(
    async (direction: 'like' | 'super_like' | 'pass') => {
      if (isSwiping) return;

      if ((direction === 'like' || direction === 'super_like') && !canSwipe()) {
        const label = direction === 'super_like' ? 'Super Likes' : 'likes';
        Alert.alert(
          `You're out of ${label}!`,
          'Upgrade to Premium for unlimited likes.',
        );
        return;
      }

      setIsSwiping(true);
      try {
        const result = await swipe(direction);
        showDirectionOverlay(direction);

        if (result.is_match && currentProfile) {
          setMatchedProfile({
            id: currentProfile.id,
            name: currentProfile.name,
            photoUrl: currentProfile.photos?.[0]?.photo_url ?? null,
          });
          setShowMatch(true);
        }
      } catch {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsSwiping(false);
      }
    },
    [isSwiping, canSwipe, swipe, currentProfile, showDirectionOverlay],
  );

  const handlePass = useCallback(async () => {
    await handleSwipe('pass');
    goToNext();
  }, [handleSwipe, goToNext]);

  const handleUndo = useCallback(async () => {
    if (isSwiping) return;
    setIsSwiping(true);
    try {
      await undoLastSwipe();
    } catch {
      Alert.alert('Error', 'Could not undo last swipe.');
    } finally {
      setIsSwiping(false);
    }
  }, [isSwiping, undoLastSwipe]);

  const handleCardPress = useCallback(() => {
    if (currentProfile) {
      navigation.navigate('ProfileDetail', { user_id: currentProfile.id });
    }
  }, [currentProfile, navigation]);

  const handleSendMessage = useCallback(() => {
    setShowMatch(false);
    setMatchedProfile(null);
    navigation.navigate('ChatsTab' as any, {
      screen: 'ChatDetail',
      params: { match_id: lastMatchId!, other_user_name: matchedProfile?.name },
    });
  }, [lastMatchId, matchedProfile, navigation]);

  const handleKeepSwiping = useCallback(() => {
    setShowMatch(false);
    setMatchedProfile(null);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProfiles(true);
    fetchStats();
  }, [fetchProfiles, fetchStats]);

  const getDirectionConfig = () => {
    switch (directionOverlay) {
      case 'like':
        return { icon: '♥', bg: colors.like, label: 'LIKE' };
      case 'super_like':
        return { icon: '★', bg: colors.superLike, label: 'SUPER LIKE' };
      case 'pass':
        return { icon: '✕', bg: colors.pass, label: 'NOPE' };
      default:
        return null;
    }
  };

  const directionConfig = getDirectionConfig();

  const renderStatsChips = () => (
    <View style={styles.statsRow}>
      {stats && (
        <>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>♥</Text>
            <Text style={styles.statValue}>{stats.likes_remaining}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statIcon, styles.superLikeIcon]}>★</Text>
            <Text style={styles.statValue}>{stats.super_likes_remaining}</Text>
          </View>
        </>
      )}
    </View>
  );

  const renderCardArea = () => {
    if (isLoading && !hasProfiles) {
      return <LoadingSpinner fullScreen message="Finding people near you..." />;
    }

    if (error && !hasProfiles) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Could not load profiles</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button
            title="Try Again"
            onPress={handleRefresh}
            variant="outline"
            fullWidth={false}
            style={styles.emptyButton}
          />
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍪</Text>
          <Text style={styles.emptyTitle}>No profiles found</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't load any profiles. Check your connection and try again.
          </Text>
          <Button
            title="Try Again"
            onPress={handleRefresh}
            variant="outline"
            fullWidth={false}
            style={styles.emptyButton}
          />
        </View>
      );
    }

    if (showEmpty) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍪</Text>
          <Text style={styles.emptyTitle}>No more profiles nearby</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new people in your area!
          </Text>
          <Button
            title="Refresh"
            onPress={handleRefresh}
            variant="outline"
            fullWidth={false}
            style={styles.emptyButton}
          />
        </View>
      );
    }

    if (!currentProfile) {
      return <LoadingSpinner fullScreen message="Loading profiles..." />;
    }

    return (
      <View style={styles.cardContainer}>
        <SwipeCard profile={currentProfile} onPress={handleCardPress} />

        {directionOverlay && directionConfig && (
          <Animated.View
            style={[styles.directionOverlay, { opacity: directionOpacity }]}
            pointerEvents="none"
          >
            <View
              style={[styles.directionBadge, { borderColor: directionConfig.bg }]}
            >
              <Text style={[styles.directionText, { color: directionConfig.bg }]}>
                {directionConfig.label}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>Brownies</Text>
        {renderStatsChips()}
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={!!currentProfile}
      >
        {renderCardArea()}
      </ScrollView>

      {/* ─── Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSmall]}
          onPress={handleUndo}
          disabled={isSwiping}
          activeOpacity={0.6}
        >
          <Text style={styles.actionIconSmall}>↩</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPass]}
          onPress={handlePass}
          disabled={isSwiping}
          activeOpacity={0.6}
        >
          <Text style={[styles.actionIcon, styles.passIcon]}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnLike]}
          onPress={() => handleSwipe('like')}
          disabled={isSwiping}
          activeOpacity={0.6}
        >
          <Text style={[styles.actionIcon, styles.likeIcon]}>♥</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSuper]}
          onPress={() => handleSwipe('super_like')}
          disabled={isSwiping}
          activeOpacity={0.6}
        >
          <Text style={[styles.actionIcon, styles.superIcon]}>★</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Match Modal ─── */}
      <Modal
        visible={showMatch}
        transparent
        animationType="fade"
        onRequestClose={handleKeepSwiping}
      >
        <View style={styles.matchOverlay}>
          <Animated.View style={[styles.matchCard, { opacity: matchFadeAnim, transform: [{ scale: matchFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
            <Text style={styles.matchHeader}>It's a Match!</Text>

            <View style={styles.matchPhotos}>
              <View style={styles.matchPhotoContainer}>
                {user?.photos?.[0]?.photo_url ? (
                  <Image
                    source={{
                      uri: user.photos[0].photo_url.startsWith('http')
                        ? user.photos[0].photo_url
                        : `http://localhost:8000${user.photos[0].photo_url}`,
                    }}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.matchPhoto, styles.matchPhotoPlaceholder]}>
                    <Text style={styles.matchPhotoInitial}>
                      {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.matchName}>{user?.name ?? 'You'}</Text>
              </View>

              <View style={styles.matchPhotoContainer}>
                {matchedProfile?.photoUrl ? (
                  <Image
                    source={{
                      uri: matchedProfile.photoUrl.startsWith('http')
                        ? matchedProfile.photoUrl
                        : `http://localhost:8000${matchedProfile.photoUrl}`,
                    }}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.matchPhoto, styles.matchPhotoPlaceholder]}>
                    <Text style={styles.matchPhotoInitial}>
                      {matchedProfile?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.matchName}>{matchedProfile?.name ?? ''}</Text>
              </View>
            </View>

            <Text style={styles.matchSubtext}>
              You and {matchedProfile?.name} liked each other
            </Text>

            <View style={styles.matchButtons}>
              <Button
                title="Send Message"
                onPress={handleSendMessage}
                variant="primary"
                fullWidth={false}
                style={styles.matchButton}
              />
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

  // ─── Top Bar ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  appName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: 4,
    ...shadow.sm,
  },
  statIcon: {
    fontSize: fontSize.sm,
    color: colors.like,
  },
  superLikeIcon: {
    color: colors.superLike,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },

  // ─── Scroll Content ───
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Main Area ───
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Empty / Error State ───
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 160,
  },

  // ─── Direction Overlay ───
  directionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  directionBadge: {
    borderWidth: 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  directionText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
  },

  // ─── Bottom Action Bar ───
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: ACTION_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadow.md,
  },
  actionBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actionBtnPass: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.pass,
  },
  actionBtnLike: {
    width: LARGE_BUTTON_SIZE,
    height: LARGE_BUTTON_SIZE,
    borderRadius: LARGE_BUTTON_SIZE / 2,
    backgroundColor: colors.like,
    ...shadow.lg,
  },
  actionBtnSuper: {
    backgroundColor: colors.superLike,
  },
  actionIcon: {
    fontSize: 22,
    color: colors.white,
  },
  actionIconSmall: {
    fontSize: 18,
    color: colors.gold,
    fontWeight: fontWeight.bold,
  },
  passIcon: {
    color: colors.pass,
    fontSize: 24,
  },
  likeIcon: {
    fontSize: 26,
  },
  superIcon: {
    fontSize: 22,
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
  matchPhotos: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  matchPhotoContainer: {
    alignItems: 'center',
  },
  matchPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  matchPhotoPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPhotoInitial: {
    fontSize: 40,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  matchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
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
