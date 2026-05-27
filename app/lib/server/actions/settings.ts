'use server';

import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-providers';
import ConfigParser from 'configparser';
import { cacheLife, cacheTag } from 'next/cache';
import * as os from 'os';
import { log } from '../logger';

export type Region = { code: string; name: string };
export type Environments = { sso: string[]; key: string[] };
export type LocalCred = { name: string; creds: Record<string, string> };

function parseAwsConfig(): { environments: Environments; localCreds: LocalCred[] } {
  const awsDir = `${os.homedir()}/.aws`;
  const configParser = new ConfigParser();
  const credentialsParser = new ConfigParser();

  try {
    configParser.read(`${awsDir}/config`);
  } catch {
    // Use console.warn — pino calls Date.now() which is banned during prerendering
    console.warn('[settings] Could not read ~/.aws/config');
  }

  try {
    credentialsParser.read(`${awsDir}/credentials`);
  } catch {
    console.warn('[settings] Could not read ~/.aws/credentials');
  }

  const awsConfig = configParser.sections() as string[];
  const credentials = credentialsParser.sections() as string[];

  const ssoCreds = awsConfig.filter((section: string) => {
    const keys = Object.keys(configParser.items(section) as Record<string, string>);
    return keys.includes('sso_account_id');
  });

  const keyCreds = awsConfig
    .filter((section: string) => {
      const keys = Object.keys(configParser.items(section) as Record<string, string>);
      return (
        (keys.includes('aws_access_key_id') && keys.includes('aws_secret_access_key')) ||
        (keys.includes('role_arn') && keys.includes('source_profile'))
      );
    })
    .concat(
      credentials.filter((section: string) => {
        const keys = Object.keys(credentialsParser.items(section) as Record<string, string>);
        return (
          (keys.includes('aws_access_key_id') && keys.includes('aws_secret_access_key')) ||
          (keys.includes('role_arn') && keys.includes('source_profile'))
        );
      }),
    );

  const localProfiles = awsConfig.filter((section: string) =>
    section.replace('profile', '').trim().startsWith('local'),
  );

  const localCreds: LocalCred[] =
    localProfiles.length > 0
      ? localProfiles.map((l: string) => ({
          name: l.replace('profile ', ''),
          creds: configParser.items(l) as Record<string, string>,
        }))
      : [];

  const environments: Environments = {
    sso: ssoCreds.map((s: string) => s.replace('profile ', '')).sort(),
    key: keyCreds.map((s: string) => s.replace('profile ', '')).sort(),
  };

  return { environments, localCreds };
}

export async function listEnvironments(): Promise<Environments> {
  // No 'use cache' — AWS config is a runtime-mounted volume; caching during
  // Docker build would capture empty results before ~/.aws is available.
  const { environments } = parseAwsConfig();
  return environments;
}

export async function listRegions(): Promise<Region[]> {
  'use cache';
  cacheLife({ stale: 0, revalidate: 3600, expire: 86400 });
  cacheTag('settings:regions');

  const { default: config } = await import('config');
  return config.get<Region[]>('ENABLED_REGIONS');
}

export async function validateEnvironment(
  name: string,
): Promise<{ Account?: string; UserId?: string; Arn?: string } | null> {
  const { environments } = parseAwsConfig();
  const allEnvs = [...environments.sso, ...environments.key];

  if (!allEnvs.includes(name)) {
    throw new Error(`Environment "${name}" does not exist`);
  }

  try {
    const client = new STSClient({
      region: 'us-east-1',
      credentials: fromIni({ profile: name }),
    });
    const response = await client.send(new GetCallerIdentityCommand({}));
    return {
      Account: response.Account,
      UserId: response.UserId,
      Arn: response.Arn,
    };
  } catch (err) {
    log.error({ profile: name, err }, 'settings.validate.error');
    throw err;
  }
}

export async function getLocalCreds(): Promise<LocalCred[]> {
  const { localCreds } = parseAwsConfig();
  return localCreds;
}
