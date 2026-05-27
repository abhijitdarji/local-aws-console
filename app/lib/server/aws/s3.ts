import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';

export async function listBuckets(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:S3`);
  return runAwsCommand({ env, region, service: 'S3', command: 'ListBuckets', options: {} });
}

export async function listObjectsV2(env: string, region: string, bucket: string, prefix: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 600, expire: 1800 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:S3`, `aws:${env}:${region}:S3:${bucket}`);
  return runAwsCommand({
    env,
    region,
    service: 'S3',
    command: 'ListObjectsV2',
    options: { Bucket: bucket, Prefix: prefix, Delimiter: '/' },
  });
}
