'use client';

import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { lambdaColumns } from './columns';

export default function LambdaPage() {
  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'Lambda',
    'ListFunctions',
    'Functions',
  );

  return (
    <ResourceListPage
      title="Lambda"
      resourceName="Function"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions`}
      columns={lambdaColumns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
