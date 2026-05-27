import { z } from 'zod';

export const SERVICES = z.enum([
  'APIGateway',
  'CloudFormation',
  'CloudWatchLogs',
  'Cognito',
  'DynamoDB',
  'ECR',
  'ECRPUBLIC',
  'ECS',
  'IAM',
  'Lambda',
  'S3',
  'SecretsManager',
  'SNS',
  'SQS',
  'STS',
]);

export const RunAwsCommandInput = z.object({
  env: z.string().min(1, 'Environment is required'),
  region: z.string().min(1, 'Region is required'),
  service: SERVICES,
  command: z.string().regex(/^[A-Z][A-Za-z0-9]+(Command)?$/, 'Invalid command format'),
  options: z.record(z.string(), z.unknown()).default({}),
  allPages: z.boolean().default(false),
});

export type RunAwsCommandInput = z.infer<typeof RunAwsCommandInput>;

export const SavedQueryInput = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  query: z.string().min(1, 'Query is required'),
  logGroups: z.string().default(''),
});

export type SavedQueryInput = z.infer<typeof SavedQueryInput>;

export const FavoriteInput = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  path: z.string().min(1, 'Path is required').max(500),
  environment: z.string().min(1, 'Environment is required'),
  region: z.string().min(1, 'Region is required'),
});

export type FavoriteInput = z.infer<typeof FavoriteInput>;

export const FavoriteUpdateInput = FavoriteInput.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided',
);

export type FavoriteUpdateInput = z.infer<typeof FavoriteUpdateInput>;
