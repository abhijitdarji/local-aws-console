
import { useCollection } from "@cloudscape-design/collection-hooks";
import { Table, Icon, TableProps } from "@cloudscape-design/components";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogRecord } from "./LogRecord";
import RouterLink from "./RouterLink";


type LogTableProps = {
    logs: any[];
    logGroupName: string;
}

export const LogInsightsTable = (props: LogTableProps) => {

    const [columnDef, setColumnDef] = useState<TableProps.ColumnDefinition<any>[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [selectedRows, setSelectedRows] = useState<{ [key: string]: boolean }>({ "0": false });

    // update logs array to add id for selections
    const logs = props.logs.map((log, index) => [{ field: "id", value: (index + 1).toString() }, ...log]);

    const { items, collectionProps } = useCollection(rows, {});

    const updateSelectedRows = (rowId: string) => {
        setSelectedRows(prevRows => {
            return {
                ...prevRows,
                [rowId]: !prevRows[rowId]
            }
        });
    };

    const uniqueKeys: string[] = useMemo(() => {
        return logs[0].map((item: any) => item.field).filter((field: string) => field !== '@ptr');
    }, [props.logs]);


    const newColumnDef: TableProps.ColumnDefinition<any>[] = useMemo(() => {
        const columnDef = uniqueKeys.map((key: string, index: number) => {

            // id column
            if (index === 0) {
                return {
                    id: 'select',
                    header: "#",
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
                            {selectedRows[item.id] ? <Icon name="caret-down-filled" /> : <Icon name="caret-right-filled" />} {item.id}
                        </div>
                    },
                    width: 40,
                    maxWidth: 40,
                };
            }

            // 2nd column
            if (index === 1) {
                return {
                    id: key,
                    header: key,
                    cell: (item) => {
                        const cellRef = useRef(null);
                        let tableWidth = 1100;

                        useEffect(() => {
                            if (cellRef.current) {
                                (cellRef.current as any).parentNode.parentNode.style.overflow = 'visible';
                                tableWidth = (cellRef.current as any).parentNode.parentNode.parentNode.parentNode.scrollWidth;
                            }
                        }, []);

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
                                }}>

                                    {key === '@logStream' && props.logGroupName.length > 0 &&
                                        <RouterLink external={true} href={`/cloudwatchlogs/${encodeURIComponent(props.logGroupName)}/${encodeURIComponent(item[key])}`} variant="secondary">{item[key]}</RouterLink>
                                    }
                                    {key !== '@logStream' && item[key]}

                                </span>
                            </span>
                            <div style={{
                                width: tableWidth + 100,
                                overflow: "auto",
                                paddingTop: "18px",
                                wordBreak: "break-word",
                                whiteSpace: "wrap",
                                display: selectedRows[item.id] ? "block" : "none",
                            }}>
                                <div>
                                    <pre style={{
                                        whiteSpace: "pre-wrap",
                                    }}>
                                        {selectedRows[item.id] && <LogRecord ptr={item['@ptr']} ></LogRecord>}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    },
                    minWidth: 260
                }
            }

            return {
                id: key,
                header: key,
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
                        {key === '@logStream' &&
                            <>
                                {props.logGroupName.length > 0 ? (
                                    <RouterLink external={true} href={`/cloudwatchlogs/${encodeURIComponent(props.logGroupName)}/${encodeURIComponent(item[key])}`}>{item[key]}</RouterLink>
                                ) : (
                                    item[key]
                                )}
                            </>
                        }
                        {key !== '@logStream' && item[key]}
                    </div>
                },
                minWidth: 400
            } as TableProps.ColumnDefinition<any>
        });

        return columnDef;

    }, [uniqueKeys, selectedRows]);

    const transformedItems = useMemo(() => {
        return logs.map((item: any) => {
            const transformedItem: { [key: string]: string | any[] } = {};
            item.forEach((log: any) => {
                transformedItem[log.field] = log.value
            });
            return transformedItem;
        });
    }, [props.logs]);

    useEffect(() => {
        setColumnDef(newColumnDef);
        setRows(transformedItems);
    }, [newColumnDef]);

    // useEffect(() => {
    //     const uniqueKeys: string[] = logs[0].map((item: any) => item.field).filter((field: string) => field !== '@ptr');

    //     const newColumnDef: TableProps.ColumnDefinition<any>[] = uniqueKeys.map((key: string, index: number) => {

    //         // id column
    //         if (index === 0) {
    //             return {
    //                 id: 'select',
    //                 header: "#",
    //                 cell: (item) => {
    //                     const cellRef = useRef(null);

    //                     useEffect(() => {
    //                         if (cellRef.current) {
    //                             (cellRef.current as any).parentNode.parentNode.style.verticalAlign = 'top';
    //                         }
    //                     }, []);
    //                     return <div ref={cellRef} onClick={() => updateSelectedRows(item.id)} style={{
    //                         cursor: "pointer"
    //                     }}>
    //                         {selectedRows[item.id] ? <Icon name="caret-down-filled" /> : <Icon name="caret-right-filled" />} {item.id}
    //                     </div>
    //                 },
    //                 width: 35,
    //                 maxWidth: 35,
    //             };
    //         }

    //         // 2nd column
    //         if (index === 1) {
    //             return {
    //                 id: key,
    //                 header: key,
    //                 cell: (item) => {
    //                     const cellRef = useRef(null);
    //                     let tableWidth = 1200;

    //                     useEffect(() => {
    //                         if (cellRef.current) {
    //                             (cellRef.current as any).parentNode.parentNode.style.overflow = 'visible';
    //                             tableWidth = (cellRef.current as any).parentNode.parentNode.parentNode.parentNode.scrollWidth;
    //                         }
    //                     }, []);

    //                     return <div ref={cellRef}>
    //                         <span>
    //                             <span onClick={() => updateSelectedRows(item.id)} style={{
    //                                 overflow: "hidden",
    //                                 textOverflow: "ellipsis",
    //                                 width: "100%",
    //                                 marginLeft: "-20px",
    //                                 marginTop: "-5px",
    //                                 padding: "6px 20px 0",
    //                                 cursor: "pointer"
    //                             }}>

    //                                 {key === '@logStream' && props.logGroupName.length > 0 && 
    //                                     <RouterLink external={true} href={`/cloudwatchlogs/${encodeURIComponent(props.logGroupName)}/${encodeURIComponent(item[key])}`} variant="secondary">{item[key]}</RouterLink>
    //                                 }
    //                                 {key !== '@logStream' && item[key]}

    //                             </span>
    //                         </span>
    //                         <div style={{
    //                             width: tableWidth + 100,
    //                             overflow: "auto",
    //                             paddingTop: "18px",
    //                             wordBreak: "break-word",
    //                             whiteSpace: "wrap",
    //                             display: selectedRows[item.id] ? "block" : "none",
    //                         }}>
    //                             <div>
    //                                 <pre style={{
    //                                     whiteSpace: "pre-wrap",
    //                                 }}>
    //                                     {selectedRows[item.id] && <LogRecord ptr={item['@ptr']} ></LogRecord>}
    //                                 </pre>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 },
    //                 minWidth: 260
    //             }
    //         }

    //         return {
    //             id: key,
    //             header: key,
    //             cell: (item) => {
    //                 const cellRef = useRef(null);

    //                 useEffect(() => {
    //                     if (cellRef.current) {
    //                         (cellRef.current as any).parentNode.parentNode.style.verticalAlign = 'top';
    //                     }
    //                 }, []);

    //                 return <div ref={cellRef} onClick={() => updateSelectedRows(item.id)} style={{
    //                     whiteSpace: "nowrap",
    //                     overflow: "hidden",
    //                     textOverflow: "ellipsis",
    //                     width: "100%",
    //                     cursor: "pointer",
    //                     marginLeft: "-19px",
    //                     marginTop: "-5px",
    //                     padding: "6px 20px 0"
    //                 }}>
    //                     {key === '@logStream' && props.logGroupName.length > 0 &&
    //                         <RouterLink external={true} href={`/cloudwatchlogs/${encodeURIComponent(props.logGroupName)}/${encodeURIComponent(item[key])}`} variant="secondary">{item[key]}</RouterLink>
    //                     }
    //                     {key !== '@logStream' && item[key]}
    //                 </div>
    //             },
    //             minWidth: 400
    //         } as TableProps.ColumnDefinition<any>
    //     });

    //     setColumnDef(newColumnDef);

    //     const transformedItems = logs.map((item: any) => {
    //         const transformedItem: { [key: string]: string | any[] } = {};
    //         item.forEach((log: any) => {
    //             transformedItem[log.field] = log.value
    //         });
    //         return transformedItem;
    //     });

    //     console.log(transformedItems);

    //     setRows(transformedItems);
    // }, [props.logs, selectedRows]);


    return <>
        <Table
            columnDefinitions={columnDef}
            items={items}
            {...collectionProps}
            resizableColumns={true}
            stripedRows
            stickyColumns={{ first: 1 }}
        />
    </>
}
