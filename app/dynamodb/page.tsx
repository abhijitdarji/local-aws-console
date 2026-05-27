'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';

const columns: ColumnDefinitionType[] = [
  {
    id: 'TableName',
    header: 'Table Name',
    cell: (item: any) => <Link href={`/dynamodb/${encodeURIComponent(item)}`}>{item}</Link>,
    sortingField: 'TableName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
];

export default function DynamoDBPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'DynamoDB',
    'ListTables',
    'TableNames',
  );

  return (
    <ResourceListPage
      title="DynamoDB Tables"
      resourceName="Table"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/dynamodb/home?region=${region}#tables`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
