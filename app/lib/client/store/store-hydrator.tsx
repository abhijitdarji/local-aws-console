'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
import { listEnvironments } from '@/app/lib/server/actions/settings';
import type { Region } from './app-store';
import { useAppStore } from './app-store';

type Props = {
  regions: Region[];
};

export function StoreHydrator({ regions }: Props) {
  const { hydrate, environment, region } = useAppStore();
  const router = useRouter();
  // The server has already rendered using the env+region that live in the
  // `localaws` cookie. We must only call router.refresh() when the user
  // actually changes env/region from the dropdown — not on the first paint
  // after persist-middleware rehydrates the store. Otherwise every navigation
  // (including 404/not-found pages, where router.refresh re-mounts the
  // streamed tree) ends up in an infinite refetch loop.
  const lastSyncedKeyRef = useRef<string | null>(null);
  // useTransition keeps the current UI mounted while Server Components
  // re-render in the background. Without it, Suspense boundaries would
  // fall back to their loading states and the page would visibly "flash".
  const [, startTransition] = useTransition();

  useEffect(() => {
    listEnvironments().then((envData) => {
      const environments = [...(envData.sso ?? []), ...(envData.key ?? [])];
      hydrate({ environments, regions });
    });
  }, []);

  useEffect(() => {
    if (!environment || !region) return;
    const key = `${environment}|${region}`;
    if (lastSyncedKeyRef.current === null) {
      lastSyncedKeyRef.current = key;
      return;
    }
    if (lastSyncedKeyRef.current !== key) {
      lastSyncedKeyRef.current = key;
      startTransition(() => {
        router.refresh();
      });
    }
  }, [environment, region, router.refresh]);

  return null;
}
