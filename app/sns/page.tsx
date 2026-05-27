'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';

function topicName(arn: string): string {
  return arn.split(':').pop() ?? arn;
}

const columns: ColumnDefinitionType[] = [
  {
    id: 'TopicName',
    header: 'Topic Name',
    cell: (item: any) => (
      <Link href={`/sns/${encodeURIComponent(item.TopicArn)}`}>{topicName(item.TopicArn)}</Link>
    ),
    sortingField: 'TopicArn',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Type',
    header: 'Type',
    cell: (item: any) => ((item.TopicArn as string).endsWith('.fifo') ? 'FIFO' : 'Standard'),
    sortingField: 'TopicArn',
    visible: true,
  },
  {
    id: 'TopicArn',
    header: 'Topic ARN',
    cell: (item: any) => item.TopicArn,
    sortingField: 'TopicArn',
    visible: false,
  },
];

export default function SnsPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'SNS',
    'ListTopics',
    'Topics',
  );

  return (
    <ResourceListPage
      title="SNS Topics"
      resourceName="Topic"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/sns/v3/home?region=${region}#/topics`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
