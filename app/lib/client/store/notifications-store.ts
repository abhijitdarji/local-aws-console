'use client';

import type { FlashbarProps } from '@cloudscape-design/components';
import { create } from 'zustand';

type NotificationItem = FlashbarProps.MessageDefinition & { id: string };

type NotificationsState = {
  notifications: NotificationItem[];
  notify: (item: Omit<NotificationItem, 'id' | 'onDismiss'>) => void;
  dismiss: (id: string) => void;
};

let idCounter = 0;

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  notify: (item) => {
    const id = `notif-${++idCounter}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          // Cloudscape Flashbar only renders the dismiss "X" when the item is
          // explicitly marked `dismissible`. Default to true so every
          // notification can be closed; callers can still override.
          dismissible: true,
          dismissLabel: 'Dismiss notification',
          ...item,
          id,
          onDismiss: () =>
            set((s) => ({
              notifications: s.notifications.filter((n) => n.id !== id),
            })),
        },
      ],
    }));
  },
  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
