import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { getMatch } from '../../api/matches';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { getPhotoUrl } from '../../utils/helpers';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchRouteParams {
  match_id?: number;
  other_user_name?: string;
  other_user_photo?: string;
}

export default function MatchScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const params = (route.params ?? {}) as MatchRouteParams;
  const matchId = params.match_id;

  const user = useAuthStore((s) => s.user);
  const [otherUserName, setOtherUserName] = useState(params.other_user_name ?? '');
  const [otherUserPhoto, setOtherUserPhoto] = useState(params.other_user_photo ?? null as string | null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;

  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;
    setIsLoading(true);
    try {
      const res = await getMatch(matchId);
      const match = res.data;
      if (match?.user) {
        setOtherUserName(match.user.name);
        setOtherUserPhoto(match.user.photo_url ?? null);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      fetchMatchData();
    }
  }, [fetchMatchData]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(avatarScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
      delay: 200,
    }).start();
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!matchId) return;
    navigation.replace('ChatDetail', {
      match_id: matchId,
      other_user_name: otherUserName,
    });
  }, [matchId, otherUserName, navigation]);

  const handleKeepSwiping = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LoadingSpinner fullScreen message="Loading match..." />
      </SafeAreaView>
    );
  }

  if (hasError || !matchId) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.overlay}>
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackIcon}>💫</Text>
            <Text style={styles.fallbackTitle}>No match data</Text>
            <Text style={styles.fallbackSubtitle}>
              We couldn't load the match details. The match may have expired.
            </Text>
            <Button
              title="Go Back"
              onPress={handleKeepSwiping}
              variant="outline"
              fullWidth={false}
              style={styles.fallbackButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentUserName = user?.name ?? 'You';
  const currentUserPhoto = user?.photos?.[0]?.photo_url ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay}>
        {/* ─── Match Header ─── */}
        <Animated.Text
          style={[
            styles.matchHeader,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {"It's a Match!"}
        </Animated.Text>

        {/* ─── Avatars ─── */}
        <Animated.View
          style={[
            styles.avatarsRow,
            { opacity: fadeAnim, transform: [{ scale: avatarScale }] },
          ]}
        >
          <View style={styles.avatarContainer}>
            {currentUserPhoto ? (
              <Image
                source={{ uri: getPhotoUrl(currentUserPhoto) }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {currentUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.avatarName}>{currentUserName}</Text>
          </View>

          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
          </View>

          <View style={styles.avatarContainer}>
            {otherUserPhoto ? (
              <Image
                source={{ uri: getPhotoUrl(otherUserPhoto) }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {otherUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.avatarName}>{otherUserName}</Text>
          </View>
        </Animated.View>

        {/* ─── Subtitle ─── */}
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          You and {otherUserName} liked each other
        </Animated.Text>

        {/* ─── Buttons ─── */}
        <Animated.View style={[styles.buttonsRow, { opacity: fadeAnim }]}>
          <Button
            title="Send a Message"
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
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a0f0a',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 5, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  // ─── Match Header ───
  matchHeader: {
    fontSize: fontSize.xxxl + 4,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // ─── Avatars ───
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 44,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  avatarName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.white,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 120,
  },
  heartContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  heartIcon: {
    fontSize: 22,
    color: colors.white,
  },

  // ─── Subtitle ───
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // ─── Buttons ───
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  matchButton: {
    minWidth: 140,
    flex: 1,
  },

  // ─── Fallback ───
  fallbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: SCREEN_WIDTH - spacing.lg * 2,
    alignItems: 'center',
    ...shadow.lg,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  fallbackTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fallbackSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  fallbackButton: {
    minWidth: 160,
  },
});
