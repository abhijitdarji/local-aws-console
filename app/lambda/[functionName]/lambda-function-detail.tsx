'use client';

import {
  Box,
  Container,
  ExpandableSection,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { Suspense, use } from 'react';
import { CopyText } from '@/app/components/copy-text';
import { FileSize } from '@/app/components/file-size';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { KeyValueTable } from '@/app/components/key-value-table';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { ViewRolePolicy } from '@/app/components/view-role-policy';
import { DateUtils } from '@/app/lib/dates';
import { LambdaRuntimeIcon } from './lambda-runtime-icon';

type Props = {
  functionName: string;
  region: string;
  detailsPromise: Promise<any>;
  onRefresh: () => Promise<void>;
};

function PackageIcon({ packageType }: { packageType?: string }) {
  if (!packageType) return <>—</>;
  const isZip = packageType.toLowerCase() === 'zip';
  const src = isZip ? '/zip.svg' : '/container-image.svg';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img src={src} alt={packageType} height={24} width={24} />
      <span>{packageType}</span>
    </div>
  );
}

export function LambdaFunctionDetail({ functionName, region, detailsPromise, onRefresh }: Props) {
  const awsUrl = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${functionName}?tab=code`;

  // We `use()` the promise so we can read the ARN at this level and pass it
  // into ResourceDetailPage's `copyArn` prop (which renders inside the page
  // header, OUTSIDE the children render-prop). That requires a Suspense
  // boundary above this consumer.
  return (
    <Suspense fallback={<LoadingErrorEmptyHandler isLoading />}>
      <LambdaDetailWithArn
        functionName={functionName}
        awsUrl={awsUrl}
        detailsPromise={detailsPromise}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
}

function LambdaDetailWithArn({
  functionName,
  awsUrl,
  detailsPromise,
  onRefresh,
}: {
  functionName: string;
  awsUrl: string;
  detailsPromise: Promise<any>;
  onRefresh: () => Promise<void>;
}) {
  const data = use(detailsPromise);
  const fn = data?.Configuration ?? {};
  const code = data?.Code ?? {};
  const tags = data?.Tags ?? {};
  const isImage = fn.PackageType === 'Image';

  // Hand the already-resolved data to ResourceDetailPage so its inner
  // `use(detailsPromise)` resolves synchronously and doesn't re-suspend.
  const resolvedPromise = Promise.resolve(data);

  return (
    <ResourceDetailPage
      title={functionName}
      detailsPromise={resolvedPromise}
      awsConsoleUrl={awsUrl}
      onRefresh={onRefresh}
      copyArn={fn.FunctionArn}
    >
      {() => (
        <>
          <KeyValueGrid
            fields={[
              {
                label: 'Runtime',
                value: fn.Runtime ? (
                  <LambdaRuntimeIcon runtime={fn.Runtime} />
                ) : isImage ? (
                  'Container Image'
                ) : (
                  '—'
                ),
              },
              { label: 'Handler', value: fn.Handler || (isImage ? '—' : undefined) },
              { label: 'Memory', value: fn.MemorySize ? `${fn.MemorySize} MB` : '—' },
              { label: 'Timeout', value: fn.Timeout ? `${fn.Timeout}s` : '—' },
              ...(isImage
                ? [{ label: 'Image URI', value: code.ImageUri ?? code.ResolvedImageUri }]
                : []),
            ]}
          />
          <KeyValueGrid
            fields={[
              { label: 'Last Modified', value: DateUtils.formatDateAgo(fn.LastModified) },
              {
                label: 'ARN',
                value: fn.FunctionArn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Box variant="span" fontSize="body-s">
                      {fn.FunctionArn}
                    </Box>
                    <CopyText copyText={fn.FunctionArn} iconOnly />
                  </div>
                ) : (
                  '—'
                ),
              },
              { label: 'Code Size', value: <FileSize bytes={fn.CodeSize} /> },
              { label: 'Package', value: <PackageIcon packageType={fn.PackageType} /> },
              { label: 'Architectures', value: fn.Architectures?.join(', ') },
            ]}
          />
          <Container header={<Header variant="h2">Role</Header>}>
            <SpaceBetween size="s">
              <Box>{fn.Role}</Box>
              {fn.Role && (
                <ExpandableSection headerText="View role policy">
                  <ViewRolePolicy roleName={String(fn.Role).split('/').pop() ?? ''} />
                </ExpandableSection>
              )}
            </SpaceBetween>
          </Container>
          {fn.Environment?.Variables && Object.keys(fn.Environment.Variables).length > 0 && (
            <KeyValueTable
              headerText="Environment Variables"
              keyValueObject={fn.Environment.Variables}
            />
          )}
          {tags && Object.keys(tags).length > 0 && (
            <ExpandableSection headerText="Tags" variant="container">
              <KeyValueTable
                headerText={`Tags (${Object.keys(tags).length})`}
                keyValueObject={tags}
                variant="borderless"
              />
            </ExpandableSection>
          )}
        </>
      )}
    </ResourceDetailPage>
  );
}
