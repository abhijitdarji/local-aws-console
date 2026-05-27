'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { createFavorite } from '@/app/lib/server/actions/favorites';
import { FavoriteForm } from '../favorite-form';

export default function AddFavoritePage() {
  const { environment, region } = useAppStore();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const result = await createFavorite({ ok: false, errors: {} }, formData);
      if (result.ok) {
        router.push('/favorites');
      } else {
        setErrors(result.errors ?? {});
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <FavoriteForm
      title="Add Favorite"
      onSubmit={handleSubmit}
      pending={pending}
      errors={errors}
      environment={environment}
      region={region}
    />
  );
}
