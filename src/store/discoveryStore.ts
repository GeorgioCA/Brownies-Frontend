import { create } from 'zustand';
import type { DiscoveryProfile, SwipeStats } from '../types';
import * as discoveryApi from '../api/discovery';

interface DiscoveryState {
  profiles: DiscoveryProfile[];
  currentIndex: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  stats: SwipeStats | null;
  lastSwipeDirection: 'like' | 'super_like' | 'pass' | null;
  lastMatchId: number | null;

  fetchProfiles: (refresh?: boolean) => Promise<void>;
  swipe: (direction: 'like' | 'super_like' | 'pass') => Promise<{ is_match: boolean; match_id: number | null }>;
  undoLastSwipe: () => Promise<void>;
  fetchStats: () => Promise<void>;
  goToNext: () => void;
  getCurrentProfile: () => DiscoveryProfile | null;
  canSwipe: () => boolean;
}

function extractProfiles(data: unknown): DiscoveryProfile[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['items', 'profiles', 'results', 'data']) {
      if (Array.isArray(obj[key])) return obj[key] as DiscoveryProfile[];
    }
  }
  return [];
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  profiles: [],
  currentIndex: 0,
  isLoading: false,
  isRefreshing: false,
  error: null,
  page: 1,
  hasMore: true,
  stats: null,
  lastSwipeDirection: null,
  lastMatchId: null,

  fetchProfiles: async (refresh = false) => {
    const { profiles, page, isRefreshing } = get();
    if (isRefreshing) return;
    const newPage = refresh ? 1 : page;

    set(refresh ? { isRefreshing: true, error: null, currentIndex: 0 } : { isLoading: true, error: null });

    try {
      const res = await discoveryApi.getDiscovery(newPage);
      const raw = res.data;
      const newProfiles = extractProfiles(raw);

      if (refresh) {
        set({
          profiles: newProfiles,
          page: 2,
          hasMore: newProfiles.length >= 20,
          isLoading: false,
          isRefreshing: false,
        });
      } else {
        set({
          profiles: [...profiles, ...newProfiles],
          page: newPage + 1,
          hasMore: newProfiles.length >= 20,
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load profiles. Check your connection.';
      set({ isLoading: false, isRefreshing: false, error: message });
    }
  },

  swipe: async (direction) => {
    const profile = get().getCurrentProfile();
    if (!profile) throw new Error('No profile to swipe on');

    const res = await discoveryApi.swipe({ swiped_id: profile.id, direction });
    const data = res.data;

    set({ lastSwipeDirection: direction, lastMatchId: data.match_id });

    const { stats } = get();
    if (stats) {
      const newStats = { ...stats };
      if (direction === 'super_like') newStats.super_likes_remaining = Math.max(0, stats.super_likes_remaining - 1);
      else if (direction === 'like') newStats.likes_remaining = Math.max(0, stats.likes_remaining - 1);
      set({ stats: newStats });
    }

    set((s) => ({ currentIndex: s.currentIndex + 1 }));
    return data;
  },

  undoLastSwipe: async () => {
    await discoveryApi.undoLastSwipe();
    set((s) => ({ currentIndex: Math.max(0, s.currentIndex - 1) }));
  },

  fetchStats: async () => {
    try {
      const res = await discoveryApi.getSwipeStats();
      set({ stats: res.data });
    } catch {}
  },

  goToNext: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),

  getCurrentProfile: () => {
    const { profiles, currentIndex } = get();
    return profiles[currentIndex] ?? null;
  },

  canSwipe: () => {
    const { stats } = get();
    return (stats?.likes_remaining ?? 0) > 0;
  },
}));
