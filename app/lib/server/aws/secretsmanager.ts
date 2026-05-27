import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

export async function listSecrets(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SecretsManager`);
  return runAwsCommand({
    env,
    region,
    service: 'SecretsManager',
    command: 'ListSecrets',
    options: {},
    allPages: true,
  });
}

export async function describeSecret(env: string, region: string, secretId: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SecretsManager`);
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'SecretsManager',
      command: 'DescribeSecret',
      options: { SecretId: secretId },
    }),
  );
}

export async function getSecretValue(env: string, region: string, secretId: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 300, expire: 600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:SecretsManager`);
  return runAwsCommand({
    env,
    region,
    service: 'SecretsManager',
    command: 'GetSecretValue',
    options: { SecretId: secretId },
  });
}
