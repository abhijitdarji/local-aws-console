'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { runAwsCommandSafe } from '@/app/lib/server/actions/aws';
import { AppTable, type ColumnDefinitionType } from './app-table';
import { LoadingErrorEmptyHandler } from './loading-error-empty-handler';

type Props = {
  /** Endpoint to filter on — typically a queue ARN, lambda ARN, http URL, etc. */
  endpoint: string;
};

const columns: ColumnDefinitionType[] = [
  {
    id: 'TopicArn',
    header: 'Topic',
    cell: (item: any) =>
      item.TopicArn ? (
        <Link href={`/sns/${encodeURIComponent(item.TopicArn)}`}>{item.TopicArn}</Link>
      ) : (
        '—'
      ),
    sortingField: 'TopicArn',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Protocol',
    header: 'Protocol',
    cell: (item: any) => item.Protocol,
    sortingField: 'Protocol',
    visible: true,
  },
  {
    id: 'Owner',
    header: 'Owner',
    cell: (item: any) => item.Owner,
    sortingField: 'Owner',
    visible: true,
  },
  {
    id: 'SubscriptionArn',
    header: 'Subscription ARN',
    cell: (item: any) => item.SubscriptionArn,
    sortingField: 'SubscriptionArn',
    visible: true,
  },
];

export function SnsSubscriptions({ endpoint }: Props) {
  const { environment, region } = useAppStore();
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!environment || !region) return;
    setLoading(true);
    setError(null);
    runAwsCommandSafe({
      env: environment,
      region,
      service: 'SNS',
      command: 'ListSubscriptions',
      options: {},
      allPages: true,
    })
      .then((res) => {
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        const data = res.data as { Subscriptions?: any[] };
        setAll(data.Subscriptions ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [environment, region]);

  const filtered = useMemo(
    () => (endpoint ? all.filter((s) => s.Endpoint === endpoint) : []),
    [all, endpoint],
  );

  return (
    <LoadingErrorEmptyHandler
      isLoading={loading}
      isError={!!error}
      errorMessage={error ?? ''}
      dataLength={filtered.length}
    >
      <AppTable
        resourceName="SNS Subscription"
        columnDef={columns}
        items={filtered}
        pageSize={20}
      />
    </LoadingErrorEmptyHandler>
  );
}
