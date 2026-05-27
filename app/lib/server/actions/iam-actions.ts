'use server';

import { getRolePolicy, listAttachedRolePolicies, listRolePolicies } from '../aws/iam';
import type { AwsActionResult } from '../aws-result';

// Thin Server Action wrappers around the `'use cache'` IAM fetchers so
// Client Components (e.g. ViewRolePolicy) can request the data. Errors are
// returned as a serializable envelope so the original AWS error message
// survives Next.js production redaction.

function ok(data: unknown): AwsActionResult {
  return { ok: true, data: (data ?? {}) as Record<string, unknown> };
}

function err(e: unknown): AwsActionResult {
  const message = e instanceof Error ? e.message : String(e);
  const name = e instanceof Error ? e.name : 'Error';
  return { ok: false, error: { message, name } };
}

export async function listRolePoliciesAction(
  env: string,
  region: string,
  roleName: string,
): Promise<AwsActionResult> {
  try {
    return ok(await listRolePolicies(env, region, roleName));
  } catch (e) {
    return err(e);
  }
}

export async function listAttachedRolePoliciesAction(
  env: string,
  region: string,
  roleName: string,
): Promise<AwsActionResult> {
  try {
    return ok(await listAttachedRolePolicies(env, region, roleName));
  } catch (e) {
    return err(e);
  }
}

export async function getRolePolicyAction(
  env: string,
  region: string,
  roleName: string,
  policyName: string,
): Promise<AwsActionResult> {
  try {
    return ok(await getRolePolicy(env, region, roleName, policyName));
  } catch (e) {
    return err(e);
  }
}
