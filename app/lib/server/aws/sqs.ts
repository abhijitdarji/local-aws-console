import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

export async function listQueues(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SQS`);
  return runAwsCommand({
    env,
    region,
    service: 'SQS',
    command: 'ListQueues',
    options: { MaxResults: 1000 },
    allPages: false,
  });
}

export async function getQueueAttributes(env: string, region: string, queueUrl: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 300, expire: 600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SQS`);
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'SQS',
      command: 'GetQueueAttributes',
      options: { QueueUrl: queueUrl, AttributeNames: ['All'] },
    }),
  );
}

export async function listEventSourceMappings(env: string, region: string, queueArn: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:Lambda`);
  return runAwsCommand({
    env,
    region,
    service: 'Lambda',
    command: 'ListEventSourceMappings',
    options: { EventSourceArn: queueArn },
    allPages: true,
  });
}
