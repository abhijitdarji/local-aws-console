'use client';

import type { AppLayoutProps } from '@cloudscape-design/components';
import { create } from 'zustand';

type LayoutState = {
  drawers: AppLayoutProps.Drawer[];
  activeDrawerId: string | null;
  setActiveDrawerId: (id: string | null) => void;
  setDrawers: (drawers: AppLayoutProps.Drawer[]) => void;
  addDrawer: (drawer: AppLayoutProps.Drawer) => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  drawers: [],
  activeDrawerId: null,
  setActiveDrawerId: (id) => set({ activeDrawerId: id }),
  setDrawers: (drawers) => set({ drawers }),
  addDrawer: (drawer) =>
    set((state) => ({
      drawers: state.drawers.some((d) => d.id === drawer.id)
        ? state.drawers
        : [...state.drawers, drawer],
    })),
}));
