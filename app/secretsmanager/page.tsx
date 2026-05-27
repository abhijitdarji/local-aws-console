'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { DateUtils } from '@/app/lib/dates';

const columns: ColumnDefinitionType[] = [
  {
    id: 'Name',
    header: 'Secret Name',
    cell: (item: any) => (
      <Link href={`/secretsmanager/${encodeURIComponent(item.Name)}`}>{item.Name}</Link>
    ),
    sortingField: 'Name',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Description',
    header: 'Description',
    cell: (item: any) => item.Description,
    sortingField: 'Description',
    visible: true,
  },
  {
    id: 'LastChangedDate',
    header: 'Last Changed',
    cell: (item: any) =>
      item.LastChangedDate ? DateUtils.formatDateAgo(item.LastChangedDate) : '—',
    sortingField: 'LastChangedDate',
    visible: true,
  },
  {
    id: 'LastAccessedDate',
    header: 'Last Accessed',
    cell: (item: any) =>
      item.LastAccessedDate ? DateUtils.formatDateAgo(item.LastAccessedDate) : '—',
    sortingField: 'LastAccessedDate',
    visible: true,
  },
];

export default function SecretsManagerPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'SecretsManager',
    'ListSecrets',
    'SecretList',
  );

  return (
    <ResourceListPage
      title="Secrets Manager"
      resourceName="Secret"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/secretsmanager/home?region=${region}#!/listSecrets`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
