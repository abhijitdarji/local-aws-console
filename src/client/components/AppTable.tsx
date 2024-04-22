
import { useState, useLayoutEffect } from "react";
import { Table, TableProps, Box, SpaceBetween, Button,
TextFilter, Header, Pagination, CollectionPreferences, CollectionPreferencesProps } from "@cloudscape-design/components";
import { useCollection } from '@cloudscape-design/collection-hooks';

export type ColumnDefinitionType = TableProps.ColumnDefinition<any> & {
    visible?: boolean;
    isKey?: boolean;
}

type AppTableProps = {
    columnDef: ColumnDefinitionType[];
    pageSize?: number;
    items: any[];
    resourceName: string;
    loading?: boolean;
    selectionType?: TableProps.SelectionType;
    onFilterChange?: (item: string) => void;
    defaultFilter?: string;
}

export const AppTable = (props: AppTableProps) => {
    // const [selectedItems, setSelectedItems] = useState([]);

    const contentDisplayPref: TableProps.ColumnDisplayProperties[] = props.columnDef.map(column => {
        return { id: column.id!, visible: column.visible! };
    })

    const contentDisplayOptions: CollectionPreferencesProps.ContentDisplayOption[] = props.columnDef.map(column => {
        return { id: column.id!, label: column.header?.toString()!, alwaysVisible: column.isKey ? true : false };
    });

    let DEFAULT_PREFERENCES: CollectionPreferencesProps.Preferences = {
        pageSize: props.pageSize || 10,
        contentDisplay: contentDisplayPref,
        wrapLines: false,
        stripedRows: true,
        contentDensity: 'comfortable',
        stickyColumns: { first: 1, last: 0 },
      };


    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

    // const columnDisplay = props.columnDef.map(column => {
    //     return { id: column.id, visible: column.visible };
    // })

    // const columnDisplayPref = props.columnDef.map(column => {
    //     return { id: column.id, label: column.header, editable: column.isKey ? !column.isKey : true };
    // })

    
    const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
        props.items,
        {
            filtering: {
                defaultFilteringText: props.defaultFilter || '',
                empty: <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                    <SpaceBetween size="xxs">
                        <div>
                            <b>No {props.resourceName.toLowerCase()}s</b>
                        </div>
                    </SpaceBetween>
                </Box>,
                noMatch: <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                    <SpaceBetween size="xxs">
                        <div>
                            <b>No matches</b>
                            <Box variant="p" color="inherit">
                                We can't find a match.
                            </Box>
                        </div>
                        <Button onClick={() => {
                            actions.setFiltering('');
                        }}>Clear filter</Button>
                    </SpaceBetween>
                </Box>,
                // filteringFunction: (item, filteringText) => {
                //     if(filteringText === '') return true;
                //     const filteringTextLowerCase = filteringText.toLowerCase();

                //     return props.columnDef.map(c => c.id).map(key => item[key]).some(
                //         value => typeof value === 'string' && value.toLowerCase().indexOf(filteringTextLowerCase) > -1
                //     );
                // },
            },
            pagination: { pageSize: preferences.pageSize },
            sorting: {},
            selection: {},
        }
    );


    const { selectedItems } = collectionProps;

    useLayoutEffect(() => {
        collectionProps.ref.current?.scrollToTop();
    }, [collectionProps.ref, filterProps.filteringText]);


    return <Table
        {...collectionProps}
        columnDefinitions={props.columnDef}
        columnDisplay={preferences.contentDisplay}
        // visibleColumns={preferences.visibleContent}
        items={items}
        stickyHeader={true}
        resizableColumns={true}
        {...props.selectionType && { selectionType: props.selectionType }}
        // variant="full-page"
        // onSelectionChange={({ detail }) =>
        //     setSelectedItems(detail.selectedItems)
        // }
        // selectedItems={selectedItems}
        // ariaLabels={{
        //     allItemsSelectionLabel: ({ selectedItems }) =>
        //         `${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"} selected`,
        //     itemSelectionLabel: (data, row) => `Select function ${row.FunctionName}`
        // }}
        loading={props.loading}
        loadingText="Loading resources"
        // trackBy="FunctionName"
        // empty={<Box
        //     margin={{ vertical: "xs" }}
        //     textAlign="center"
        //     color="inherit">
        //     <SpaceBetween size="m">
        //         <b>No resources</b>
        //     </SpaceBetween>
        // </Box>}
        wrapLines={preferences.wrapLines}
        stripedRows={preferences.stripedRows}
        contentDensity={preferences.contentDensity}
        stickyColumns={preferences.stickyColumns}
        filter={<TextFilter
            {...filterProps}
            onDelayedChange={({ detail }) => {
               props.onFilterChange && props.onFilterChange(detail.filteringText);
            }}
            countText={filteredItemsCount === 1 ? `1 match` : `${filteredItemsCount} matches`}
        />}
        header={<Header
            counter={selectedItems?.length ? `(${selectedItems.length}/${props.items.length})` : `(${props.items.length})`}>{props.resourceName}s</Header>}
        pagination={<Pagination {...paginationProps} />}
        preferences={<CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={preferences}
            onConfirm={({ detail }) => setPreferences(detail)}
            pageSizePreference={{
                title: "Select page size",
                options: [
                    { value: 10, label: "10 resources" },
                    { value: 20, label: "20 resources" },
                    { value: 50, label: "50 resources" },
                    { value: 100, label: "100 resources" },
                ]
            }}
            // visibleContentPreference={{
            //     title: "Select visible content",
            //     options: [
            //         {
            //             label: 'Main properties',
            //             options: columnDisplayPref,
            //         },
            //     ],
            // }}
            wrapLinesPreference={{
                label: "Wrap lines",
                description: "Select to see all the text and wrap the lines",
            }}
            stripedRowsPreference={{
                label: "Striped rows",
                description: "Select to add alternating shaded rows",
            }}
            contentDensityPreference={{
                label: "Compact mode",
                description: "Select to display content in a denser, more compact mode"
            }}
            contentDisplayPreference={{ 
                title: "Column Preferences",
                description: "Customize the columns visibility and order.",
                options: contentDisplayOptions 
            }}
            stickyColumnsPreference={{ 
                firstColumns: { 
                    title: "Stick first column(s)", 
                    description: "Keep the first column(s) visible while horizontally scrolling the table content.", 
                    options: [
                        { label: "None", value: 0 }, 
                        { label: "First column", value: 1 }, 
                        { label: "First two columns", value: 2 }
                    ] 
                }, 
                lastColumns: { 
                    title: "Stick last column", 
                    description: "Keep the last column visible while horizontally scrolling the table content.", 
                    options: [
                        { label: "None", value: 0 }, 
                        { label: "Last column", value: 1 }
                        ] 
                } 
            }} 
        />}
    />;
};