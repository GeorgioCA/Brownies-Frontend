import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Match, ChatsStackParamList } from '../../types';
import { getMatches } from '../../api/matches';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/Button';
import { formatTime } from '../../utils/helpers';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList>>();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const chatMessages = useChatStore((s) => s.messages);

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await getMatches();
      setMatches(res.data ?? []);
    } catch {
      setError('Failed to load conversations.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches]),
  );

  const handleRefresh = useCallback(() => {
    fetchMatches(true);
  }, [fetchMatches]);

  const getLastMessage = useCallback(
    (matchId: number): { text: string; time: string; isMine: boolean; isRead: boolean } | null => {
      const msgs = chatMessages[matchId];
      if (!msgs || msgs.length === 0) return null;
      const last = msgs[msgs.length - 1];
      return {
        text: last.content,
        time: formatTime(last.created_at),
        isMine: last.sender_id === currentUserId,
        isRead: last.is_read,
      };
    },
    [chatMessages, currentUserId],
  );

  const getUnreadCount = useCallback(
    (matchId: number): number => {
      const msgs = chatMessages[matchId];
      if (!msgs) return 0;
      return msgs.filter((m) => m.sender_id !== currentUserId && !m.is_read).length;
    },
    [chatMessages, currentUserId],
  );

  const totalUnreadCount = matches.reduce(
    (sum, m) => sum + getUnreadCount(m.id),
    0,
  );

  const handleMatchPress = useCallback(
    (match: Match) => {
      navigation.navigate('ChatDetail', {
        match_id: match.id,
        other_user_name: match.user.name,
      });
    },
    [navigation],
  );

  const handleGoToDiscovery = useCallback(() => {
    navigation.getParent()?.navigate('DiscoverTab');
  }, [navigation]);

  const renderMatchItem = useCallback(
    ({ item }: { item: Match }) => {
      const lastMsg = getLastMessage(item.id);
      const unread = getUnreadCount(item.id);
      const hasUnread = unread > 0;
      const matchUser = item.user;

      return (
        <TouchableOpacity
          style={styles.matchItem}
          activeOpacity={0.6}
          onPress={() => handleMatchPress(item)}
        >
          <Avatar
            name={matchUser.name}
            size={48}
            showBadge={matchUser.photo_verified}
          />

          <View style={styles.matchCenter}>
            <View style={styles.matchTopRow}>
              <Text style={styles.matchName} numberOfLines={1}>
                {matchUser.name}
              </Text>
              {lastMsg && (
                <Text style={styles.matchTime}>{lastMsg.time}</Text>
              )}
            </View>
            <Text
              style={[styles.matchPreview, hasUnread && styles.matchPreviewBold]}
              numberOfLines={1}
            >
              {lastMsg
                ? `${lastMsg.isMine ? 'You: ' : ''}${lastMsg.text}`
                : 'Say hi! 👋'}
            </Text>
          </View>

          <View style={styles.matchRight}>
            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            ) : lastMsg?.isMine && lastMsg?.isRead ? (
              <Text style={styles.readReceipt}>✓</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [getLastMessage, getUnreadCount, handleMatchPress],
  );

  const keyExtractor = useCallback((item: Match) => item.id.toString(), []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <LoadingSpinner fullScreen message="Loading conversations..." />
      </SafeAreaView>
    );
  }

  if (error && !isRefreshing && matches.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Button
            title="Try Again"
            onPress={() => fetchMatches(true)}
            variant="outline"
            fullWidth={false}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {totalUnreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Match List ─── */}
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          matches.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Start swiping to find your perfect match!
            </Text>
            <Button
              title="Discover People"
              onPress={handleGoToDiscovery}
              variant="primary"
              fullWidth={false}
              style={styles.emptyButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // ─── List ───
  listContent: {
    paddingBottom: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // ─── Match Item ───
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  matchCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  matchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  matchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  matchTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  matchPreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  matchPreviewBold: {
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },
  matchRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 28,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.white,
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  readReceipt: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },

  // ─── Empty ───
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: 300,
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
    minWidth: 180,
  },
});
