import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { describeTable } from '@/app/lib/server/aws/dynamodb';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { TableDetail } from './table-detail';

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = await params;
  const decoded = decodeURIComponent(tableName);
  const { env, region } = await resolveEnvRegion();

  const details = await awaitOrNotFound(describeTable(env, region, decoded));
  const detailsPromise = Promise.resolve(details as any);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'DynamoDB');
  }

  return (
    <TableDetail
      tableName={decoded}
      region={region}
      detailsPromise={detailsPromise}
      onRefresh={refresh}
    />
  );
}
