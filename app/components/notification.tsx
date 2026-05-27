'use client';

import { Flashbar } from '@cloudscape-design/components';
import { useNotificationsStore } from '@/app/lib/client/store/notifications-store';

export function Notification() {
  const notifications = useNotificationsStore((s) => s.notifications);
  return (
    <Flashbar
      items={notifications}
      stackItems
      i18nStrings={{
        ariaLabel: 'Notifications',
        notificationBarAriaLabel: 'View all notifications',
        notificationBarText: 'Notifications',
        errorIconAriaLabel: 'Error',
        warningIconAriaLabel: 'Warning',
        successIconAriaLabel: 'Success',
        infoIconAriaLabel: 'Info',
        inProgressIconAriaLabel: 'In progress',
      }}
    />
  );
}
