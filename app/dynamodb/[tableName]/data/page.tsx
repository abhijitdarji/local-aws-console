import { describeTable } from '@/app/lib/server/aws/dynamodb';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { TableData } from './table-data';

export default async function TableDataPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = await params;
  const decoded = decodeURIComponent(tableName);
  const { env, region } = await resolveEnvRegion();

  const details = await awaitOrNotFound(describeTable(env, region, decoded));
  const tableDetailsPromise = Promise.resolve(details as any);

  return (
    <TableData
      tableName={decoded}
      env={env}
      region={region}
      tableDetailsPromise={tableDetailsPromise}
    />
  );
}
