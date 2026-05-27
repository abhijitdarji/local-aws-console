'use client';

import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Link,
  Modal,
  Pagination,
  Table,
  type TableProps,
} from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { ViewCode } from './view-code';

// DynamoDB type keys used to unwrap { S: "..." } → "..."
const DYNAMO_SCALAR_KEYS = new Set(['S', 'N', 'B', 'BOOL', 'NULL', 'SS', 'NS', 'BS']);

function unwrapDynamo(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 1 && DYNAMO_SCALAR_KEYS.has(keys[0])) return obj[keys[0]];
  // Map / List — recurse
  if (keys.length === 1 && keys[0] === 'M')
    return unwrapDynamoRecord(obj['M'] as Record<string, unknown>);
  if (keys.length === 1 && keys[0] === 'L') return (obj['L'] as unknown[]).map(unwrapDynamo);
  return obj;
}

function unwrapDynamoRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, unwrapDynamo(v)]));
}

function sortedKeys(
  items: Record<string, unknown>[],
  partitionKey?: string,
  sortKey?: string,
): string[] {
  const unique = [...new Set(items.flatMap(Object.keys))].sort();
  // Promote partition key → first, sort key → second
  if (sortKey) {
    const i = unique.indexOf(sortKey);
    if (i > -1) {
      unique.splice(i, 1);
      unique.unshift(sortKey);
    }
  }
  if (partitionKey) {
    const i = unique.indexOf(partitionKey);
    if (i > -1) {
      unique.splice(i, 1);
      unique.unshift(partitionKey);
    }
  }
  return unique;
}

type Props = {
  rawItems: Record<string, unknown>[];
  tableDetails: any;
  hasNextPage: boolean;
};

const DEFAULT_PREFS: CollectionPreferencesProps.Preferences = {
  pageSize: 25,
  stickyColumns: { first: 1, last: 0 },
};

export function DynamoTable({ rawItems, tableDetails, hasNextPage }: Props) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<TableProps.ColumnDefinition<Record<string, unknown>>[]>(
    [],
  );
  const [modalRecord, setModalRecord] = useState<string | null>(null);

  const partitionKey = tableDetails?.Table?.KeySchema?.find((k: any) => k.KeyType === 'HASH')
    ?.AttributeName as string | undefined;
  const rangeSortKey = tableDetails?.Table?.KeySchema?.find((k: any) => k.KeyType === 'RANGE')
    ?.AttributeName as string | undefined;

  useEffect(() => {
    if (!rawItems.length) {
      setRows([]);
      setColumns([]);
      return;
    }

    const unwrapped = rawItems.map(unwrapDynamoRecord);
    const keys = sortedKeys(unwrapped, partitionKey, rangeSortKey);

    const colDefs: TableProps.ColumnDefinition<Record<string, unknown>>[] = keys.map(
      (key, idx) => ({
        id: key,
        header: key,
        width: 200,
        cell: (item) => {
          const val = item[key];
          // First column (partition key): clickable to view full JSON record
          if (idx === 0) {
            return (
              <Link
                onFollow={(e) => {
                  e.preventDefault();
                  const sorted = Object.fromEntries(keys.map((k) => [k, item[k]]));
                  setModalRecord(JSON.stringify(sorted, null, 2));
                }}
              >
                {String(val ?? '')}
              </Link>
            );
          }
          if (typeof val === 'boolean') return <i>{String(val)}</i>;
          if (typeof val === 'object' && val !== null) return JSON.stringify(val);
          return String(val ?? '');
        },
      }),
    );

    setColumns(colDefs);
    setRows(unwrapped);
  }, [rawItems, partitionKey, rangeSortKey]);

  const { items, collectionProps, paginationProps } = useCollection(rows, {
    pagination: { pageSize: preferences.pageSize },
    sorting: {},
  });

  return (
    <>
      <Table
        columnDefinitions={columns}
        items={items}
        {...collectionProps}
        resizableColumns
        enableKeyboardNavigation
        stickyColumns={preferences.stickyColumns}
        stickyHeader
        pagination={<Pagination {...paginationProps} openEnd={hasNextPage} />}
        header={
          <Header variant="h2" counter={`(${rows.length}${hasNextPage ? '+' : ''})`}>
            Items returned
          </Header>
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={preferences}
            onConfirm={({ detail }) => setPreferences(detail)}
            pageSizePreference={{
              title: 'Page size',
              options: [
                { value: 25, label: '25 records' },
                { value: 50, label: '50 records' },
                { value: 100, label: '100 records' },
              ],
            }}
            stickyColumnsPreference={{
              firstColumns: {
                title: 'Stick first column(s)',
                description: 'Keep the first column(s) visible while scrolling.',
                options: [
                  { label: 'None', value: 0 },
                  { label: 'First column', value: 1 },
                  { label: 'First two columns', value: 2 },
                ],
              },
              lastColumns: {
                title: 'Stick last column',
                description: 'Keep the last column visible while scrolling.',
                options: [
                  { label: 'None', value: 0 },
                  { label: 'Last column', value: 1 },
                ],
              },
            }}
          />
        }
      />

      <Modal
        size="large"
        visible={modalRecord !== null}
        onDismiss={() => setModalRecord(null)}
        header="Record"
      >
        {modalRecord && <ViewCode code={modalRecord} language="json" height="500px" />}
      </Modal>
    </>
  );
}
