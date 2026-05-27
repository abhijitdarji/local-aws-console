'use client';

import { Button, ContentLayout, Header, SpaceBetween } from '@cloudscape-design/components';
import { AppTable, type ColumnDefinitionType } from './app-table';
import { FavoriteButton } from './favorite-button';
import { LoadingErrorEmptyHandler } from './loading-error-empty-handler';
import { RefreshButton } from './refresh-button';

type Props<T> = {
  title: string;
  resourceName: string;
  awsConsoleUrl: string;
  columns: ColumnDefinitionType[];
  items: T[];
  loading: boolean;
  error?: string | null;
  lastFetched?: number | null;
  onRefresh: () => void;
};

export function ResourceListPage<T>(props: Props<T>) {
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <FavoriteButton name={props.title} />
              <RefreshButton onClick={props.onRefresh} lastFetched={props.lastFetched} />
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
      <LoadingErrorEmptyHandler
        isLoading={props.loading}
        isError={!!props.error}
        errorMessage={props.error ?? ''}
        dataLength={(props.items as unknown[]).length}
      >
        <AppTable
          resourceName={props.resourceName}
          columnDef={props.columns}
          items={props.items as any[]}
          pageSize={20}
        />
      </LoadingErrorEmptyHandler>
    </ContentLayout>
  );
}
