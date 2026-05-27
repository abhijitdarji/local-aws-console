'use client';

import { Button } from '@cloudscape-design/components';
import { useEffect, useState, useTransition } from 'react';
import { DateUtils } from '@/app/lib/dates';

type Props = {
  onClick: () => Promise<void> | void;
  lastFetched?: number | null;
};

export function RefreshButton({ onClick, lastFetched }: Props) {
  const [isPending, startTransition] = useTransition();
  // Re-render every 30s so the "X ago" label stays fresh
  const [, tick] = useState(0);
  useEffect(() => {
    if (!lastFetched) return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [lastFetched]);

  const handleClick = () => {
    startTransition(async () => {
      await onClick();
    });
  };

  const label = lastFetched ? `Refresh (${DateUtils.formatDateAgo(lastFetched)})` : 'Refresh';

  return (
    <Button iconName="refresh" loading={isPending} onClick={handleClick}>
      {label}
    </Button>
  );
}
