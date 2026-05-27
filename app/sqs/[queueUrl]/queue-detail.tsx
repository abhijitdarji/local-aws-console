'use client';

import { Box, ColumnLayout, Container, SpaceBetween, Tabs } from '@cloudscape-design/components';
import Link from 'next/link';
import { Suspense, use } from 'react';
import { CopyText } from '@/app/components/copy-text';
import { FileSize } from '@/app/components/file-size';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { LambdaTriggers } from '@/app/components/lambda-triggers';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { SnsSubscriptions } from '@/app/components/sns-subscriptions';
import { ViewCode } from '@/app/components/view-code';
import { DateUtils } from '@/app/lib/dates';

type Props = {
  queueName: string;
  queueUrl: string;
  region: string;
  detailsPromise: Promise<any>;
  onRefresh: () => Promise<void>;
};

// Convert a DLQ target ARN (arn:aws:sqs:region:account:queueName) back into
// the canonical SQS queue URL so we can deep-link into our own /sqs/[queueUrl]
// route. Falls back to null if the ARN looks malformed.
function dlqArnToQueueUrl(arn: string | undefined): string | null {
  if (!arn) return null;
  const parts = arn.split(':');
  if (parts.length !== 6 || parts[0] !== 'arn') return null;
  const [, , , region, account, name] = parts;
  return `https://sqs.${region}.amazonaws.com/${account}/${name}`;
}

export function QueueDetail({ queueName, queueUrl, region, detailsPromise, onRefresh }: Props) {
  const awsConsoleUrl = `https://${region}.console.aws.amazon.com/sqs/v3/home?region=${region}#/queues/${encodeURIComponent(queueUrl)}`;
  return (
    <Suspense fallback={<LoadingErrorEmptyHandler isLoading />}>
      <QueueDetailBody
        queueName={queueName}
        queueUrl={queueUrl}
        awsConsoleUrl={awsConsoleUrl}
        detailsPromise={detailsPromise}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
}

function QueueDetailBody({
  queueName,
  queueUrl,
  awsConsoleUrl,
  detailsPromise,
  onRefresh,
}: {
  queueName: string;
  queueUrl: string;
  awsConsoleUrl: string;
  detailsPromise: Promise<any>;
  onRefresh: () => Promise<void>;
}) {
  const data = use(detailsPromise);
  const attrs = (data?.Attributes ?? {}) as Record<string, string>;

  const isFifo = attrs.FifoQueue === 'true' || queueName.endsWith('.fifo');
  const queueArn = attrs.QueueArn ?? '';

  let policyPretty = '';
  try {
    if (attrs.Policy) policyPretty = JSON.stringify(JSON.parse(attrs.Policy), null, 2);
  } catch {
    policyPretty = attrs.Policy ?? '';
  }

  let redrive: { deadLetterTargetArn?: string; maxReceiveCount?: number } | null = null;
  if (attrs.RedrivePolicy) {
    try {
      redrive = JSON.parse(attrs.RedrivePolicy);
    } catch {
      redrive = null;
    }
  }
  const dlqUrl = dlqArnToQueueUrl(redrive?.deadLetterTargetArn);
  const dlqName = redrive?.deadLetterTargetArn?.split(':').pop();

  const created = attrs.CreatedTimestamp
    ? DateUtils.fomatTimestamp(Number(attrs.CreatedTimestamp) * 1000)
    : '—';
  const updated = attrs.LastModifiedTimestamp
    ? DateUtils.fomatTimestamp(Number(attrs.LastModifiedTimestamp) * 1000)
    : '—';

  const resolved = Promise.resolve(data);

  const tabs = [
    {
      label: 'Lambda Triggers',
      id: 'triggers',
      content: queueArn ? <LambdaTriggers eventSourceArn={queueArn} /> : <Box>—</Box>,
    },
    {
      label: 'SNS Subscriptions',
      id: 'sns',
      content: queueArn ? <SnsSubscriptions endpoint={queueArn} /> : <Box>—</Box>,
    },
    {
      label: 'Access Policy',
      id: 'policy',
      content: policyPretty ? (
        <ViewCode code={policyPretty} language="json" height="400px" />
      ) : (
        <Box color="text-status-inactive" padding="m">
          No access policy.
        </Box>
      ),
    },
  ];

  return (
    <ResourceDetailPage
      title={queueName}
      detailsPromise={resolved}
      awsConsoleUrl={awsConsoleUrl}
      onRefresh={onRefresh}
      copyArn={queueArn || undefined}
      tabs={tabs}
    >
      {() => (
        <>
          <Container>
            <SpaceBetween size="l" direction="horizontal">
              <Box variant="awsui-key-label">Type: {isFifo ? 'FIFO' : 'Standard'}</Box>
              <Box variant="awsui-key-label">Created: {created}</Box>
              <Box variant="awsui-key-label">Last Updated: {updated}</Box>
            </SpaceBetween>
          </Container>

          <KeyValueGrid
            fields={[
              {
                label: 'URL',
                value: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Box variant="span" fontSize="body-s">
                      {queueUrl}
                    </Box>
                    <CopyText copyText={queueUrl} iconOnly />
                  </div>
                ),
              },
              {
                label: 'ARN',
                value: queueArn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Box variant="span" fontSize="body-s">
                      {queueArn}
                    </Box>
                    <CopyText copyText={queueArn} iconOnly />
                  </div>
                ) : (
                  '—'
                ),
              },
              {
                label: 'Encryption',
                value: attrs.KmsMasterKeyId ? attrs.KmsMasterKeyId : 'None',
              },
              {
                label: 'Dead-letter queue',
                value: redrive ? (
                  <SpaceBetween size="xxs">
                    <Box>
                      Enabled{' '}
                      {dlqUrl ? (
                        <Link href={`/sqs/${encodeURIComponent(dlqUrl)}`}>{dlqName ?? 'View'}</Link>
                      ) : (
                        dlqName
                      )}
                    </Box>
                    <Box variant="awsui-key-label">Max receive count</Box>
                    <Box>{redrive.maxReceiveCount ?? '—'}</Box>
                  </SpaceBetween>
                ) : (
                  'Disabled'
                ),
              },
            ]}
          />

          <KeyValueGrid
            fields={[
              {
                label: 'Default visibility timeout',
                value: attrs.VisibilityTimeout
                  ? DateUtils.formatDateAsWords(Number(attrs.VisibilityTimeout))
                  : '—',
              },
              {
                label: 'Message retention period',
                value: attrs.MessageRetentionPeriod
                  ? DateUtils.formatDateAsWords(Number(attrs.MessageRetentionPeriod))
                  : '—',
              },
              {
                label: 'Delivery delay',
                value:
                  attrs.DelaySeconds && Number(attrs.DelaySeconds) > 0
                    ? DateUtils.formatDateAsWords(Number(attrs.DelaySeconds))
                    : '0s',
              },
              {
                label: 'Receive message wait time',
                value:
                  attrs.ReceiveMessageWaitTimeSeconds &&
                  Number(attrs.ReceiveMessageWaitTimeSeconds) > 0
                    ? DateUtils.formatDateAsWords(Number(attrs.ReceiveMessageWaitTimeSeconds))
                    : '0s',
              },
            ]}
          />

          <KeyValueGrid
            fields={[
              {
                label: 'Maximum message size',
                value: attrs.MaximumMessageSize ? (
                  <FileSize bytes={Number(attrs.MaximumMessageSize)} />
                ) : (
                  '—'
                ),
              },
              {
                label: 'Messages available',
                value: attrs.ApproximateNumberOfMessages ?? '—',
              },
              {
                label: 'Messages delayed',
                value: attrs.ApproximateNumberOfMessagesDelayed ?? '—',
              },
              {
                label: 'Messages in flight',
                value: attrs.ApproximateNumberOfMessagesNotVisible ?? '—',
              },
            ]}
          />

          {isFifo && (
            <Container>
              <ColumnLayout columns={4} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">FIFO throughput limit</Box>
                  <div>{attrs.FifoThroughputLimit ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Deduplication scope</Box>
                  <div>{attrs.DeduplicationScope ?? '—'}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Content-based deduplication</Box>
                  <div>{attrs.ContentBasedDeduplication ?? '—'}</div>
                </div>
              </ColumnLayout>
            </Container>
          )}
        </>
      )}
    </ResourceDetailPage>
  );
}
