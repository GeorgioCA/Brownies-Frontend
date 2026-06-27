import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, radius, fontSize, fontWeight, shadow, spacing } from '../theme';
import { Card } from './Card';
import { formatDistance } from '../utils/helpers';
import type { DiscoveryProfile } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface SwipeCardProps {
  profile: DiscoveryProfile;
  onPress: () => void;
}

export function SwipeCard({ profile, onPress }: SwipeCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
      <Card style={styles.card}>
        {/* Photo */}
        {profile.photos && profile.photos.length > 0 ? (
          <Image
            source={{ uri: profile.photos[0].photo_url.startsWith('http') ? profile.photos[0].photo_url : `http://localhost:8000${profile.photos[0].photo_url}` }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {profile.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View style={styles.overlay} />

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.photo_verified && (
              <Text style={styles.verified}>✓</Text>
            )}
          </View>

          <View style={styles.details}>
            {profile.city && <Text style={styles.detail}>{profile.city}</Text>}
            {profile.city && profile.distance_km != null && (
              <Text style={styles.dot}>·</Text>
            )}
            {profile.distance_km != null && (
              <Text style={styles.detail}>{formatDistance(profile.distance_km)}</Text>
            )}
          </View>

          {profile.bio && (
            <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
          )}

          {profile.intent && (
            <View style={styles.intentBadge}>
              <Text style={styles.intentText}>{profile.intent.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Text>
            </View>
          )}
        </View>

        {/* Photo count dots */}
        {profile.photos && profile.photos.length > 1 && (
          <View style={styles.dotsRow}>
            {profile.photos.map((_, i) => (
              <View key={i} style={[styles.dot_indicator, i === 0 && styles.dotActive]} />
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: (SCREEN_WIDTH - 32) * 1.4,
    padding: 0,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  photoPlaceholderText: {
    fontSize: 72,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  verified: {
    fontSize: 18,
    color: colors.gold,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detail: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  dot: {
    marginHorizontal: 4,
    color: 'rgba(255,255,255,0.6)',
  },
  bio: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 18,
  },
  intentBadge: {
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  intentText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  dotsRow: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot_indicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: colors.white },
});
