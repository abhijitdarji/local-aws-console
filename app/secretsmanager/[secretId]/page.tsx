import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { describeSecret, getSecretValue } from '@/app/lib/server/aws/secretsmanager';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { SecretDetail } from './secret-detail';

export default async function SecretDetailPage({
  params,
}: {
  params: Promise<{ secretId: string }>;
}) {
  const { secretId } = await params;
  const decoded = decodeURIComponent(secretId);
  const { env, region } = await resolveEnvRegion();

  // describeSecret is the existence check — if the secret is missing it
  // throws ResourceNotFoundException, which awaitOrNotFound converts to a
  // Next.js notFound(). The value request is allowed to stream to the
  // client as before (its own Suspense boundary).
  const details = await awaitOrNotFound(describeSecret(env, region, decoded));
  const detailsPromise = Promise.resolve(details as any);
  const valuePromise = getSecretValue(env, region, decoded).then((d) => d as any);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'SecretsManager');
  }

  return (
    <SecretDetail
      secretId={decoded}
      region={region}
      detailsPromise={detailsPromise}
      valuePromise={valuePromise}
      onRefresh={refresh}
    />
  );
}
