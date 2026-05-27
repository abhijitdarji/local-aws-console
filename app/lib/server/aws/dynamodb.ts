import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

export async function listTables(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:DynamoDB`);
  return runAwsCommand({
    env,
    region,
    service: 'DynamoDB',
    command: 'ListTables',
    options: {},
    allPages: true,
  });
}

export async function describeTable(env: string, region: string, tableName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:DynamoDB`,
    `aws:${env}:${region}:DynamoDB:${tableName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'DynamoDB',
      command: 'DescribeTable',
      options: { TableName: tableName },
    }),
  );
}
