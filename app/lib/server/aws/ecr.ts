import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

// ── Private ECR ───────────────────────────────────────────────────────────────

export async function getEcrRepositories(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:ECR`);
  return runAwsCommand({
    env,
    region,
    service: 'ECR',
    command: 'DescribeRepositories',
    options: {},
    allPages: true,
  });
}

export async function getEcrRepository(env: string, region: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:ECR`,
    `aws:${env}:${region}:ECR:${repositoryName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'ECR',
      command: 'DescribeRepositories',
      options: { repositoryNames: [repositoryName] },
    }),
  );
}

export async function getEcrImages(env: string, region: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:ECR`,
    `aws:${env}:${region}:ECR:${repositoryName}`,
  );
  return runAwsCommand({
    env,
    region,
    service: 'ECR',
    command: 'DescribeImages',
    options: { repositoryName },
    allPages: true,
  });
}

export async function getEcrRepositoryPolicy(env: string, region: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:ECR`,
    `aws:${env}:${region}:ECR:${repositoryName}`,
  );
  try {
    return await runAwsCommand({
      env,
      region,
      service: 'ECR',
      command: 'GetRepositoryPolicy',
      options: { repositoryName },
    });
  } catch (e: any) {
    // Not all repos have a policy — treat as absent
    if (
      e?.name === 'RepositoryPolicyNotFoundException' ||
      e?.__type === 'RepositoryPolicyNotFoundException'
    ) {
      return { policyText: null };
    }
    throw e;
  }
}

// ── Public ECR ────────────────────────────────────────────────────────────────
// ECR Public API only works in us-east-1

export async function getEcrPublicRepositories(env: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:us-east-1`, `aws:${env}:us-east-1:ECRPUBLIC`);
  return runAwsCommand({
    env,
    region: 'us-east-1',
    service: 'ECRPUBLIC',
    command: 'DescribeRepositories',
    options: {},
    allPages: true,
  });
}

export async function getEcrPublicRepository(env: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:us-east-1`,
    `aws:${env}:us-east-1:ECRPUBLIC`,
    `aws:${env}:us-east-1:ECRPUBLIC:${repositoryName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region: 'us-east-1',
      service: 'ECRPUBLIC',
      command: 'DescribeRepositories',
      options: { repositoryNames: [repositoryName] },
    }),
  );
}

export async function getEcrPublicImages(env: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:us-east-1`,
    `aws:${env}:us-east-1:ECRPUBLIC`,
    `aws:${env}:us-east-1:ECRPUBLIC:${repositoryName}`,
  );
  return runAwsCommand({
    env,
    region: 'us-east-1',
    service: 'ECRPUBLIC',
    command: 'DescribeImages',
    options: { repositoryName },
    allPages: true,
  });
}

export async function getEcrPublicCatalogData(env: string, repositoryName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:us-east-1`,
    `aws:${env}:us-east-1:ECRPUBLIC`,
    `aws:${env}:us-east-1:ECRPUBLIC:${repositoryName}`,
  );
  try {
    return await runAwsCommand({
      env,
      region: 'us-east-1',
      service: 'ECRPUBLIC',
      command: 'DescribeRepositoryCatalogData',
      options: { repositoryName },
    });
  } catch (e: any) {
    if (e?.name === 'RepositoryNotFoundException' || e?.__type === 'RepositoryNotFoundException') {
      return { catalogData: null };
    }
    throw e;
  }
}
