import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

export async function getLambdaFunctions(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:Lambda`);
  return runAwsCommand({
    env,
    region,
    service: 'Lambda',
    command: 'ListFunctions',
    options: {},
    allPages: true,
  });
}

export async function getLambdaFunction(env: string, region: string, functionName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:Lambda`,
    `aws:${env}:${region}:Lambda:${functionName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'Lambda',
      command: 'GetFunction',
      options: { FunctionName: functionName },
    }),
  );
}
