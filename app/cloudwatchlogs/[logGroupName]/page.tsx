'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { FileSize } from '@/app/components/file-size';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { DateUtils } from '@/app/lib/dates';

function makeColumns(logGroupName: string): ColumnDefinitionType[] {
  return [
    {
      id: 'logStreamName',
      header: 'Log Stream',
      cell: (item: any) => (
        <Link
          href={`/cloudwatchlogs/${encodeURIComponent(logGroupName)}/${encodeURIComponent(item.logStreamName)}`}
        >
          {item.logStreamName}
        </Link>
      ),
      sortingField: 'logStreamName',
      isRowHeader: true,
      visible: true,
      isKey: true,
    },
    {
      id: 'firstEventTimestamp',
      header: 'First Event',
      cell: (item: any) =>
        item.firstEventTimestamp ? DateUtils.fomatTimestamp(item.firstEventTimestamp) : '—',
      sortingField: 'firstEventTimestamp',
      visible: true,
    },
    {
      id: 'lastEventTimestamp',
      header: 'Last Event',
      cell: (item: any) =>
        item.lastEventTimestamp ? DateUtils.fomatTimestamp(item.lastEventTimestamp) : '—',
      sortingField: 'lastEventTimestamp',
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
      id: 'creationTime',
      header: 'Created',
      cell: (item: any) => (item.creationTime ? DateUtils.fomatTimestamp(item.creationTime) : '—'),
      sortingField: 'creationTime',
      visible: false,
    },
  ];
}

export default function LogStreamsPage() {
  const { logGroupName: encoded } = useParams<{ logGroupName: string }>();
  const decoded = decodeURIComponent(encoded);

  const options = useMemo(
    () => ({
      logGroupName: decoded,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 50,
    }),
    [decoded],
  );

  const columns = useMemo(() => makeColumns(decoded), [decoded]);

  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'CloudWatchLogs',
    'DescribeLogStreams',
    'logStreams',
    options,
    false,
  );

  return (
    <ResourceListPage
      title={`Log Streams: ${decoded}`}
      resourceName="Log Stream"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodeURIComponent(decoded)}`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
