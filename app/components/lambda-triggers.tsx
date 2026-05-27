'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { runAwsCommandSafe } from '@/app/lib/server/actions/aws';
import { AppTable, type ColumnDefinitionType } from './app-table';
import { LoadingErrorEmptyHandler } from './loading-error-empty-handler';

type Props = {
  /** Event source ARN — typically an SQS queue ARN, DynamoDB stream ARN, etc. */
  eventSourceArn: string;
};

const columns: ColumnDefinitionType[] = [
  {
    id: 'UUID',
    header: 'UUID',
    cell: (item: any) => item.UUID,
    sortingField: 'UUID',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'ARN',
    header: 'Function',
    cell: (item: any) => {
      const fnName = String(item.FunctionArn ?? '')
        .split(':')
        .pop();
      return fnName ? (
        <Link href={`/lambda/${encodeURIComponent(fnName)}`}>{item.FunctionArn}</Link>
      ) : (
        item.FunctionArn
      );
    },
    sortingField: 'FunctionArn',
    visible: true,
  },
  {
    id: 'State',
    header: 'State',
    cell: (item: any) => (item.State === 'Enabled' ? '✓ Enabled' : `✗ ${item.State ?? 'Disabled'}`),
    sortingField: 'State',
    visible: true,
  },
  {
    id: 'LastModified',
    header: 'Last Modified',
    cell: (item: any) => (item.LastModified ? new Date(item.LastModified).toLocaleString() : '—'),
    sortingField: 'LastModified',
    visible: true,
  },
  {
    id: 'BatchSize',
    header: 'Batch Size',
    cell: (item: any) => item.BatchSize,
    sortingField: 'BatchSize',
    visible: true,
  },
];

export function LambdaTriggers({ eventSourceArn }: Props) {
  const { environment, region } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!environment || !region || !eventSourceArn) return;
    setLoading(true);
    setError(null);
    runAwsCommandSafe({
      env: environment,
      region,
      service: 'Lambda',
      command: 'ListEventSourceMappings',
      options: { EventSourceArn: eventSourceArn },
      allPages: true,
    })
      .then((res) => {
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        const data = res.data as { EventSourceMappings?: any[] };
        setItems(data.EventSourceMappings ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [environment, region, eventSourceArn]);

  return (
    <LoadingErrorEmptyHandler
      isLoading={loading}
      isError={!!error}
      errorMessage={error ?? ''}
      dataLength={items.length}
    >
      <AppTable resourceName="Lambda Trigger" columnDef={columns} items={items} pageSize={20} />
    </LoadingErrorEmptyHandler>
  );
}
