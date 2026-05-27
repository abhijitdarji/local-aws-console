'use client';

import { SpaceBetween } from '@cloudscape-design/components';
import { Suspense } from 'react';
import { CopyText } from '@/app/components/copy-text';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { Loading } from '@/app/components/loading';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { SecretValueDisplay } from './secret-value-display';

type Props = {
  secretId: string;
  region: string;
  detailsPromise: Promise<any>;
  valuePromise: Promise<any>;
  onRefresh: () => Promise<void>;
};

function withCopy(value: string | undefined) {
  if (!value) return '—';
  return (
    <SpaceBetween direction="horizontal" size="xxs">
      <span>{value}</span>
      <CopyText copyText={value} iconOnly />
    </SpaceBetween>
  );
}

export function SecretDetail({ secretId, region, detailsPromise, valuePromise, onRefresh }: Props) {
  return (
    <ResourceDetailPage
      title={secretId}
      detailsPromise={detailsPromise}
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/secretsmanager/secret?name=${encodeURIComponent(secretId)}&region=${region}`}
      onRefresh={onRefresh}
    >
      {(data: any) => (
        <>
          <KeyValueGrid
            fields={[
              { label: 'Name', value: withCopy(data.Name) },
              { label: 'ARN', value: withCopy(data.ARN) },
              { label: 'Description', value: data.Description },
              { label: 'KMS Key', value: withCopy(data.KmsKeyId) },
              {
                label: 'Last Changed',
                value: data.LastChangedDate ? new Date(data.LastChangedDate).toLocaleString() : '—',
              },
              {
                label: 'Last Accessed',
                value: data.LastAccessedDate
                  ? new Date(data.LastAccessedDate).toLocaleString()
                  : '—',
              },
            ]}
          />
          <Suspense fallback={<Loading />}>
            <SecretValueDisplay valuePromise={valuePromise} />
          </Suspense>
        </>
      )}
    </ResourceDetailPage>
  );
}
