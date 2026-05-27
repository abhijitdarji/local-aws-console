'use client';

import TopNavigation from '@cloudscape-design/components/top-navigation';
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useOnFollow } from '@/app/hooks/use-on-follow';
import type { Region } from '@/app/lib/client/store/app-store';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { validateEnvironment } from '@/app/lib/server/actions/settings';

export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const { environments, environment, regions, region, setEnvironment, setRegion, setAccountId } =
    useAppStore();

  // Sync next-themes → Cloudscape mode
  useEffect(() => {
    applyMode(resolvedTheme === 'dark' ? Mode.Dark : Mode.Light);
  }, [resolvedTheme]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onFollow = useOnFollow();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleSetEnvironment = async (env: string) => {
    setEnvironment(env);
    try {
      const identity = await validateEnvironment(env);
      if (identity?.Account) setAccountId(identity.Account);
    } catch {
      // validation failed — environment still set
    }
  };

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const sunSvg = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sun"
    >
      <title>Sun</title>
      <path d="M12 18a6 6 0 1 1 0-12a6 6 0 0 1 0 12ZM11 1h2v3h-2V1Zm0 19h2v3h-2v-3ZM3.515 4.929l1.414-1.414L7.05 5.636L5.636 7.05L3.515 4.93ZM16.95 18.364l1.414-1.414l2.121 2.121l-1.414 1.414l-2.121-2.121Zm2.121-14.85l1.414 1.415l-2.121 2.121l-1.414-1.414l2.121-2.121ZM5.636 16.95l1.414 1.414l-2.121 2.121l-1.414-1.414l2.121-2.121ZM23 11v2h-3v-2h3ZM4 11v2H1v-2h3Z" />
    </svg>
  );
  const moonSvg = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Moon"
    >
      <title>Moon</title>
      <path
        fill="currentColor"
        d="M235.54 150.21a104.84 104.84 0 0 1-37 52.91A104 104 0 0 1 32 120a103.09 103.09 0 0 1 20.88-62.52a104.84 104.84 0 0 1 52.91-37a8 8 0 0 1 10 10a88.08 88.08 0 0 0 109.8 109.8a8 8 0 0 1 10 10Z"
      />
    </svg>
  );

  return (
    <TopNavigation
      identity={{ href: '/', title: 'Local AWS', logo: { src: '/aws.svg', alt: 'AWS' }, onFollow }}
      utilities={[
        {
          type: 'button',
          iconSvg: isDark ? sunSvg : moonSvg,
          text: isDark ? 'Light' : 'Dark',
          title: isDark ? 'Switch to Light' : 'Switch to Dark',
          ariaLabel: isDark ? 'Light mode' : 'Dark mode',
          onClick: toggleTheme,
        },
        {
          type: 'menu-dropdown',
          text: region || 'Select Region',
          description: 'Select region',
          items: regions.map((r: Region) => ({ type: 'button', id: r.code, text: r.name })),
          onItemClick: (item) => setRegion(item.detail.id),
        },
        {
          type: 'menu-dropdown',
          text: environment || 'Select Environment',
          description: 'Select environment',
          items: environments.map((env: string) => ({ type: 'button', id: env, text: env })),
          onItemClick: (item) => handleSetEnvironment(item.detail.id),
        },
      ]}
    />
  );
}
