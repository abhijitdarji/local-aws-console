'use client';

import Cookies from 'js-cookie';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Region = { code: string; name: string };

type AppState = {
  environments: string[];
  environment: string;
  accountId: string;
  regions: Region[];
  region: string;
  setEnvironment: (v: string) => void;
  setRegion: (v: string) => void;
  setAccountId: (v: string) => void;
  hydrate: (
    initial: Partial<Omit<AppState, 'setEnvironment' | 'setRegion' | 'setAccountId' | 'hydrate'>>,
  ) => void;
};

// Guard all cookie operations: js-cookie calls Date.now() when computing
// expiry dates, which triggers Next.js 16's prerender-current-time error
// during SSR. Returning null from getItem causes Zustand to use defaults.
const cookieStorage = {
  getItem: (k: string) => {
    if (typeof document === 'undefined') return null;
    return Cookies.get(k) ?? null;
  },
  setItem: (k: string, v: string): void => {
    if (typeof document === 'undefined') return;
    Cookies.set(k, v, { sameSite: 'lax', expires: 365 });
  },
  removeItem: (k: string): void => {
    if (typeof document === 'undefined') return;
    Cookies.remove(k);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      environments: [],
      regions: [],
      environment: '',
      region: '',
      accountId: '',
      setEnvironment: (v) => set({ environment: v }),
      setRegion: (v) => set({ region: v }),
      setAccountId: (v) => set({ accountId: v }),
      hydrate: (init) => set(init as Partial<AppState>),
    }),
    {
      name: 'localaws',
      storage: createJSONStorage(() => cookieStorage),
      // Only persist env + region to cookies; others stay in-memory
      partialize: (s) => ({ environment: s.environment, region: s.region }),
    },
  ),
);
