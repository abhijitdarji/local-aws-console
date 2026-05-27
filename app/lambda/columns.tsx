import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';

export const lambdaColumns: ColumnDefinitionType[] = [
  {
    id: 'FunctionName',
    header: 'Function Name',
    cell: (item: any) => (
      <Link href={`/lambda/${encodeURIComponent(item.FunctionName)}`}>{item.FunctionName}</Link>
    ),
    sortingField: 'FunctionName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'Description',
    header: 'Description',
    cell: (item: any) => item.Description,
    sortingField: 'Description',
    visible: true,
  },
  {
    id: 'Runtime',
    header: 'Runtime',
    cell: (item: any) => item.Runtime,
    sortingField: 'Runtime',
    visible: true,
  },
  {
    id: 'LastModified',
    header: 'Last Modified',
    cell: (item: any) =>
      new Date(item.LastModified).toISOString().replace('T', ' ').replace('Z', ''),
    sortingField: 'LastModified',
    visible: true,
  },
  {
    id: 'MemorySize',
    header: 'Memory Size',
    cell: (item: any) => item.MemorySize,
    sortingField: 'MemorySize',
    visible: false,
  },
  {
    id: 'Timeout',
    header: 'Timeout',
    cell: (item: any) => item.Timeout,
    sortingField: 'Timeout',
    visible: false,
  },
];
