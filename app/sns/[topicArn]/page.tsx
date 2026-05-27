import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { getTopicAttributes, listSubscriptionsByTopic } from '@/app/lib/server/aws/sns';
import { awaitOrNotFound } from '@/app/lib/server/aws-not-found';
import { resolveEnvRegion } from '@/app/lib/server/env';
import { TopicDetail } from './topic-detail';

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicArn: string }>;
}) {
  const { topicArn } = await params;
  const decoded = decodeURIComponent(topicArn);
  const { env, region } = await resolveEnvRegion();

  const details = await awaitOrNotFound(getTopicAttributes(env, region, decoded));
  const detailsPromise = Promise.resolve(details as any);
  const subsPromise = listSubscriptionsByTopic(env, region, decoded).then(
    (d) => (d as any).Subscriptions ?? [],
  );

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'SNS');
  }

  const topicName = decoded.split(':').pop() ?? decoded;

  return (
    <TopicDetail
      topicName={topicName}
      topicArn={decoded}
      region={region}
      detailsPromise={detailsPromise}
      subsPromise={subsPromise}
      onRefresh={refresh}
    />
  );
}
