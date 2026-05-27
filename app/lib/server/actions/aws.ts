'use server';

import { runSdkCommand } from '../aws-client-manager';
import type { AwsActionResult } from '../aws-result';
import { log } from '../logger';
import { RunAwsCommandInput } from '../schemas';
import { getLocalCreds, listEnvironments } from './settings';

type Environments = { sso: string[]; key: string[] };

async function resolveProfileType(
  env: string,
): Promise<{ profileType: 'sso' | 'key'; endpointUrl?: string }> {
  const environments = (await listEnvironments()) as Environments;
  if (environments.sso.includes(env)) return { profileType: 'sso' };
  if (environments.key.includes(env)) return { profileType: 'key' };

  // Check local profiles
  const localCreds = await getLocalCreds();
  const localCred = localCreds.find((c) => c.name === env);
  if (localCred) {
    return {
      profileType: 'key',
      endpointUrl: localCred.creds['endpoint_url'] ?? 'http://localhost:4566',
    };
  }

  throw new Error(`Unknown environment: ${env}`);
}

export async function runAwsCommand(input: unknown): Promise<Record<string, unknown>> {
  const parsed = RunAwsCommandInput.parse(input);
  const { env, region, service, command, options, allPages } = parsed;

  const { profileType, endpointUrl } = await resolveProfileType(env);

  log.debug({ env, region, service, command }, 'aws.action.start');

  return runSdkCommand(service, env, profileType, region, command, options, allPages, endpointUrl);
}

// Same call as `runAwsCommand` but returns errors as a serializable envelope
// instead of throwing. Use this from any Client Component / browser caller so
// the real AWS error message survives Next.js production error redaction.
export async function runAwsCommandSafe(input: unknown): Promise<AwsActionResult> {
  try {
    const data = await runAwsCommand(input);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const name = e instanceof Error ? e.name : 'Error';
    return { ok: false, error: { message, name } };
  }
}
