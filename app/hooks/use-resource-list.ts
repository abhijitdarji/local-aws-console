'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { runAwsCommandSafe } from '@/app/lib/server/actions/aws';

export type UseResourceListResult<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refresh: () => void;
  environment: string;
  region: string;
};

// Module-level TTL cache. Lives in browser memory across SPA navigations.
// Cleared only on full page reload. TTL mirrors the server-side cacheLife revalidate.
const _cache = new Map<string, { data: unknown; time: number }>();
const CACHE_TTL_MS = 30 * 60_000;

function buildKey(
  env: string,
  region: string,
  service: string,
  command: string,
  optionsJson: string,
): string {
  return `${env}:${region}:${service}:${command}:${optionsJson}`;
}

function peekCache<T>(key: string, resultKey: string): { items: T[]; time: number } | null {
  const entry = _cache.get(key);
  if (!entry || Date.now() - entry.time >= CACHE_TTL_MS) return null;
  return {
    items: ((entry.data as Record<string, unknown>)[resultKey] ?? []) as T[],
    time: entry.time,
  };
}

export function useResourceList<T = Record<string, unknown>>(
  service: string,
  command: string,
  resultKey: string,
  options: Record<string, unknown> = {},
  allPages = true,
): UseResourceListResult<T> {
  const environment = useAppStore((s) => s.environment);
  const region = useAppStore((s) => s.region);

  // Stable serialized options key (avoids requiring callers to memoize)
  const optionsJson = JSON.stringify(options);

  // Synchronous cache check: runs during the very first render so that React
  // can initialize state from cached data without needing an effect cycle.
  // This eliminates both the "empty table" flash and the loading spinner when
  // navigating back to a page whose data is already in the browser cache.
  const firstKey =
    environment && region ? buildKey(environment, region, service, command, optionsJson) : null;
  const firstHit = firstKey ? peekCache<T>(firstKey, resultKey) : null;

  if (firstHit) {
    console.log(
      `[cache] HIT (sync init) ${firstKey} — ${firstHit.items.length} items, age ${Math.round((Date.now() - firstHit.time) / 1000)}s`,
    );
  }

  const [items, setItems] = useState<T[]>(() => firstHit?.items ?? []);
  const [loading, setLoading] = useState<boolean>(() => firstHit === null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(() => firstHit?.time ?? null);

  // Track which cache key was used for synchronous init so the first effect
  // run can skip the redundant fetch that would otherwise fire.
  const initKeyRef = useRef<string | null>(firstHit ? firstKey : null);

  const executeFetch = useCallback(
    (key: string, env: string, reg: string) => {
      setLoading(true);
      setError(null);
      const parsedOptions = JSON.parse(optionsJson) as Record<string, unknown>;
      runAwsCommandSafe({
        env,
        region: reg,
        service,
        command,
        options: parsedOptions,
        allPages,
      })
        .then((result) => {
          if (!result.ok) {
            setError(result.error.message);
            return;
          }
          const d = result.data;
          const now = Date.now();
          _cache.set(key, { data: d, time: now });
          setItems(((d as Record<string, unknown>)[resultKey] ?? []) as T[]);
          setLastFetched(now);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false));
    },
    [service, command, resultKey, allPages, optionsJson],
  );

  useEffect(() => {
    if (!environment || !region) return;
    const key = buildKey(environment, region, service, command, optionsJson);

    // First effect run after a cache-hydrated mount: state is already correct.
    // Clear the ref and bail out to avoid an unnecessary AWS call.
    if (initKeyRef.current === key) {
      initKeyRef.current = null;
      console.log(`[cache] SKIP effect (already init'd from cache) ${key}`);
      return;
    }

    // Subsequent env/region/option changes — check cache before hitting AWS.
    const cached = peekCache<T>(key, resultKey);
    if (cached) {
      console.log(
        `[cache] HIT (effect) ${key} — ${cached.items.length} items, age ${Math.round((Date.now() - cached.time) / 1000)}s`,
      );
      setItems(cached.items);
      setLastFetched(cached.time);
      setLoading(false);
      return;
    }

    console.log(`[cache] MISS ${key} — fetching from AWS`);
    executeFetch(key, environment, region);
  }, [environment, region, service, command, resultKey, optionsJson, executeFetch]);

  const refresh = useCallback(() => {
    if (!environment || !region) return;
    const key = buildKey(environment, region, service, command, optionsJson);
    _cache.delete(key);
    initKeyRef.current = null;
    console.log(`[cache] BUST (manual refresh) ${key}`);
    executeFetch(key, environment, region);
  }, [executeFetch, environment, region, service, command, optionsJson]);

  return { items, loading, error, lastFetched, refresh, environment, region };
}
