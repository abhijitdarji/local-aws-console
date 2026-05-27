import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

export async function listTopics(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SNS`);
  return runAwsCommand({
    env,
    region,
    service: 'SNS',
    command: 'ListTopics',
    options: {},
    allPages: true,
  });
}

export async function getTopicAttributes(env: string, region: string, topicArn: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SNS`);
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'SNS',
      command: 'GetTopicAttributes',
      options: { TopicArn: topicArn },
    }),
  );
}

export async function listSubscriptionsByTopic(env: string, region: string, topicArn: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SNS`);
  return runAwsCommand({
    env,
    region,
    service: 'SNS',
    command: 'ListSubscriptionsByTopic',
    options: { TopicArn: topicArn },
    allPages: true,
  });
}

// All subscriptions in the account (used by the SQS detail page to find SNS
// topics that publish to a given queue ARN by filtering on `Endpoint`).
export async function listAllSubscriptions(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SNS`);
  return runAwsCommand({
    env,
    region,
    service: 'SNS',
    command: 'ListSubscriptions',
    options: {},
    allPages: true,
  });
}
