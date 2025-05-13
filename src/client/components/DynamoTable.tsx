import { useCollection } from "@cloudscape-design/collection-hooks";
import { CollectionPreferences, CollectionPreferencesProps, Header, Link, Modal, Pagination, Table, TableProps } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { ViewCode } from "./ViewCode";

interface DynamoTableProps {
    items: any[];
    tableDetails: any;
    hasNextPage: boolean;
}

export const DynamoTable = (props: DynamoTableProps) => {

    let DEFAULT_PREFERENCES: CollectionPreferencesProps.Preferences = {
        pageSize: 25,
        stickyColumns: { first: 1, last: 0 },
    };

    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
    const [rows, setRows] = useState<any[]>([]);
    const [columnDef, setColumnDef] = useState<TableProps.ColumnDefinition<any>[]>([]);
    const [viewRecord, setViewRecord] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<string>('');

    const partitionKey = props.tableDetails.Table.KeySchema.find((key: any) => key.KeyType === 'HASH');
    const sortKey = props.tableDetails.Table.KeySchema.find((key: any) => key.KeyType === 'RANGE');

    const { items, collectionProps, paginationProps } = useCollection(rows, {
        pagination: { pageSize: preferences.pageSize },
        sorting: {},
    });

    const getSortedKeys = (items: any[]) => {

        const uniqueKeys: string[] = [...new Set<string>(items.flatMap(Object.keys))];

        uniqueKeys.sort();
        if (sortKey) {
            // 2nd column
            const index = uniqueKeys.indexOf(sortKey.AttributeName);
            if (index > -1) {
                uniqueKeys.splice(index, 1);
                uniqueKeys.unshift(sortKey.AttributeName);
            }
        }
        if (partitionKey) {
            // 1st column
            const index = uniqueKeys.indexOf(partitionKey.AttributeName);
            if (index > -1) {
                uniqueKeys.splice(index, 1);
                uniqueKeys.unshift(partitionKey.AttributeName);
            }
        }

        return uniqueKeys;
    }


    const showCurrentRecord = (item: any) => {
        setViewRecord(true);

        const uniqueKeys: string[] = getSortedKeys([item]);
        const convertDynamoDbJson = (item: any) => {
            const keys = Object.keys(item);
            // String, Number, Binary, Boolean, Null, Map, List, String Set, Number Set, Binary Set
            const dynamoDbKeys = ['S', 'N', 'B', 'BOOL', 'NULL', 'M', 'L', 'SS', 'NS', 'BS'];
            return keys.reduce((acc, key) => {
                const value = item[key];
                if (typeof value === 'object' && value !== null) {
                    const firstKey = Object.keys(value)[0];
                    if (Object.keys(value).length === 1 && dynamoDbKeys.includes(firstKey) && !['M', 'L'].includes(firstKey)) {
                        acc[key] = value[Object.keys(value)[0]];
                    } else {
                        acc[key] = convertDynamoDbJson(value[firstKey]);
                    }
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);
        }

        const sortedItem = uniqueKeys.reduce((acc, key) => {
            acc[key] = item[key];
            if (typeof item[key] === 'object' && item[key] !== null) {
                acc[key] = convertDynamoDbJson(item[key]);
            }
            return acc;
        }, {} as any);
        setCurrentRecord(JSON.stringify(sortedItem, null, 4));
    }

    useEffect(() => {
        const uniqueKeys: string[] = getSortedKeys(props.items);

        const newColumnDef: TableProps.ColumnDefinition<any>[] = uniqueKeys.map((key: string, index: number) => {

            if (index === 0 && uniqueKeys[0] === partitionKey.AttributeName) {
                return {
                    id: key,
                    header: key,
                    cell: item => <Link onFollow={(event) => { event.preventDefault(); showCurrentRecord(item) }} >{item[key]}</Link>,
                    sortingField: key,
                    width: 200,
                    visible: true
                } as TableProps.ColumnDefinition<any>;
            }

            return {
                id: key,
                header: key,
                cell: item => {
                    const value = item[key];
                    if (typeof value === 'boolean') {
                        return <i>{value.toString()}</i>;
                    }
                    return typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
                },
                sortingField: key,
                width: 200,
                // visible: true
            } as TableProps.ColumnDefinition<any>;
        });
        setColumnDef(newColumnDef);

        const transformedItems = props.items.map((item: any) => {
            const transformedItem: { [key: string]: string } = {};
            for (const key in item) {
                const valueObject = item[key];
                const valueKey = Object.keys(valueObject)[0];
                transformedItem[key] = valueObject[valueKey];
            }
            return transformedItem;
        });

        setRows(transformedItems);
    }, [props.items]);


    return <>
        <div>
            <Table
                columnDefinitions={columnDef}
                items={items}
                {...collectionProps}
                resizableColumns={true}
                enableKeyboardNavigation={true}
                stickyColumns={preferences.stickyColumns}
                stickyHeader={true}
                pagination={<Pagination {...paginationProps} openEnd={props.hasNextPage ? true : false} />}
                header={
                    <Header
                        variant="h2"
                        counter={`(${rows.length}${props.hasNextPage ? '+' : ''})`}
                    >
                        Items returned
                    </Header>
                }
                preferences={<CollectionPreferences
                    title="Preferences"
                    confirmLabel="Confirm"
                    cancelLabel="Cancel"
                    preferences={preferences}
                    onConfirm={({ detail }) => setPreferences(detail)}
                    pageSizePreference={{
                        title: "Select page size",
                        options: [
                            { value: 25, label: "25 records" },
                            { value: 50, label: "50 records" },
                            { value: 75, label: "75 records" },
                            { value: 100, label: "100 records" },
                        ]
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
            />
            <Modal
                size="large"
                visible={viewRecord}
                onDismiss={() => setViewRecord(false)}
                header="Record"
            >
                {viewRecord && currentRecord &&
                    <ViewCode language="json" code={currentRecord} />
                }
            </Modal>
        </div>
    </>


}

