import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { getLambdaFunction } from '@/app/lib/server/aws/lambda';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { LambdaFunctionDetail } from './lambda-function-detail';

export default async function FunctionDetailPage({
  params,
}: {
  params: Promise<{ functionName: string }>;
}) {
  const { functionName } = await params;
  const decoded = decodeURIComponent(functionName);
  const { env, region } = await resolveEnvRegion();

  const details = await awaitOrNotFound(getLambdaFunction(env, region, decoded));
  const detailsPromise = Promise.resolve(details as any);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'Lambda');
  }

  return (
    <LambdaFunctionDetail
      functionName={decoded}
      region={region}
      detailsPromise={detailsPromise}
      onRefresh={refresh}
    />
  );
}
