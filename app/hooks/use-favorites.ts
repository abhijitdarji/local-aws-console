'use client';

import { useActionState, useEffect, useState } from 'react';
import { deleteFavorite, type Favorite, getFavorites } from '@/app/lib/server/actions/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: number) => {
    await deleteFavorite(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return { favorites, loading, refresh, remove };
}
