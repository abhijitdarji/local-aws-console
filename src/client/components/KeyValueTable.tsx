
import { useCollection } from "@cloudscape-design/collection-hooks";
import { Box, Button, Header, Table, TableProps, TextFilter } from "@cloudscape-design/components";

type KeyValueTableProps = {
    headerText: string;
    keyValueObject: { [key: string]: string };
    variant?: TableProps.Variant;
}

export const KeyValueTable = ({ headerText, keyValueObject, variant }: KeyValueTableProps) => {

    const keyValueArray = Object.keys(keyValueObject).reduce((acc, key) => {
        acc.push({ key, value: keyValueObject[key] });
        return acc;
    }, [] as { key: string, value: string }[]);

    const { items, collectionProps, filteredItemsCount, filterProps, actions } = useCollection(keyValueArray, {
        filtering: {
            noMatch: (
                <Box textAlign="center" color="inherit">
                    <Box variant="strong" textAlign="center" color="inherit">
                        No matches
                    </Box>
                    <Box variant="p" padding={{ bottom: 's' }} color="inherit">
                        No tags matched the search text.
                    </Box>
                    <Button onClick={() => actions.setFiltering('')}>Clear filter</Button>
                </Box>
            ),
        },
        sorting: {},
    });

    const COLUMN_DEFINITIONS = [
        {
            id: 'key',
            header: 'Key',
            cell: (item: { key: any; }) => item.key,
            width: 300,
            isRowHeader: true,
            sortingField: 'key',
        },
        {
            id: 'value',
            header: 'Value',
            cell: (item: { value: any; }) => item.value || '-',
            sortingField: 'value',
        },
    ];

    return <>
        <Table
            columnDefinitions={COLUMN_DEFINITIONS}
            items={items}
            {...variant ? { variant } : {}}
            {...collectionProps}
            // loading={tagsLoading}
            // loadingText="Loading tags"
            filter={
                <TextFilter
                    {...filterProps}
                    filteringPlaceholder="Find"
                    filteringAriaLabel="Filter"
                    countText={filteredItemsCount === 1 ? '1 match' : `${filteredItemsCount} matches`}
                />
            }
            header={
                <Header
                    variant="h2"
                    counter={`(${keyValueArray.length})`}
                >
                    {headerText}
                </Header>
            }
        />
    </>
}
