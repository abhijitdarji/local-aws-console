'use client';

import {
  Box,
  Button,
  Cards,
  ContentLayout,
  Header,
  Link,
  SpaceBetween,
  TextFilter,
} from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { deleteFavorite, type Favorite } from '@/app/lib/server/actions/favorites';

export function FavoritesList({
  favorites,
  onRefresh,
}: {
  favorites: Favorite[];
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { setEnvironment, setRegion } = useAppStore();
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((f) =>
      [f.name, f.path, f.environment, f.region]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [favorites, filter]);

  const handleDelete = async (id: number) => {
    await deleteFavorite(id);
    onRefresh();
  };

  const navigateToFavorite = (item: Favorite) => {
    setEnvironment(item.environment);
    setRegion(item.region);
    router.push(item.path);
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          counter={`(${filtered.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={onRefresh}>
                Refresh
              </Button>
              <Button variant="primary" onClick={() => router.push('/favorites/add')}>
                Add favorite
              </Button>
            </SpaceBetween>
          }
        >
          Favorites
        </Header>
      }
    >
      <SpaceBetween size="m">
        <TextFilter
          filteringText={filter}
          onChange={({ detail }) => setFilter(detail.filteringText)}
          filteringPlaceholder="Find favorites"
          countText={filtered.length === 1 ? '1 match' : `${filtered.length} matches`}
        />
        <Cards
          cardDefinition={{
            header: (item) => (
              <Box fontWeight="bold">
                <Link
                  href={item.path}
                  onFollow={(e) => {
                    e.preventDefault();
                    navigateToFavorite(item);
                  }}
                >
                  {item.name}
                </Link>
              </Box>
            ),
            sections: [
              {
                id: 'details',
                content: (item) => (
                  <SpaceBetween size="xs">
                    <Box color="text-body-secondary">
                      {item.environment} · {item.region}
                    </Box>
                    <Box fontSize="body-s" color="text-body-secondary">
                      {item.path}
                    </Box>
                  </SpaceBetween>
                ),
              },
              {
                id: 'actions',
                content: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => router.push(`/favorites/edit/${item.id}`)}>Edit</Button>
                    <Button variant="normal" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ],
          }}
          cardsPerRow={[{ cards: 1 }, { minWidth: 600, cards: 2 }]}
          items={filtered}
          trackBy="id"
          empty={
            <Box textAlign="center" color="text-body-secondary" padding="xxl">
              No favorites yet.{' '}
              <Link
                href="/favorites/add"
                onFollow={(e) => {
                  e.preventDefault();
                  router.push('/favorites/add');
                }}
              >
                Add your first favorite.
              </Link>
            </Box>
          }
        />
      </SpaceBetween>
    </ContentLayout>
  );
}
