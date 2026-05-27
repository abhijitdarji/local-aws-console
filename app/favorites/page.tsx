'use client';

import { useCallback, useEffect, useState } from 'react';
import { type Favorite, getFavorites } from '@/app/lib/server/actions/favorites';
import { FavoritesList } from './favorites-list';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const load = useCallback(async () => {
    setFavorites(await getFavorites());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <FavoritesList favorites={favorites} onRefresh={load} />;
}
