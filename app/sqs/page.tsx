'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';

const columns: ColumnDefinitionType[] = [
  {
    id: 'QueueName',
    header: 'Queue Name',
    cell: (item: any) => (
      <Link href={`/sqs/${encodeURIComponent(item)}`}>{(item as string).split('/').pop()}</Link>
    ),
    sortingField: 'QueueName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Type',
    header: 'Type',
    cell: (item: any) =>
      ((item as string).split('/').pop() ?? '').endsWith('.fifo') ? 'FIFO' : 'Standard',
    sortingField: 'Type',
    visible: true,
  },
  {
    id: 'QueueUrl',
    header: 'Queue URL',
    cell: (item: any) => item,
    sortingField: 'QueueUrl',
    visible: false,
  },
];

export default function SqsPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'SQS',
    'ListQueues',
    'QueueUrls',
    { MaxResults: 1000 },
    false,
  );

  return (
    <ResourceListPage
      title="SQS Queues"
      resourceName="Queue"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/sqs/v2/home?region=${region}#/queues`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
