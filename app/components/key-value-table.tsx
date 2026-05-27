'use client';

import { useCollection } from '@cloudscape-design/collection-hooks';
import {
  Box,
  Button,
  Header,
  Table,
  type TableProps,
  TextFilter,
} from '@cloudscape-design/components';

type KeyValueTableProps = {
  headerText: string;
  keyValueObject: Record<string, string> | null | undefined;
  variant?: TableProps.Variant;
};

export function KeyValueTable({ headerText, keyValueObject, variant }: KeyValueTableProps) {
  const keyValueArray = Object.entries(keyValueObject ?? {}).map(([key, value]) => ({
    key,
    value,
  }));

  const { items, collectionProps, filteredItemsCount, filterProps, actions } = useCollection(
    keyValueArray,
    {
      filtering: {
        noMatch: (
          <Box textAlign="center" color="inherit">
            <Box variant="strong">No matches</Box>
            <Button onClick={() => actions.setFiltering('')}>Clear filter</Button>
          </Box>
        ),
      },
      sorting: {},
    },
  );

  const COLUMNS = [
    {
      id: 'key',
      header: 'Key',
      cell: (item: { key: string }) => item.key,
      width: 300,
      isRowHeader: true,
      sortingField: 'key',
    },
    {
      id: 'value',
      header: 'Value',
      cell: (item: { value: string }) => item.value || '—',
      sortingField: 'value',
    },
  ];

  return (
    <Table
      columnDefinitions={COLUMNS}
      items={items}
      {...(variant ? { variant } : {})}
      {...collectionProps}
      filter={
        <TextFilter
          {...filterProps}
          filteringPlaceholder="Find"
          filteringAriaLabel="Filter"
          countText={filteredItemsCount === 1 ? '1 match' : `${filteredItemsCount} matches`}
        />
      }
      header={
        <Header variant="h2" counter={`(${keyValueArray.length})`}>
          {headerText}
        </Header>
      }
    />
  );
}
