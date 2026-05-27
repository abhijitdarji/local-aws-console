'use client';

import { Tabs } from '@cloudscape-design/components';
import { Suspense } from 'react';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { ViewCode } from '@/app/components/view-code';
import { SubscriptionsList } from './subscriptions-list';

type Props = {
  topicName: string;
  topicArn: string;
  region: string;
  detailsPromise: Promise<any>;
  subsPromise: Promise<any[]>;
  onRefresh: () => Promise<void>;
};

function prettyJson(raw: string | undefined): string {
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function TopicDetail({
  topicName,
  topicArn,
  region,
  detailsPromise,
  subsPromise,
  onRefresh,
}: Props) {
  return (
    <ResourceDetailPage
      title={topicName}
      detailsPromise={detailsPromise}
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/sns/v3/home?region=${region}#/topic/${topicArn}`}
      copyArn={topicArn}
      onRefresh={onRefresh}
    >
      {(data: any) => {
        const attrs = data.Attributes ?? {};
        const isFifo = topicArn.endsWith('.fifo');
        return (
          <>
            <KeyValueGrid
              fields={[
                { label: 'Type', value: isFifo ? 'FIFO' : 'Standard' },
                { label: 'Display Name', value: attrs.DisplayName },
                { label: 'Owner', value: attrs.Owner },
                { label: 'Subscriptions Confirmed', value: attrs.SubscriptionsConfirmed },
                { label: 'Subscriptions Pending', value: attrs.SubscriptionsPending },
                { label: 'Subscriptions Deleted', value: attrs.SubscriptionsDeleted },
                { label: 'Encryption (KMS Key)', value: attrs.KmsMasterKeyId ?? '—' },
                ...(isFifo
                  ? [
                      {
                        label: 'Content-based deduplication',
                        value: attrs.ContentBasedDeduplication ?? '—',
                      },
                      {
                        label: 'FIFO Throughput Scope',
                        value: attrs.FifoThroughputScope ?? '—',
                      },
                    ]
                  : []),
              ]}
            />
            <Tabs
              tabs={[
                {
                  id: 'subscriptions',
                  label: 'Subscriptions',
                  content: (
                    <Suspense fallback={<div>Loading subscriptions…</div>}>
                      <SubscriptionsList subsPromise={subsPromise} />
                    </Suspense>
                  ),
                },
                {
                  id: 'access-policy',
                  label: 'Access Policy',
                  content: (
                    <ViewCode
                      code={prettyJson(attrs.Policy) || '(none)'}
                      language="json"
                      height="400px"
                    />
                  ),
                },
                {
                  id: 'delivery-policy',
                  label: 'Delivery Policy',
                  content: (
                    <ViewCode
                      code={
                        prettyJson(attrs.DeliveryPolicy) ||
                        prettyJson(attrs.EffectiveDeliveryPolicy) ||
                        '(none)'
                      }
                      language="json"
                      height="400px"
                    />
                  ),
                },
              ]}
            />
          </>
        );
      }}
    </ResourceDetailPage>
  );
}
