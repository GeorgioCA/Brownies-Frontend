import { create } from 'zustand';
import type { Message, WomenFirstStatus } from '../types';
import * as messagesApi from '../api/messages';

interface ChatState {
  messages: Record<number, Message[]>;
  messagePages: Record<number, number>;
  hasMoreMessages: Record<number, boolean>;
  isLoadingMessages: boolean;
  typingUsers: Record<number, boolean>; // match_id -> isTyping

  fetchMessages: (match_id: number, refresh?: boolean) => Promise<void>;
  sendMessage: (match_id: number, content: string) => Promise<Message>;
  addMessage: (message: Message) => void;
  markRead: (match_id: number) => Promise<void>;
  checkWomenFirst: (match_id: number) => Promise<WomenFirstStatus>;
  setTyping: (match_id: number, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  messagePages: {},
  hasMoreMessages: {},
  isLoadingMessages: false,
  typingUsers: {},

  fetchMessages: async (match_id: number, refresh = false) => {
    const { messagePages, hasMoreMessages } = get();
    const page = refresh ? 1 : (messagePages[match_id] || 0) + 1;

    if (!refresh && hasMoreMessages[match_id] === false) return;

    set({ isLoadingMessages: true });

    try {
      const res = await messagesApi.getMessages(match_id, page);
      const newMessages: Message[] = res.data;
      const existing = get().messages[match_id] || [];
      const merged = refresh ? newMessages : [...newMessages, ...existing];

      // Remove duplicates
      const seen = new Set<number>();
      const unique = merged.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      set({
        messages: { ...get().messages, [match_id]: unique },
        messagePages: { ...get().messagePages, [match_id]: page },
        hasMoreMessages: { ...get().hasMoreMessages, [match_id]: newMessages.length >= 50 },
        isLoadingMessages: false,
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (match_id: number, content: string) => {
    const res = await messagesApi.sendMessage(match_id, { message_type: 'text', content });
    const message: Message = res.data;
    get().addMessage(message);
    return message;
  },

  addMessage: (message: Message) => {
    set((s) => {
      const existing = s.messages[message.match_id] || [];
      if (existing.some((m) => m.id === message.id)) return s;
      return { messages: { ...s.messages, [message.match_id]: [...existing, message] } };
    });
  },

  markRead: async (match_id: number) => {
    try { await messagesApi.markMessagesRead(match_id); } catch {}
    set((s) => {
      const msgs = s.messages[match_id];
      if (!msgs) return s;
      return {
        messages: {
          ...s.messages,
          [match_id]: msgs.map((m) => ({ ...m, is_read: true })),
        },
      };
    });
  },

  checkWomenFirst: async (match_id: number) => {
    const res = await messagesApi.getWomenFirstStatus(match_id);
    return res.data;
  },

  setTyping: (match_id: number, isTyping: boolean) => {
    set((s) => ({ typingUsers: { ...s.typingUsers, [match_id]: isTyping } }));
  },
}));
