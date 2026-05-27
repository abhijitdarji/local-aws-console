'use client';

import { useCollection } from '@cloudscape-design/collection-hooks';
import type { TableProps } from '@cloudscape-design/components';
import { Icon, Link, Table } from '@cloudscape-design/components';
import { useMemo, useState } from 'react';

// Each row from CWL Insights is an array of { field, value } objects
type LogField = { field: string; value: string };
type RawRow = LogField[];

type Props = {
  logs: RawRow[];
  // if a single log group was selected, the @logStream column becomes a link
  logGroupName?: string;
};

// Transform the array-of-field-objects into a plain key->value record
function transformRow(raw: RawRow, id: number): Record<string, string> {
  const out: Record<string, string> = { _id: String(id) };
  for (const { field, value } of raw) {
    out[field] = value;
  }
  return out;
}

type RowItem = Record<string, string>;

function ExpandedRow({ row, ptr }: { row: RowItem; ptr?: string }) {
  const entries = Object.entries(row).filter(([k]) => k !== '_id' && k !== '@ptr');
  return (
    <div
      style={{
        padding: '8px 16px 12px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.6',
      }}
    >
      {entries.map(([k, v]) => (
        <div key={k}>
          <strong>{k}:</strong> {v}
        </div>
      ))}
      {ptr && (
        <div style={{ marginTop: 4, color: '#888' }}>
          <strong>@ptr:</strong> {ptr}
        </div>
      )}
    </div>
  );
}

export function LogInsightsTable({ logs, logGroupName = '' }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const rows: RowItem[] = useMemo(() => logs.map((raw, i) => transformRow(raw, i + 1)), [logs]);

  const { items, collectionProps } = useCollection(rows, {});

  if (logs.length === 0) return null;

  const firstRow = logs[0];
  const uniqueFields = firstRow.map((f) => f.field).filter((f) => f !== '@ptr');

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columnDefs: TableProps.ColumnDefinition<RowItem>[] = [
    {
      id: '_expand',
      header: '#',
      width: 50,
      maxWidth: 50,
      cell: (item) => (
        <span
          role="button"
          tabIndex={0}
          onClick={() => toggleExpanded(item._id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpanded(item._id);
            }
          }}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {expandedIds.has(item._id) ? (
            <Icon name="caret-down-filled" />
          ) : (
            <Icon name="caret-right-filled" />
          )}{' '}
          {item._id}
        </span>
      ),
    },
    // first real field gets expand-on-click + shows expanded content inline
    {
      id: uniqueFields[0],
      header: uniqueFields[0],
      minWidth: 260,
      cell: (item) => {
        const key = uniqueFields[0];
        const isExpanded = expandedIds.has(item._id);
        return (
          <div>
            <span
              role="button"
              tabIndex={0}
              onClick={() => toggleExpanded(item._id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpanded(item._id);
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item[key]}
            </span>
            {isExpanded && <ExpandedRow row={item} ptr={item['@ptr']} />}
          </div>
        );
      },
    },
    // remaining fields
    ...uniqueFields.slice(1).map(
      (key): TableProps.ColumnDefinition<RowItem> => ({
        id: key,
        header: key,
        minWidth: key === '@logStream' ? 260 : 400,
        cell: (item) => {
          if (key === '@logStream' && logGroupName) {
            return (
              <Link
                href={`/cloudwatchlogs/${encodeURIComponent(logGroupName)}/${encodeURIComponent(item[key] ?? '')}`}
                variant="secondary"
              >
                {item[key]}
              </Link>
            );
          }
          return (
            <span
              role="button"
              tabIndex={0}
              onClick={() => toggleExpanded(item._id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpanded(item._id);
                }
              }}
              style={{
                cursor: 'pointer',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item[key]}
            </span>
          );
        },
      }),
    ),
  ];

  return (
    <Table
      columnDefinitions={columnDefs}
      items={items}
      {...collectionProps}
      resizableColumns
      stripedRows
      stickyColumns={{ first: 1 }}
    />
  );
}
