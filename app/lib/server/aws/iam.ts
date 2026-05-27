import { cacheLife, cacheTag } from 'next/cache';
import { runAwsCommand } from '../actions/aws';
import { nullIfAwsNotFound } from '../aws-not-found';

// IAM is a global service. We still scope cache tags by env+region so the
// existing `revalidateAws(env, region)` helper invalidates IAM cache the
// same way it does for region-scoped services.

export async function listRolePolicies(env: string, region: string, roleName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:IAM`,
    `aws:${env}:${region}:IAM:${roleName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'IAM',
      command: 'ListRolePolicies',
      options: { RoleName: roleName },
      allPages: true,
    }),
  );
}

export async function listAttachedRolePolicies(env: string, region: string, roleName: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:IAM`,
    `aws:${env}:${region}:IAM:${roleName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'IAM',
      command: 'ListAttachedRolePolicies',
      options: { RoleName: roleName },
      allPages: true,
    }),
  );
}

export async function getRolePolicy(
  env: string,
  region: string,
  roleName: string,
  policyName: string,
) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(
    `aws:${env}:${region}`,
    `aws:${env}:${region}:IAM`,
    `aws:${env}:${region}:IAM:${roleName}`,
  );
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'IAM',
      command: 'GetRolePolicy',
      options: { RoleName: roleName, PolicyName: policyName },
    }),
  );
}

export async function getPolicy(env: string, region: string, policyArn: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:IAM`);
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'IAM',
      command: 'GetPolicy',
      options: { PolicyArn: policyArn },
    }),
  );
}

export async function getPolicyVersion(
  env: string,
  region: string,
  policyArn: string,
  versionId: string,
) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:IAM`);
  return nullIfAwsNotFound(
    runAwsCommand({
      env,
      region,
      service: 'IAM',
      command: 'GetPolicyVersion',
      options: { PolicyArn: policyArn, VersionId: versionId },
    }),
  );
}
