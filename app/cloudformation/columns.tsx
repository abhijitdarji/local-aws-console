import Link from 'next/link';
import type { ColumnDefinitionType } from '@/app/components/app-table';

const statusEmoji: Record<string, string> = {
  CREATE_COMPLETE: '✓',
  UPDATE_COMPLETE: '✓',
  DELETE_COMPLETE: '✓',
  ROLLBACK_COMPLETE: '⚠',
  CREATE_FAILED: '✗',
  DELETE_FAILED: '✗',
  UPDATE_FAILED: '✗',
  CREATE_IN_PROGRESS: '…',
  DELETE_IN_PROGRESS: '…',
  UPDATE_IN_PROGRESS: '…',
};

export const cloudformationColumns: ColumnDefinitionType[] = [
  {
    id: 'StackName',
    header: 'Stack Name',
    cell: (item: any) => (
      <Link href={`/cloudformation/${encodeURIComponent(item.StackId)}`}>{item.StackName}</Link>
    ),
    sortingField: 'StackName',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'StackStatus',
    header: 'Status',
    cell: (item: any) => `${statusEmoji[item.StackStatus] ?? '•'} ${item.StackStatus}`,
    sortingField: 'StackStatus',
    visible: true,
  },
  {
    id: 'Description',
    header: 'Description',
    cell: (item: any) => item.Description,
    sortingField: 'Description',
    visible: true,
  },
  {
    id: 'CreationTime',
    header: 'Created',
    cell: (item: any) => (item.CreationTime ? new Date(item.CreationTime).toLocaleString() : '—'),
    sortingField: 'CreationTime',
    visible: true,
  },
  {
    id: 'LastUpdatedTime',
    header: 'Last Updated',
    cell: (item: any) =>
      item.LastUpdatedTime ? new Date(item.LastUpdatedTime).toLocaleString() : '—',
    sortingField: 'LastUpdatedTime',
    visible: true,
  },
];
