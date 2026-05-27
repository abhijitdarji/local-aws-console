'use client';

import {
  Badge,
  Box,
  Container,
  ExpandableSection,
  Header,
  Link,
  SpaceBetween,
  StatusIndicator,
  Table,
} from '@cloudscape-design/components';
import { FileSize } from '@/app/components/file-size';
import { KeyValueGrid } from '@/app/components/key-value-grid';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ResourceDetailPage } from '@/app/components/resource-detail-page';
import { DateUtils } from '@/app/lib/dates';

type Props = {
  repositoryName: string;
  detailsPromise: Promise<[any, any, any]>;
  onRefresh: () => Promise<void>;
};

export function EcrPublicDetail({ repositoryName, detailsPromise, onRefresh }: Props) {
  const awsUrl = `https://gallery.ecr.aws/${repositoryName}`;

  return (
    <ResourceDetailPage
      title={repositoryName}
      detailsPromise={detailsPromise}
      awsConsoleUrl={awsUrl}
      onRefresh={onRefresh}
    >
      {([repoResult, imagesResult, catalogResult]: [any, any, any]) => {
        const repo = (repoResult?.repositories ?? [])[0] ?? {};
        const images: any[] = imagesResult?.imageDetails ?? [];
        const catalog = catalogResult?.catalogData ?? {};

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
                  label: 'Visibility',
                  value: <Badge color="green">PUBLIC</Badge>,
                },
                {
                  label: 'ECR Gallery',
                  value: (
                    <Link href={awsUrl} target="_blank" external>
                      {awsUrl}
                    </Link>
                  ),
                },
                {
                  label: 'Created',
                  value: repo.createdAt
                    ? (DateUtils.formatDate(new Date(repo.createdAt)) ?? '—')
                    : '—',
                },
              ]}
            />

            {(catalog.description || catalog.aboutText || catalog.usageText) && (
              <Container header={<Header variant="h2">Catalog Info</Header>}>
                <SpaceBetween size="s">
                  {catalog.description && (
                    <Box>
                      <strong>Description:</strong> {catalog.description}
                    </Box>
                  )}
                  {catalog.operatingSystems?.length > 0 && (
                    <Box>
                      <strong>OS:</strong>{' '}
                      {catalog.operatingSystems.map((os: string) => (
                        <Badge key={os} color="grey">
                          {os}
                        </Badge>
                      ))}
                    </Box>
                  )}
                  {catalog.architectures?.length > 0 && (
                    <Box>
                      <strong>Architectures:</strong>{' '}
                      {catalog.architectures.map((a: string) => (
                        <Badge key={a} color="blue">
                          {a}
                        </Badge>
                      ))}
                    </Box>
                  )}
                  {catalog.aboutText && (
                    <ExpandableSection headerText="About">
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {catalog.aboutText}
                      </pre>
                    </ExpandableSection>
                  )}
                  {catalog.usageText && (
                    <ExpandableSection headerText="Usage">
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {catalog.usageText}
                      </pre>
                    </ExpandableSection>
                  )}
                </SpaceBetween>
              </Container>
            )}

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
                        <Box fontSize="body-s">{img.imageDigest?.slice(0, 19)}…</Box>
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
                      cell: (img: any) =>
                        img.imageSizeInBytes ? <FileSize bytes={img.imageSizeInBytes} /> : '—',
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
          </>
        );
      }}
    </ResourceDetailPage>
  );
}
