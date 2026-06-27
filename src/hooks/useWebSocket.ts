import { useEffect, useRef, useCallback } from 'react';
import { getWsUrl } from '../utils/constants';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';
import type { WsServerMessage } from '../types';

const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = reconnectDelayRef.current;
    reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;

    const url = `${getWsUrl()}?token=${encodeURIComponent(accessToken)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = 1000;
      ws.send(JSON.stringify({ token: accessToken }));
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        handleServerMessage(msg);
      } catch {}
    };

    ws.onclose = (e) => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (e.code === 1008 || e.code === 4003 || !mountedRef.current) return;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [isAuthenticated, accessToken, scheduleReconnect]);

  const handleServerMessage = (msg: WsServerMessage) => {
    switch (msg.type) {
      case 'pong':
        break;
      case 'new_message':
        if (msg.data && typeof msg.data === 'object') {
          addMessage(msg.data as any);
        }
        break;
      case 'new_match':
        if (msg.data && typeof msg.data === 'object') {
          addNotification({
            id: Date.now(),
            type: 'new_match',
            title: 'New Match!',
            body: 'You have a new match!',
            data: msg.data as Record<string, unknown>,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
        break;
      case 'typing_start':
        if (msg.data && typeof msg.data === 'object' && 'match_id' in msg.data) {
          setTyping(msg.data.match_id as number, true);
        }
        break;
      case 'typing_stop':
        if (msg.data && typeof msg.data === 'object' && 'match_id' in msg.data) {
          setTyping(msg.data.match_id as number, false);
        }
        break;
      default:
        console.log('Unknown WS message:', msg.type);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (wsRef.current) wsRef.current.close();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  const sendTypingStart = useCallback((match_id: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_start', data: { match_id } }));
    }
  }, []);

  const sendTypingStop = useCallback((match_id: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing_stop', data: { match_id } }));
    }
  }, []);

  return { sendTypingStart, sendTypingStop };
}
