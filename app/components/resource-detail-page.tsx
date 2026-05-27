'use client';

import {
  Button,
  ContentLayout,
  Header,
  SpaceBetween,
  Tabs,
  type TabsProps,
} from '@cloudscape-design/components';
import { type ReactNode, Suspense, use } from 'react';
import { CopyText } from './copy-text';
import { FavoriteButton } from './favorite-button';
import { LoadingErrorEmptyHandler } from './loading-error-empty-handler';
import { RefreshButton } from './refresh-button';

type Props<T> = {
  title: string;
  detailsPromise: Promise<T>;
  awsConsoleUrl: string;
  copyArn?: string;
  onRefresh: () => Promise<void> | void;
  extraActions?: ReactNode;
  children: (details: T) => ReactNode;
  tabs?: TabsProps['tabs'];
};

export function ResourceDetailPage<T>(props: Props<T>) {
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {props.extraActions}
              <FavoriteButton name={props.title} />
              <RefreshButton onClick={props.onRefresh} />
              {props.copyArn && <CopyText copyText={props.copyArn} buttonText="Copy ARN" />}
              <Button
                href={props.awsConsoleUrl}
                iconAlign="right"
                iconName="external"
                target="_blank"
              >
                View on AWS
              </Button>
            </SpaceBetween>
          }
        >
          {props.title}
        </Header>
      }
    >
      <Suspense fallback={<LoadingErrorEmptyHandler isLoading />}>
        <DetailBody {...props} />
      </Suspense>
    </ContentLayout>
  );
}

function DetailBody<T>({ detailsPromise, children, tabs }: Props<T>) {
  const details = use(detailsPromise);
  const content = children(details);

  if (!tabs) {
    return <SpaceBetween size="l">{content}</SpaceBetween>;
  }

  return (
    <SpaceBetween size="l">
      {content}
      <Tabs tabs={tabs} />
    </SpaceBetween>
  );
}
