import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';

export async function describeLogGroups(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:CloudWatchLogs`);
  return runAwsCommand({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'DescribeLogGroups',
    options: { limit: 50 },
    allPages: true,
  });
}

export async function describeLogStreams(env: string, region: string, logGroupName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 600, expire: 1200 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:CloudWatchLogs`);
  return runAwsCommand({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'DescribeLogStreams',
    options: {
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 50,
    },
  });
}
