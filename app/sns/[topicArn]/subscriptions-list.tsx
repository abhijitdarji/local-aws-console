'use client';

import { Container, Header } from '@cloudscape-design/components';
import { use } from 'react';
import { AppTable, type ColumnDefinitionType } from '@/app/components/app-table';

const columns: ColumnDefinitionType[] = [
  {
    id: 'SubscriptionArn',
    header: 'ARN',
    cell: (item: any) => item.SubscriptionArn,
    sortingField: 'SubscriptionArn',
    visible: true,
    isKey: true,
    isRowHeader: true,
  },
  {
    id: 'Protocol',
    header: 'Protocol',
    cell: (item: any) => item.Protocol,
    sortingField: 'Protocol',
    visible: true,
  },
  {
    id: 'Endpoint',
    header: 'Endpoint',
    cell: (item: any) => item.Endpoint,
    sortingField: 'Endpoint',
    visible: true,
  },
  {
    id: 'Owner',
    header: 'Owner',
    cell: (item: any) => item.Owner,
    sortingField: 'Owner',
    visible: true,
  },
];

export function SubscriptionsList({ subsPromise }: { subsPromise: Promise<any[]> }) {
  const subs = use(subsPromise);
  return (
    <Container header={<Header variant="h2">Subscriptions</Header>}>
      <AppTable resourceName="Subscription" columnDef={columns} items={subs} />
    </Container>
  );
}
