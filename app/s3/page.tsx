'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';

const columns: ColumnDefinitionType[] = [
  {
    id: 'Name',
    header: 'Bucket Name',
    cell: (item: any) => <Link href={`/s3/${encodeURIComponent(item.Name)}/`}>{item.Name}</Link>,
    sortingField: 'Name',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'CreationDate',
    header: 'Created',
    cell: (item: any) => (item.CreationDate ? new Date(item.CreationDate).toLocaleString() : '—'),
    sortingField: 'CreationDate',
    visible: true,
  },
];

export default function S3Page() {
  // ListBuckets does not support pagination — pass allPages: false
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'S3',
    'ListBuckets',
    'Buckets',
    {},
    false,
  );

  return (
    <ResourceListPage
      title="S3 Buckets"
      resourceName="Bucket"
      awsConsoleUrl={`https://s3.console.aws.amazon.com/s3/buckets?region=${region}`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
