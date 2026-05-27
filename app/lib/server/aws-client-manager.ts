import { fromIni, fromSSO } from '@aws-sdk/credential-providers';
import { LRUCache } from 'lru-cache';
import { log } from './logger';

const SERVICE_LIBS: Record<string, string> = {
  CloudFormation: '@aws-sdk/client-cloudformation',
  CloudWatchLogs: '@aws-sdk/client-cloudwatch-logs',
  DynamoDB: '@aws-sdk/client-dynamodb',
  ECR: '@aws-sdk/client-ecr',
  ECRPUBLIC: '@aws-sdk/client-ecr-public',
  IAM: '@aws-sdk/client-iam',
  Lambda: '@aws-sdk/client-lambda',
  S3: '@aws-sdk/client-s3',
  SecretsManager: '@aws-sdk/client-secrets-manager',
  SNS: '@aws-sdk/client-sns',
  SQS: '@aws-sdk/client-sqs',
  STS: '@aws-sdk/client-sts',
};

type AnyClient = { destroy?: () => void; send: (cmd: unknown) => Promise<unknown> };

// One cache process-wide: bounded LRU + 10-minute TTL
const clientCache = new LRUCache<string, AnyClient>({
  max: 20,
  ttl: 10 * 60_000,
  updateAgeOnGet: true,
  dispose: (client) => {
    try {
      client.destroy?.();
    } catch {
      // ignore disposal errors
    }
  },
});

export function getServiceLibs() {
  return SERVICE_LIBS;
}

/**
 * When running inside Docker, `localhost` / `127.0.0.1` in an endpoint URL
 * resolves to the container itself rather than the host machine. If the
 * LOCALSTACK_HOST env var is set (e.g. "host.docker.internal"), any localhost
 * address in the URL is replaced so traffic reaches the host.
 */
function resolveLocalEndpoint(url: string): string {
  const host = process.env.LOCALSTACK_HOST;
  if (!host) return url;
  return url.replace(/\blocalhost\b|127\.0\.0\.1/, host);
}

export async function getAwsClient(
  service: string,
  profile: string,
  profileType: 'sso' | 'key',
  region: string,
  endpointUrl?: string,
): Promise<AnyClient> {
  const key = `${service}|${profile}|${region}`;
  const hit = clientCache.get(key);
  if (hit) return hit;

  const libPath = SERVICE_LIBS[service];
  if (!libPath) throw new Error(`Unsupported service: ${service}`);

  const mod = await import(libPath);
  const credentials = profileType === 'sso' ? fromSSO({ profile }) : fromIni({ profile });

  const clientOptions: Record<string, unknown> = {
    region,
    credentials,
  };

  if (endpointUrl || profile.startsWith('local')) {
    clientOptions.endpoint = resolveLocalEndpoint(endpointUrl ?? 'http://localhost:4566');
  }

  const ClientClass = mod[`${service}Client`];
  if (!ClientClass) throw new Error(`SDK client class not found for service: ${service}`);

  const client = new ClientClass(clientOptions) as AnyClient;
  clientCache.set(key, client);

  log.debug({ service, profile, region }, 'aws.client.created');
  return client;
}

export async function runSdkCommand(
  service: string,
  profile: string,
  profileType: 'sso' | 'key',
  region: string,
  commandName: string,
  options: Record<string, unknown>,
  allPages = false,
  endpointUrl?: string,
): Promise<Record<string, unknown>> {
  const mod = await import(SERVICE_LIBS[service]);
  const client = await getAwsClient(service, profile, profileType, region, endpointUrl);

  const commandStr =
    commandName.indexOf('Command') > 0
      ? commandName.substring(0, commandName.indexOf('Command'))
      : commandName;
  const commandClass = `${commandStr}Command`;
  const paginateCommand = `paginate${commandStr}`;

  if (!mod[commandClass]) throw new Error(`Unsupported command: ${commandName}`);

  const start = Date.now();
  try {
    if (allPages) {
      if (!mod[paginateCommand])
        throw new Error(`Command ${commandName} does not support pagination`);

      const paginator = mod[paginateCommand];
      const result: Record<string, unknown[]> = {};
      for await (const page of paginator({ client }, options)) {
        const arrayKey = Object.keys(page).find((k) => Array.isArray(page[k]));
        if (!arrayKey) continue;
        if (!result[arrayKey]) result[arrayKey] = [];
        if ((page[arrayKey] as unknown[]).length === 0) continue;
        (result[arrayKey] as unknown[]).push(...(page[arrayKey] as unknown[]));
      }
      log.info({ service, command: commandName, ms: Date.now() - start }, 'aws.call.ok');
      return result;
    }

    const cmd = new mod[commandClass](options);
    const data = (await client.send(cmd)) as Record<string, unknown>;
    log.info({ service, command: commandName, ms: Date.now() - start }, 'aws.call.ok');
    return data;
  } catch (error) {
    log.error(
      { service, command: commandName, ms: Date.now() - start, err: error },
      'aws.call.error',
    );
    throw error;
  }
}
