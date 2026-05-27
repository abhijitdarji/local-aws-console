'use client';

import type { TableProps } from '@cloudscape-design/components';
import { Box, Button, SpaceBetween, StatusIndicator, Table } from '@cloudscape-design/components';
import { useCallback, useEffect, useState } from 'react';
import { DateUtils } from '@/app/lib/dates';
import { describeQueries } from '@/app/lib/server/actions/cloudwatchlogs-actions';
import { CopyText } from './copy-text';

type QueryEntry = {
  queryId: string;
  queryString: string;
  queryStringWithoutSource: string;
  logGroupNames: string;
  status: string;
  createTimeAgo: string;
};

type Props = {
  environment: string;
  region: string;
  onSelectQuery?: (queryString: string) => void;
};

function parseEntry(q: Record<string, unknown>): QueryEntry {
  const queryString = String(q.queryString ?? '');
  const parts = queryString.split('|');
  const logGroupNames = parts
    .filter((p) => p.trim().startsWith('SOURCE'))
    .map((p) => {
      const m = p.match(/SOURCE\s+"([^"]+)"/);
      return m ? m[1] : '';
    })
    .filter(Boolean)
    .join(', ');
  const queryStringWithoutSource =
    parts.length > 1 ? parts.filter((p) => !p.trim().startsWith('SOURCE')).join('|') : queryString;
  const createTime = q.createTime as number | undefined;
  const createTimeAgo = createTime
    ? (DateUtils.formatDateAgo(createTime * 1000)?.replace('about ', '') ?? '')
    : '';
  return {
    queryId: String(q.queryId ?? ''),
    queryString,
    queryStringWithoutSource,
    logGroupNames,
    status: String(q.status ?? ''),
    createTimeAgo,
  };
}

export function QueryHistoryPanel({ environment, region, onSelectQuery }: Props) {
  const [queries, setQueries] = useState<QueryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!environment || !region) return;
    setLoading(true);
    setError('');
    try {
      const result = await describeQueries(environment, region);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const raw = (result.data as Record<string, unknown>).queries as Record<string, unknown>[];
      setQueries((raw ?? []).map(parseEntry));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [environment, region]);

  useEffect(() => {
    load();
  }, [load]);

  const columnDefs: TableProps.ColumnDefinition<QueryEntry>[] = [
    {
      id: 'createTime',
      header: 'Last Run',
      cell: (item) => item.createTimeAgo,
      width: 120,
    },
    {
      id: 'query',
      header: 'Query',
      cell: (item) => <CopyText copyText={item.queryStringWithoutSource} iconOnly />,
      width: 60,
    },
    {
      id: 'logGroupNames',
      header: 'Log Group',
      cell: (item) => item.logGroupNames || '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) =>
        item.status === 'Complete' ? (
          <StatusIndicator type="success">Complete</StatusIndicator>
        ) : (
          <StatusIndicator type="error">{item.status}</StatusIndicator>
        ),
      width: 120,
    },
    ...(onSelectQuery
      ? [
          {
            id: 'use',
            header: '',
            cell: (item: QueryEntry) => (
              <Button
                variant="inline-link"
                onClick={() => onSelectQuery(item.queryStringWithoutSource)}
              >
                Use
              </Button>
            ),
            width: 60,
          } as TableProps.ColumnDefinition<QueryEntry>,
        ]
      : []),
  ];

  if (error) {
    return (
      <Box color="text-status-error" padding="s">
        {error}
      </Box>
    );
  }

  return (
    <SpaceBetween size="s">
      <Button iconName="refresh" variant="icon" loading={loading} onClick={load} />
      <Table
        columnDefinitions={columnDefs}
        items={queries}
        loading={loading}
        loadingText="Loading history…"
        empty={<Box textAlign="center">No recent queries</Box>}
        stripedRows
      />
    </SpaceBetween>
  );
}
