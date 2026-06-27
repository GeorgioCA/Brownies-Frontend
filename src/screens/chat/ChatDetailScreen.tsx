import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatsStackParamList, Message } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Avatar } from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/Button';
import { formatTime } from '../../utils/helpers';
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '../../theme';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatDetail'>;

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function getDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - msgDate.getTime()) / 86400000,
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ChatDetailScreen({ navigation, route }: Props) {
  const { match_id, other_user_name } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const messages = useChatStore((s) => s.messages[match_id] ?? []);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages[match_id] ?? true);
  const isTyping = useChatStore((s) => s.typingUsers[match_id] ?? false);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markRead = useChatStore((s) => s.markRead);
  const checkWomenFirst = useChatStore((s) => s.checkWomenFirst);

  const { sendTypingStart, sendTypingStop } = useWebSocket();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [womenFirstBlocked, setWomenFirstBlocked] = useState(false);
  const [womenFirstReason, setWomenFirstReason] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Mount ───
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await fetchMessages(match_id, true);
        if (!cancelled) setHasLoadError(false);
      } catch {
        if (!cancelled) setHasLoadError(true);
      }
      try {
        await markRead(match_id);
      } catch {}
      try {
        const status = await checkWomenFirst(match_id);
        if (status && !status.can_send) {
          setWomenFirstBlocked(true);
          setWomenFirstReason(status.reason);
        }
      } catch {}
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [match_id]);

  useEffect(() => {
    if (!isTyping && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isTyping]);

  // ─── Handlers ───
  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || womenFirstBlocked) return;

    setIsSending(true);
    try {
      await sendMessage(match_id, trimmed);
      setInputText('');
    } catch {
      setHasLoadError(true);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, womenFirstBlocked, match_id, sendMessage]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    try {
      await fetchMessages(match_id);
    } catch {}
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreMessages, match_id, fetchMessages]);

  const handleInputFocus = useCallback(() => {
    sendTypingStart(match_id);
  }, [match_id, sendTypingStart]);

  const handleInputBlur = useCallback(() => {
    sendTypingStop(match_id);
  }, [match_id, sendTypingStop]);

  // ─── Render helpers ───
  const renderDateSeparator = useCallback(
    (date: string) => (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{getDateLabel(date)}</Text>
        <View style={styles.dateLine} />
      </View>
    ),
    [],
  );

  const shouldShowDateSeparator = (
    currentMsg: Message,
    index: number,
  ): boolean => {
    if (index === messages.length - 1) return true;
    const nextMsg = messages[index + 1];
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const nextDate = new Date(nextMsg.created_at).toDateString();
    return currentDate !== nextDate;
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMine = item.sender_id === currentUserId;
      const showSeparator = shouldShowDateSeparator(item, index);

      return (
        <View>
          <View
            style={[
              styles.messageRow,
              isMine ? styles.messageRowMine : styles.messageRowOther,
            ]}
          >
            {!isMine && (
              <View style={styles.messageAvatarSpacer}>
                <Avatar name={other_user_name} size={28} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                isMine ? styles.bubbleMine : styles.bubbleOther,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  isMine ? styles.bubbleTextMine : styles.bubbleTextOther,
                ]}
              >
                {item.content}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
                ]}
              >
                {formatMessageTime(item.created_at)}
              </Text>
            </View>
          </View>
          {showSeparator && renderDateSeparator(item.created_at)}
        </View>
      );
    },
    [currentUserId, other_user_name, renderDateSeparator],
  );

  const handleRetry = useCallback(() => {
    setHasLoadError(false);
    fetchMessages(match_id, true);
  }, [match_id, fetchMessages]);

  // ─── Main Render ───
  if (hasLoadError && messages.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.6}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerName} numberOfLines={1}>
            {other_user_name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Couldn't load messages</Text>
          <Text style={styles.errorSubtitle}>
            Check your connection and try again.
          </Text>
          <Button
            title="Retry"
            onPress={handleRetry}
            variant="outline"
            fullWidth={false}
            style={styles.retryButton}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>
            {other_user_name}
          </Text>
          {isTyping ? (
            <Text style={styles.typingIndicator}>typing...</Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* ─── Women-First Banner ─── */}
      {womenFirstBlocked && (
        <View style={styles.womenFirstBanner}>
          <Text style={styles.womenFirstText}>{womenFirstReason}</Text>
        </View>
      )}

      {/* ─── Message List ─── */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner message="Loading messages..." />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            inverted
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadMoreIndicator}>
                  <LoadingSpinner />
                </View>
              ) : null
            }
            ListFooterComponent={
              messages.length === 0 ? (
                <View style={styles.emptyMessages}>
                  <Text style={styles.emptyMessagesIcon}>💬</Text>
                  <Text style={styles.emptyMessagesText}>
                    No messages yet. Say hi!
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* ─── Typing Indicator (bottom overlay) ─── */}
        {isTyping && (
          <View style={styles.typingOverlay}>
            <Text style={styles.typingOverlayText}>
              {other_user_name} is typing...
            </Text>
          </View>
        )}

        {/* ─── Input Bar ─── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              womenFirstBlocked
                ? 'You cannot send messages yet'
                : 'Type a message...'
            }
            placeholderTextColor={colors.textLight}
            editable={!womenFirstBlocked}
            multiline
            maxLength={1000}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending || womenFirstBlocked) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending || womenFirstBlocked}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.sm,
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backIcon: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  headerCenter: {
    flex: 1,
  },
  headerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },
  typingIndicator: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // ─── Women-First Banner ───
  womenFirstBanner: {
    backgroundColor: colors.warning + '20',
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  womenFirstText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },

  // ─── Keyboard ───
  keyboardView: {
    flex: 1,
  },

  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreIndicator: {
    paddingVertical: spacing.md,
  },

  // ─── Message List ───
  messageListContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },

  // ─── Messages ───
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatarSpacer: {
    marginRight: spacing.sm,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    marginVertical: 1,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleOther: {
    backgroundColor: colors.surfaceAlt,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  bubbleTextOther: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  bubbleTimeOther: {
    color: colors.textLight,
  },

  // ─── Date Separator ───
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginHorizontal: spacing.md,
  },

  // ─── Empty Messages ───
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    transform: [{ scaleY: -1 }],
  },
  emptyMessagesIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyMessagesText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },

  // ─── Typing Overlay ───
  typingOverlay: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  typingOverlayText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // ─── Input Bar ───
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendIcon: {
    fontSize: 18,
    color: colors.white,
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
