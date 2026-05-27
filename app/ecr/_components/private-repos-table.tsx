'use client';

import Link from 'next/link';
import { use } from 'react';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { AppTable } from '@/app/components/app-table';

const columns: ColumnDefinitionType[] = [
  {
    id: 'repositoryName',
    header: 'Repository Name',
    cell: (item: any) => (
      <Link href={`/ecr/private/${encodeURIComponent(item.repositoryName)}`}>
        {item.repositoryName}
      </Link>
    ),
    sortingField: 'repositoryName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'repositoryUri',
    header: 'URI',
    cell: (item: any) => item.repositoryUri,
    sortingField: 'repositoryUri',
    visible: true,
  },
  {
    id: 'imageTagMutability',
    header: 'Tag Mutability',
    cell: (item: any) => item.imageTagMutability,
    sortingField: 'imageTagMutability',
    visible: true,
  },
  {
    id: 'createdAt',
    header: 'Created',
    cell: (item: any) => (item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'),
    sortingField: 'createdAt',
    visible: true,
  },
];

export function PrivateReposTable({ reposPromise }: { reposPromise: Promise<any> }) {
  const result = use(reposPromise);
  const items = (result.repositories as any[]) ?? [];

  return <AppTable resourceName="Repository" columnDef={columns} items={items} pageSize={25} />;
}
