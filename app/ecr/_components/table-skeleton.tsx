'use client';

import { Table } from '@cloudscape-design/components';

const skeletonColumns = [
  { id: 'name', header: 'Repository Name', cell: () => '' },
  { id: 'uri', header: 'URI', cell: () => '' },
  { id: 'extra', header: '', cell: () => '' },
];

export function TableSkeleton() {
  return (
    <Table
      loading
      loadingText="Loading repositories…"
      columnDefinitions={skeletonColumns}
      items={[]}
      stripedRows
    />
  );
}
