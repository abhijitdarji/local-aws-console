'use client';

import {
  Badge,
  Button,
  ContentLayout,
  Header,
  SpaceBetween,
  Tabs,
} from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';
import { FavoriteButton } from '@/app/components/favorite-button';
import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { PrivateReposTable } from './private-repos-table';
import { PublicReposTable } from './public-repos-table';
import { TableSkeleton } from './table-skeleton';

type Props = {
  env: string;
  region: string;
  privateReposPromise: Promise<any>;
  publicReposPromise: Promise<any>;
};

export function EcrTabs({ env, region, privateReposPromise, publicReposPromise }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('private');
  const [refreshingPrivate, startPrivate] = useTransition();
  const [refreshingPublic, startPublic] = useTransition();

  const privateAwsUrl = `https://${region}.console.aws.amazon.com/ecr/private-registry/repositories?region=${region}`;

  const handleRefreshPrivate = () => {
    startPrivate(async () => {
      await revalidateAws(env, region, 'ECR');
      router.refresh();
    });
  };

  const handleRefreshPublic = () => {
    startPublic(async () => {
      await revalidateAws(env, 'us-east-1', 'ECRPUBLIC');
      router.refresh();
    });
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <FavoriteButton name="ECR Repositories" />
            </SpaceBetween>
          }
        >
          ECR Repositories
        </Header>
      }
    >
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={[
          {
            id: 'private',
            label: (
              <>
                Private <Badge color="blue">regional</Badge>
              </>
            ),
            content: (
              <SpaceBetween size="m">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      iconName="refresh"
                      loading={refreshingPrivate}
                      onClick={handleRefreshPrivate}
                    >
                      Refresh
                    </Button>
                    <Button
                      href={privateAwsUrl}
                      iconAlign="right"
                      iconName="external"
                      target="_blank"
                    >
                      View on AWS
                    </Button>
                  </SpaceBetween>
                </div>
                <Suspense fallback={<TableSkeleton />}>
                  <PrivateReposTable reposPromise={privateReposPromise} />
                </Suspense>
              </SpaceBetween>
            ),
          },
          {
            id: 'public',
            label: (
              <>
                Public <Badge color="green">us-east-1</Badge>
              </>
            ),
            content: (
              <SpaceBetween size="m">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      iconName="refresh"
                      loading={refreshingPublic}
                      onClick={handleRefreshPublic}
                    >
                      Refresh
                    </Button>
                    <Button
                      href="https://gallery.ecr.aws"
                      iconAlign="right"
                      iconName="external"
                      target="_blank"
                    >
                      ECR Gallery
                    </Button>
                  </SpaceBetween>
                </div>
                <Suspense fallback={<TableSkeleton />}>
                  <PublicReposTable reposPromise={publicReposPromise} />
                </Suspense>
              </SpaceBetween>
            ),
          },
        ]}
      />
    </ContentLayout>
  );
}
