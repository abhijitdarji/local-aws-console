import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';

export async function listStacks(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:CloudFormation`);
  return runAwsCommand({
    env,
    region,
    service: 'CloudFormation',
    command: 'DescribeStacks',
    options: {},
    allPages: false,
  });
}

export async function listExports(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:CloudFormation`);
  return runAwsCommand({
    env,
    region,
    service: 'CloudFormation',
    command: 'ListExports',
    options: {},
    allPages: true,
  });
}

export async function getStackResources(env: string, region: string, stackName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:CloudFormation`);
  return runAwsCommand({
    env,
    region,
    service: 'CloudFormation',
    command: 'ListStackResources',
    options: { StackName: stackName },
    allPages: true,
  });
}
