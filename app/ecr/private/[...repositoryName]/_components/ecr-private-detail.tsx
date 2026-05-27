'use client';

import {
  Badge,
  Box,
  Container,
  ExpandableSection,
  Header,
  SpaceBetween,
  StatusIndicator,
  Table,
} from '@cloudscape-design/components';
import { Suspense, use } from 'react';
import { FileSize } from '@/app/components/file-size';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { KeyValueTable } from '@/app/components/key-value-table';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { DateUtils } from '@/app/lib/dates';

type Props = {
  repositoryName: string;
  region: string;
  detailsPromise: Promise<[any, any, any]>;
  onRefresh: () => Promise<void>;
};

function ImageSizeCell({ bytes }: { bytes?: number }) {
  if (!bytes) return <>—</>;
  return <FileSize bytes={bytes} />;
}

function formatTags(tags?: { Key: string; Value: string }[]) {
  if (!tags?.length) return null;
  const obj: Record<string, string> = {};
  for (const t of tags) obj[t.Key] = t.Value;
  return obj;
}

function ScanStatus({ status }: { status?: string }) {
  if (!status) return <>—</>;
  const map: Record<string, 'success' | 'error' | 'in-progress' | 'pending'> = {
    COMPLETE: 'success',
    FAILED: 'error',
    IN_PROGRESS: 'in-progress',
    UNSUPPORTED_IMAGE: 'pending',
  };
  return <StatusIndicator type={map[status] ?? 'pending'}>{status}</StatusIndicator>;
}

export function EcrPrivateDetail({ repositoryName, region, detailsPromise, onRefresh }: Props) {
  const awsUrl = `https://${region}.console.aws.amazon.com/ecr/repositories/private/${repositoryName}?region=${region}`;

  return (
    <ResourceDetailPage
      title={repositoryName}
      detailsPromise={detailsPromise}
      awsConsoleUrl={awsUrl}
      onRefresh={onRefresh}
    >
      {([repoResult, imagesResult, policyResult]: [any, any, any]) => {
        const repo = (repoResult?.repositories ?? [])[0] ?? {};
        const images: any[] = imagesResult?.imageDetails ?? [];
        const policyText = policyResult?.policyText ?? null;
        const tags = formatTags(repo.tags);

        const sortedImages = [...images].sort((a, b) => {
          const ta = a.imagePushedAt ? new Date(a.imagePushedAt).getTime() : 0;
          const tb = b.imagePushedAt ? new Date(b.imagePushedAt).getTime() : 0;
          return tb - ta;
        });

        return (
          <>
            <KeyValueGrid
              fields={[
                { label: 'Repository URI', value: repo.repositoryUri },
                { label: 'Registry ID', value: repo.registryId },
                {
                  label: 'Tag Mutability',
                  value:
                    repo.imageTagMutability === 'IMMUTABLE' ? (
                      <Badge color="red">IMMUTABLE</Badge>
                    ) : (
                      <Badge color="blue">MUTABLE</Badge>
                    ),
                },
                {
                  label: 'Scan on Push',
                  value: repo.imageScanningConfiguration?.scanOnPush ? (
                    <StatusIndicator type="success">Enabled</StatusIndicator>
                  ) : (
                    <StatusIndicator type="stopped">Disabled</StatusIndicator>
                  ),
                },
                {
                  label: 'Encryption',
                  value: repo.encryptionConfiguration?.encryptionType ?? '—',
                },
                {
                  label: 'Created',
                  value: repo.createdAt
                    ? (DateUtils.formatDate(new Date(repo.createdAt)) ?? '—')
                    : '—',
                },
              ]}
            />

            <Container header={<Header variant="h2">Images ({images.length})</Header>}>
              <LoadingErrorEmptyHandler
                isLoading={false}
                isError={false}
                errorMessage=""
                dataLength={sortedImages.length}
              >
                <Table
                  items={sortedImages}
                  columnDefinitions={[
                    {
                      id: 'tags',
                      header: 'Tags',
                      cell: (img: any) =>
                        img.imageTags?.length ? (
                          img.imageTags.map((t: string) => (
                            <Badge key={t} color="blue">
                              {t}
                            </Badge>
                          ))
                        ) : (
                          <Box color="text-body-secondary">untagged</Box>
                        ),
                    },
                    {
                      id: 'digest',
                      header: 'Digest',
                      cell: (img: any) => (
                        <Box fontSize="body-s" fontWeight="normal">
                          {img.imageDigest?.slice(0, 19)}…
                        </Box>
                      ),
                    },
                    {
                      id: 'pushedAt',
                      header: 'Pushed',
                      cell: (img: any) =>
                        img.imagePushedAt
                          ? (DateUtils.formatDateAgo(new Date(img.imagePushedAt)) ?? '—')
                          : '—',
                    },
                    {
                      id: 'size',
                      header: 'Size',
                      cell: (img: any) => <ImageSizeCell bytes={img.imageSizeInBytes} />,
                    },
                    {
                      id: 'scanStatus',
                      header: 'Scan Status',
                      cell: (img: any) => <ScanStatus status={img.imageScanStatus?.status} />,
                    },
                    {
                      id: 'mediaType',
                      header: 'Media Type',
                      cell: (img: any) =>
                        img.artifactMediaType ?? img.imageManifestMediaType ?? '—',
                    },
                  ]}
                  stripedRows
                  stickyHeader
                  resizableColumns
                  empty={
                    <Box textAlign="center" color="text-body-secondary">
                      No images found
                    </Box>
                  }
                />
              </LoadingErrorEmptyHandler>
            </Container>

            {policyText && (
              <ExpandableSection headerText="Repository Policy" variant="container">
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                >
                  {JSON.stringify(JSON.parse(policyText), null, 2)}
                </pre>
              </ExpandableSection>
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
        );
      }}
    </ResourceDetailPage>
  );
}
