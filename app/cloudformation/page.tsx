'use client';

import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { cloudformationColumns } from './columns';

export default function CloudFormationPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'CloudFormation',
    'DescribeStacks',
    'Stacks',
  );

  return (
    <ResourceListPage
      title="CloudFormation Stacks"
      resourceName="Stack"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks`}
      columns={cloudformationColumns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
