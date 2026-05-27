import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { getQueueAttributes } from '@/app/lib/server/aws/sqs';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { QueueDetail } from './queue-detail';

export default async function QueueDetailPage({
  params,
}: {
  params: Promise<{ queueUrl: string }>;
}) {
  const { queueUrl } = await params;
  const decoded = decodeURIComponent(queueUrl);
  const { env, region } = await resolveEnvRegion();

  const details = await awaitOrNotFound(getQueueAttributes(env, region, decoded));
  const detailsPromise = Promise.resolve(details as any);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'SQS');
  }

  const queueName = decoded.split('/').pop() ?? decoded;

  return (
    <QueueDetail
      queueName={queueName}
      queueUrl={decoded}
      region={region}
      detailsPromise={detailsPromise}
      onRefresh={refresh}
    />
  );
}
