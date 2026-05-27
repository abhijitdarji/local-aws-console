'use client';

import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';

const columns: ColumnDefinitionType[] = [
  {
    id: 'Name',
    header: 'Export Name',
    cell: (item: any) => item.Name,
    sortingField: 'Name',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Value',
    header: 'Value',
    cell: (item: any) => item.Value,
    sortingField: 'Value',
    visible: true,
  },
  {
    id: 'ExportingStackId',
    header: 'Exporting Stack',
    cell: (item: any) => item.ExportingStackId?.split('/')[1] ?? item.ExportingStackId,
    sortingField: 'ExportingStackId',
    visible: true,
  },
];

export default function CloudFormationExportsPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'CloudFormation',
    'ListExports',
    'Exports',
  );

  return (
    <ResourceListPage
      title="CloudFormation Exports"
      resourceName="Export"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/exports`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
