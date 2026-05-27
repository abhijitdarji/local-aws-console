'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useResourceList } from '@/app/hooks/use-resource-list';
import { DateUtils } from '@/app/lib/dates';

// Map a CloudFormation resource (Type + PhysicalResourceId) onto the
// matching detail route in our own UI. Returns `null` if we don't have
// a viewer for that resource type — caller renders plain text.
function resourceHref(resourceType: string, physicalId: string): string | null {
  if (!physicalId) return null;
  switch (resourceType) {
    case 'AWS::Lambda::Function':
      return `/lambda/${encodeURIComponent(physicalId)}`;
    case 'AWS::DynamoDB::Table':
      return `/dynamodb/${encodeURIComponent(physicalId)}`;
    case 'AWS::SQS::Queue':
      // PhysicalResourceId is the full queue URL — already URL-safe segments.
      return `/sqs/${encodeURIComponent(physicalId)}`;
    case 'AWS::SNS::Topic':
      // PhysicalResourceId is the topic ARN.
      return `/sns/${encodeURIComponent(physicalId)}`;
    case 'AWS::S3::Bucket':
      return `/s3/${encodeURIComponent(physicalId)}`;
    case 'AWS::SecretsManager::Secret':
      return `/secretsmanager/${encodeURIComponent(physicalId)}`;
    case 'AWS::Logs::LogGroup':
      return `/cloudwatchlogs/${encodeURIComponent(physicalId)}`;
    case 'AWS::ECR::Repository':
      return `/ecr/private/${encodeURIComponent(physicalId)}`;
    default:
      return null;
  }
}

const columns: ColumnDefinitionType[] = [
  {
    id: 'LogicalResourceId',
    header: 'Logical ID',
    cell: (item: any) => item.LogicalResourceId,
    sortingField: 'LogicalResourceId',
    isRowHeader: true,
    visible: true,
    isKey: true,
  },
  {
    id: 'ResourceType',
    header: 'Type',
    cell: (item: any) => item.ResourceType,
    sortingField: 'ResourceType',
    visible: true,
  },
  {
    id: 'PhysicalResourceId',
    header: 'Physical ID',
    cell: (item: any) => {
      const href = resourceHref(item.ResourceType, item.PhysicalResourceId);
      if (!href) return item.PhysicalResourceId ?? '—';
      return <Link href={href}>{item.PhysicalResourceId}</Link>;
    },
    sortingField: 'PhysicalResourceId',
    visible: true,
  },
  {
    id: 'ResourceStatus',
    header: 'Status',
    cell: (item: any) =>
      item.ResourceStatus?.includes('COMPLETE')
        ? `✓ ${item.ResourceStatus}`
        : `✗ ${item.ResourceStatus ?? '—'}`,
    sortingField: 'ResourceStatus',
    visible: true,
  },
  {
    id: 'LastUpdatedTimestamp',
    header: 'Last Updated',
    cell: (item: any) =>
      item.LastUpdatedTimestamp
        ? DateUtils.fomatTimestamp(new Date(item.LastUpdatedTimestamp).getTime())
        : '—',
    sortingField: 'LastUpdatedTimestamp',
    visible: true,
  },
];

export default function StackResourcesPage() {
  const { stackId: encoded } = useParams<{ stackId: string }>();
  const decoded = decodeURIComponent(encoded);
  // ListStackResources accepts the stack name; for an ARN, use the last path
  // segment (matches main branch parsing).
  const stackName = decoded.includes(':')
    ? (decoded.split(':').pop()?.split('/')[1] ?? decoded)
    : decoded;

  const options = useMemo(() => ({ StackName: stackName }), [stackName]);

  const { items, loading, error, lastFetched, refresh, region } = useResourceList(
    'CloudFormation',
    'ListStackResources',
    'StackResourceSummaries',
    options,
  );

  return (
    <ResourceListPage
      title={`Stack: ${stackName}`}
      resourceName="Resource"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/stackinfo?stackId=${encodeURIComponent(decoded)}`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
