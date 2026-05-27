'use client';

import { Button } from '@cloudscape-design/components';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { getFavoriteByPath, toggleFavorite } from '@/app/lib/server/actions/favorites';

type Props = {
  /** Display name used when saving. Defaults to the current pathname. */
  name: string;
};

export function FavoriteButton({ name }: Props) {
  const pathname = usePathname();
  const { environment, region } = useAppStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const checkFavorited = useCallback(async () => {
    if (!environment || !region) return;
    const existing = await getFavoriteByPath(pathname, environment, region);
    setIsFavorited(!!existing);
    setLoading(false);
  }, [pathname, environment, region]);

  useEffect(() => {
    setLoading(true);
    checkFavorited();
  }, [checkFavorited]);

  const handleToggle = async () => {
    if (toggling || !environment || !region) return;
    setToggling(true);
    // Optimistic update
    setIsFavorited((prev) => !prev);
    try {
      await toggleFavorite(name, pathname, environment, region);
    } catch {
      // Revert on error
      setIsFavorited((prev) => !prev);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return null;

  return (
    <Button
      iconName={isFavorited ? 'star-filled' : 'star'}
      variant="icon"
      onClick={handleToggle}
      loading={toggling}
      ariaLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    />
  );
}
