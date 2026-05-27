'use client';

import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Box,
  Button,
  Icon,
  Pagination,
  Table,
  type TableProps,
  TextFilter,
} from '@cloudscape-design/components';
import { useEffect, useMemo, useState } from 'react';
import { DateUtils } from '@/app/lib/dates';
import { CopyText } from './copy-text';

export type LogEntry = {
  timestamp: number;
  message: string;
};

type Props = {
  logs: LogEntry[];
  /** "Plain text" mode renders just a stack of <pre> blocks (no table chrome). */
  viewPlainText?: boolean;
  /** Master toggle: expand all rows. Local per-row state still works on top of it. */
  expandAllRows?: boolean;
  /** Local timezone formatting. Defaults to true; pass false for UTC display. */
  useLocalTimezone?: boolean;
};

type Row = LogEntry & { id: string; isoTimestamp: string };

const JSON_LIKE = /\{[\s\S]*?\}/g;

/**
 * Best-effort JSON pretty-print: find any {…} substrings and reformat with
 * indentation. Leaves non-JSON segments untouched.
 */
function prettyPrintJson(message: string): string {
  if (!message) return message;
  return message.replace(JSON_LIKE, (match) => {
    try {
      return JSON.stringify(JSON.parse(match), null, 2);
    } catch {
      return match;
    }
  });
}

function formatTs(ts: number, useLocal: boolean): string {
  const tz = useLocal ? DateUtils.getLocalTimeZone() : DateUtils.UTC_TZ;
  return DateUtils.formatDateAsTz(ts, DateUtils.LOG_TIMESTAMP_FORMAT, tz) ?? '';
}

export function LogEventsTable({
  logs,
  viewPlainText = false,
  expandAllRows = false,
  useLocalTimezone = true,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // When the parent toggles "expand all", seed our row set with every id (or
  // clear it). After that, per-row clicks still work independently.
  useEffect(() => {
    if (expandAllRows) {
      setExpanded(new Set(logs.map((_, i) => String(i))));
    } else {
      setExpanded(new Set());
    }
  }, [expandAllRows, logs]);

  const rows: Row[] = useMemo(
    () =>
      logs.map((l, i) => ({
        ...l,
        id: String(i),
        isoTimestamp: formatTs(l.timestamp, useLocalTimezone),
      })),
    [logs, useLocalTimezone],
  );

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { items, collectionProps, filterProps, filteredItemsCount, paginationProps, actions } =
    useCollection(rows, {
      filtering: {
        filteringFunction: (item, filterText) =>
          item.message.toLowerCase().includes(filterText.toLowerCase()),
        empty: (
          <Box textAlign="center" color="inherit" padding="m">
            <b>No events</b>
          </Box>
        ),
        noMatch: (
          <Box textAlign="center" color="inherit" padding="m">
            <SpaceLikeStack>
              <Box variant="strong">No matches</Box>
              <Box variant="p">No log events matched the filter text.</Box>
              <Button onClick={() => actions.setFiltering('')}>Clear filter</Button>
            </SpaceLikeStack>
          </Box>
        ),
      },
      pagination: { pageSize: viewPlainText ? 200 : 50 },
      sorting: {},
    });

  // Plain-text mode: just render a stack of <pre> blocks. We still respect the
  // TextFilter via `items` from useCollection so search still works.
  if (viewPlainText) {
    return (
      <div>
        <div style={{ marginBottom: 12, maxWidth: 480 }}>
          <TextFilter
            {...filterProps}
            filteringPlaceholder="Find in messages"
            countText={`${filteredItemsCount ?? 0} ${filteredItemsCount === 1 ? 'match' : 'matches'}`}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((row) => (
            <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Box variant="span" fontSize="body-s" color="text-status-info">
                {row.isoTimestamp}
              </Box>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 'var(--font-size-body-s, 12px)',
                  flex: 1,
                }}
              >
                {prettyPrintJson(row.message)}
              </pre>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Pagination {...paginationProps} />
        </div>
      </div>
    );
  }

  const columns: TableProps.ColumnDefinition<Row>[] = [
    {
      id: 'expand',
      header: '',
      cell: (item) => (
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleRow(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleRow(item.id);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <Icon name={expanded.has(item.id) ? 'caret-down-filled' : 'caret-right-filled'} />
        </div>
      ),
      width: 40,
      minWidth: 40,
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      cell: (item) => (
        <span
          role="button"
          tabIndex={0}
          onClick={() => toggleRow(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleRow(item.id);
            }
          }}
          style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {item.isoTimestamp}
        </span>
      ),
      sortingField: 'timestamp',
      width: 220,
    },
    {
      id: 'message',
      header: 'Message',
      cell: (item) => {
        const isOpen = expanded.has(item.id);
        if (!isOpen) {
          return (
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleRow(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleRow(item.id);
                }
              }}
              style={{
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {item.message}
            </div>
          );
        }
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <CopyText copyText={item.message} buttonText="Copy" />
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 'var(--font-size-body-s, 12px)',
              }}
            >
              {prettyPrintJson(item.message)}
            </pre>
          </div>
        );
      },
      sortingField: 'message',
      minWidth: 400,
    },
  ];

  return (
    <Table
      {...collectionProps}
      columnDefinitions={columns}
      items={items}
      variant="container"
      resizableColumns
      stripedRows
      stickyColumns={{ first: 1 }}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Find in messages"
          countText={`${filteredItemsCount ?? 0} ${filteredItemsCount === 1 ? 'match' : 'matches'}`}
        />
      }
      pagination={<Pagination {...paginationProps} />}
    />
  );
}

// Tiny helper so the no-match `empty` block stays close to a SpaceBetween-look
// without importing it (avoids a circular component dep when used in tests).
function SpaceLikeStack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
}
