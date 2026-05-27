'use client';

import { Box, Button } from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { Suspense, use } from 'react';
import { AppTable, type ColumnDefinitionType } from '@/app/components/app-table';
import { FileSize } from '@/app/components/file-size';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { DateUtils } from '@/app/lib/dates';

type Props = {
  tableName: string;
  region: string;
  detailsPromise: Promise<any>;
  onRefresh: () => Promise<void>;
};

type KeySchemaEntry = { AttributeName: string; KeyType: 'HASH' | 'RANGE' };

function pickKey(schema: KeySchemaEntry[] | undefined, type: 'HASH' | 'RANGE'): string {
  return schema?.find((k) => k.KeyType === type)?.AttributeName ?? '—';
}

const gsiColumns: ColumnDefinitionType[] = [
  {
    id: 'IndexName',
    header: 'Name',
    cell: (item: any) => item.IndexName,
    sortingField: 'IndexName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'IndexStatus',
    header: 'Status',
    cell: (item: any) => item.IndexStatus,
    sortingField: 'IndexStatus',
    visible: true,
  },
  {
    id: 'PartitionKey',
    header: 'Partition Key',
    cell: (item: any) => pickKey(item.KeySchema, 'HASH'),
    visible: true,
  },
  {
    id: 'SortKey',
    header: 'Sort Key',
    cell: (item: any) => pickKey(item.KeySchema, 'RANGE'),
    visible: true,
  },
  {
    id: 'ItemCount',
    header: 'Item Count',
    cell: (item: any) => item.ItemCount?.toLocaleString() ?? '—',
    sortingField: 'ItemCount',
    visible: true,
  },
  {
    id: 'IndexSizeBytes',
    header: 'Size',
    cell: (item: any) =>
      typeof item.IndexSizeBytes === 'number' ? <FileSize bytes={item.IndexSizeBytes} /> : '—',
    sortingField: 'IndexSizeBytes',
    visible: true,
  },
];

export function TableDetail(props: Props) {
  const awsUrl = `https://${props.region}.console.aws.amazon.com/dynamodbv2/home?region=${props.region}#table?name=${props.tableName}&tab=overview`;
  return (
    <Suspense fallback={<LoadingErrorEmptyHandler isLoading />}>
      <TableDetailBody {...props} awsUrl={awsUrl} />
    </Suspense>
  );
}

function TableDetailBody({
  tableName,
  detailsPromise,
  onRefresh,
  awsUrl,
}: Props & { awsUrl: string }) {
  const router = useRouter();
  const data = use(detailsPromise);
  const t = data?.Table ?? {};
  const gsis: any[] = t.GlobalSecondaryIndexes ?? [];

  const resolved = Promise.resolve(data);

  const tabs = [
    {
      label: 'Indexes',
      id: 'indexes',
      content:
        gsis.length === 0 ? (
          <Box color="text-status-inactive" padding="m">
            No global secondary indexes.
          </Box>
        ) : (
          <AppTable
            resourceName="Global Secondary Index"
            columnDef={gsiColumns}
            items={gsis}
            pageSize={20}
          />
        ),
    },
  ];

  return (
    <ResourceDetailPage
      title={tableName}
      detailsPromise={resolved}
      awsConsoleUrl={awsUrl}
      onRefresh={onRefresh}
      copyArn={t.TableArn}
      extraActions={
        <Button
          variant="primary"
          iconName="search"
          onClick={() => router.push(`/dynamodb/${encodeURIComponent(tableName)}/data`)}
        >
          Explore table items
        </Button>
      }
      tabs={tabs}
    >
      {() => (
        <>
          <KeyValueGrid
            fields={[
              { label: 'Status', value: t.TableStatus },
              { label: 'Partition Key', value: pickKey(t.KeySchema, 'HASH') },
              { label: 'Sort Key', value: pickKey(t.KeySchema, 'RANGE') },
              { label: 'Table Class', value: t.TableClassSummary?.TableClass ?? '—' },
            ]}
          />
          <KeyValueGrid
            fields={[
              { label: 'Item Count', value: t.ItemCount?.toLocaleString() ?? '—' },
              {
                label: 'Table Size',
                value:
                  typeof t.TableSizeBytes === 'number' ? (
                    <FileSize bytes={t.TableSizeBytes} />
                  ) : (
                    '—'
                  ),
              },
              { label: 'Billing Mode', value: t.BillingModeSummary?.BillingMode ?? '—' },
              {
                label: 'Created',
                value: t.CreationDateTime
                  ? DateUtils.fomatTimestamp(new Date(t.CreationDateTime).getTime())
                  : '—',
              },
            ]}
          />
          <KeyValueGrid
            fields={[
              { label: 'Read Capacity', value: t.ProvisionedThroughput?.ReadCapacityUnits ?? '—' },
              {
                label: 'Write Capacity',
                value: t.ProvisionedThroughput?.WriteCapacityUnits ?? '—',
              },
            ]}
          />
        </>
      )}
    </ResourceDetailPage>
  );
}
