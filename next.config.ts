import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  // Enables 'use cache' directive, cacheLife, cacheTag (Next 16 stable)
  cacheComponents: true,
  transpilePackages: [
    '@cloudscape-design/components',
    '@cloudscape-design/component-toolkit',
    '@cloudscape-design/collection-hooks',
    '@cloudscape-design/global-styles',
    '@cloudscape-design/design-tokens',
  ],
  turbopack: {
    rules: {
      '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
    },
  },
  serverExternalPackages: [
    '@aws-sdk/client-cloudformation',
    '@aws-sdk/client-cloudwatch-logs',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/client-lambda',
    '@aws-sdk/client-ecr',
    '@aws-sdk/client-ecr-public',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-sns',
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-sts',
    '@aws-sdk/credential-providers',
    'configparser',
    'pino',
    'pino-pretty',
  ],
};

export default config;
