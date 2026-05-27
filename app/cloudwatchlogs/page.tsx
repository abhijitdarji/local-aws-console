'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { FileSize } from '@/app/components/file-size';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { DateUtils } from '@/app/lib/dates';

const columns: ColumnDefinitionType[] = [
  {
    id: 'logGroupName',
    header: 'Log Group',
    cell: (item: any) => (
      <Link href={`/cloudwatchlogs/${encodeURIComponent(item.logGroupName)}`}>
        {item.logGroupName}
      </Link>
    ),
    sortingField: 'logGroupName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'logGroupClass',
    header: 'Class',
    cell: (item: any) => item.logGroupClass ?? 'STANDARD',
    sortingField: 'logGroupClass',
    visible: false,
  },
  {
    id: 'retentionInDays',
    header: 'Retention',
    cell: (item: any) => (item.retentionInDays ? `${item.retentionInDays} days` : 'Never expire'),
    sortingField: 'retentionInDays',
    visible: true,
  },
  {
    id: 'storedBytes',
    header: 'Stored Size',
    cell: (item: any) => <FileSize bytes={item.storedBytes} />,
    sortingField: 'storedBytes',
    visible: true,
  },
  {
    id: 'metricFilterCount',
    header: 'Metric Filters',
    cell: (item: any) => item.metricFilterCount ?? 0,
    sortingField: 'metricFilterCount',
    visible: false,
  },
  {
    id: 'creationTime',
    header: 'Created',
    cell: (item: any) => (item.creationTime ? DateUtils.fomatTimestamp(item.creationTime) : '—'),
    sortingField: 'creationTime',
    visible: true,
  },
  {
    id: 'arn',
    header: 'ARN',
    cell: (item: any) => item.arn,
    sortingField: 'arn',
    visible: false,
  },
];

export default function CloudWatchLogsPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'CloudWatchLogs',
    'DescribeLogGroups',
    'logGroups',
    { limit: 50 },
  );

  return (
    <ResourceListPage
      title="CloudWatch Log Groups"
      resourceName="Log Group"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
