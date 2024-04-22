
import { useCollection } from "@cloudscape-design/collection-hooks";
import { Box, Button, Header, Table, TextFilter, Icon } from "@cloudscape-design/components";
import { ColumnDefinitionType } from "./AppTable";
import { useEffect, useRef, useState } from "react";
import CopyText from "./CopyText";

type LogEntry = {
    id?: string;
    timestamp: string;
    message: string;
}

type LogTableProps = {
    headerText: string;
    logs: LogEntry[];
    viewPlainText?: boolean;
    expandAllRows?: boolean;
}

export const LogEventsTable = ({ headerText, logs, viewPlainText = false, expandAllRows = false }: LogTableProps) => {

    const [selectedRows, setSelectedRows] = useState<{ [key: string]: boolean }>({});
    const [selectedAll, setSelectedAll] = useState<boolean>(expandAllRows);

    // update logs array to add id for selections
    logs = logs.map((log, index) => ({
        ...log,
        id: index.toString()
    }));

    const updateSelectedRows = (rowId: string) => {
        setSelectedRows(prevRows => ({
            ...prevRows,
            [rowId]: !prevRows[rowId]
        }));
    };

    const updateAllRows = () => {
        setSelectedAll(!selectedAll);
        if (selectedAll) {
            setSelectedRows({});
        } else {
            let selectedRows: { [key: string]: boolean } = {};
            logs.forEach((log, index) => {
                selectedRows[index.toString()] = true;
            });
            setSelectedRows(selectedRows);
        }
    }

    useEffect(() => {
        if (expandAllRows !== selectedAll) {
            updateAllRows();
        }
    }, [expandAllRows]);


    const { items, collectionProps, filteredItemsCount, filterProps, actions } = useCollection(logs, {
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

    const COLUMN_DEFINITIONS_EXPAND: ColumnDefinitionType[] = [
        {
            id: 'select',
            header: <div onClick={() => updateAllRows()}>
                {selectedAll ? <Icon name="caret-down-filled" /> : <Icon name="caret-right-filled" />}
            </div>,
            cell: (item) => {
                const cellRef = useRef(null);

                useEffect(() => {
                    if (cellRef.current) {
                        (cellRef.current as any).parentNode.parentNode.style.verticalAlign = 'top';
                    }
                }, []);
                return <div ref={cellRef} onClick={() => updateSelectedRows(item.id)} style={{
                    cursor: "pointer"
                }}>
                    {selectedRows[item.id] ? <Icon name="caret-down-filled" /> : <Icon name="caret-right-filled" />}
                </div>
            },
            width: 35,
            maxWidth: 35,
        },
        {
            id: 'timestamp',
            header: 'Timestamp',
            cell: (item) => {
                const cellRef = useRef(null);
                let tableWidth = 1200;

                useEffect(() => {
                    if (cellRef.current) {
                        (cellRef.current as any).parentNode.parentNode.style.overflow = 'visible';
                        tableWidth = (cellRef.current as any).parentNode.parentNode.parentNode.parentNode.scrollWidth;
                    }
                }, []);

                let regex = /{.*?}/g;
                let formattedString = item.message;

                try {
                    formattedString = formattedString.replace(regex, (match: string) => {
                        let jsonObject = JSON.parse(match);
                        return JSON.stringify(jsonObject, null, 2);
                    });
                } catch (error) { }

                return <div ref={cellRef}>
                    <span>
                        <span onClick={() => updateSelectedRows(item.id)} style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                            marginLeft: "-20px",
                            marginTop: "-5px",
                            padding: "6px 20px 0",
                            cursor: "pointer"
                        }}>{item.isoTimestamp}</span>
                    </span>
                    <div style={{
                        width: tableWidth + 120,
                        overflow: "auto",
                        paddingTop: "18px",
                        wordBreak: "break-word",
                        whiteSpace: "wrap",
                        display: selectedRows[item.id] ? "block" : "none",
                    }}>
                        <div style={{
                            minHeight: "50px",
                            width: "110px",
                            float: "right",
                            margin: "10px 10px 0 0"
                        }}>
                            <CopyText buttonText="Copy" noIcon={true} copyText={item.message} />
                        </div>
                        <div><pre style={{
                            whiteSpace: "pre-wrap",
                        }}>{formattedString}</pre></div>
                    </div>
                </div>
            },
            width: 260,
            sortingField: 'timestamp',
        },
        {
            id: 'message',
            header: 'Message',
            cell: (item) => {
                const cellRef = useRef(null);

                useEffect(() => {
                    if (cellRef.current) {
                        (cellRef.current as any).parentNode.parentNode.style.verticalAlign = 'top';
                    }
                }, []);

                return <div ref={cellRef} onClick={() => updateSelectedRows(item.id)} style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    cursor: "pointer",
                    marginLeft: "-19px",
                    marginTop: "-5px",
                    padding: "6px 20px 0"
                }}>
                    {item.message}
                </div>
            },
            sortingField: 'message',
            minWidth: 400
        },
    ];


    const COLUMN_DEFINITIONS_TEXT: ColumnDefinitionType[] = [
        {
            id: 'message',
            header: 'Message',
            cell: (item) => {
                let regex = /{.*?}/g;
                let formattedString = item.message;

                try {
                    formattedString = formattedString.replace(regex, (match: string) => {
                        let jsonObject = JSON.parse(match);
                        return JSON.stringify(jsonObject, null, 2);
                    });
                } catch (error) { }

                return <div>
                    <div><pre style={{
                        whiteSpace: "pre-wrap",
                    }}>{formattedString}</pre></div>
                </div>
            }
        }
    ]

    return <>
        <Table
            columnDefinitions={viewPlainText ? COLUMN_DEFINITIONS_TEXT : COLUMN_DEFINITIONS_EXPAND}
            items={items}
            {...collectionProps}
            resizableColumns={true}
            filter={
                <TextFilter
                    {...filterProps}
                    filteringPlaceholder="Find"
                    filteringAriaLabel="Filter"
                    countText={filteredItemsCount === 1 ? '1 match' : `${filteredItemsCount} matches`}
                />
            }
            stripedRows
            stickyColumns={{ first: 1 }}
        // header={
        //     <Header
        //         variant="h2"
        //         counter={`(${logs.length})`}
        //     >
        //         {headerText || ''}
        //     </Header>
        // }
        />
    </>
}
