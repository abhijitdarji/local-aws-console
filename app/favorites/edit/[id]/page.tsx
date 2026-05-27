'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { type Favorite, getFavoriteById, updateFavorite } from '@/app/lib/server/actions/favorites';
import { FavoriteForm } from '../../favorite-form';

export default function EditFavoritePage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const router = useRouter();
  const { environment, region } = useAppStore();
  const [favorite, setFavorite] = useState<Favorite | null>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getFavoriteById(id).then(setFavorite);
  }, [id]);

  const handleSubmit = async (data: {
    name: string;
    path: string;
    environment: string;
    region: string;
  }) => {
    setPending(true);
    setErrors({});
    try {
      const formData = new FormData();
      for (const [k, v] of Object.entries(data)) {
        formData.append(k, v);
      }
      const result = await updateFavorite(id, { ok: false, errors: {} }, formData);
      if (result.ok) {
        router.push('/favorites');
      } else {
        setErrors(result.errors ?? {});
      }
    } finally {
      setPending(false);
    }
  };

  if (!favorite) return null;

  return (
    <FavoriteForm
      title="Edit Favorite"
      onSubmit={handleSubmit}
      pending={pending}
      errors={errors}
      defaultValues={favorite}
      environment={environment}
      region={region}
    />
  );
}
