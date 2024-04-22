
import { useState, useContext, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
    ContentLayout, Header, SpaceBetween, Button, Multiselect, DateRangePicker, ColumnLayout, Container,
    DateRangePickerProps, Tabs, FormField, SelectProps, MultiselectProps,
    Box,
    StatusIndicator,
    StatusIndicatorProps
} from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { LogsInsightsEditor } from "../../components/LogsInsightsEditor";
import { APIUtils } from "../../utility/api";
import { DropdownStatusProps } from "@cloudscape-design/components/internal/components/dropdown-status";
import { NotificationContext, NotificationContextValue } from "../../context/NotificationsContext";
import { LayoutContext, LayoutContextValue } from "../../context/LayoutContext";
import { DateUtils } from "../../utility/dates";
import { LogInsightsTable } from "../../components/LogInsightsTable";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { QueryHistory } from "./QueryHistory";
import { SavedQueries } from "./SavedQueries";

interface QueryRunStatus {
    status: string;
    statusType: StatusIndicatorProps.Type;
    matches: number;
    scanned: number;
    bytes: number;
    timeLeft: number;
}

const enum DRAWERS {
    HISTORY = 'history',
    QUERIES = 'queries'
}

export const LogInsights = () => {
    const { environment, region } = useContext(GlobalContext) as GlobalContextType;
    const { notify } = useContext(NotificationContext) as NotificationContextValue;
    const [dateRange, setDateRange] = useState<DateRangePickerProps.Value>({ key: "previous-5-minutes", amount: 5, unit: "minute", type: "relative" });
    const [editorText, setEditorText] = useState(`fields @timestamp, @message
    | filter @message = 'error'
    | limit 20`);
    const [logGroupOptions, setLogGroupOptions] = useState<SelectProps.Options>([]);
    const [selectedLogGroups, setSelectedLogGroups] = useState<MultiselectProps.Option[]>([]);
    const { logGroupName, logStreamName } = useParams();
    const [status, setStatus] = useState<DropdownStatusProps.StatusType>('finished');
    const [logs, setLogs] = useState<any[]>([]);
    const { activeDrawerId, setDrawers, setActiveDrawerId } = useContext<LayoutContextValue>(LayoutContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [queryId, setQueryId] = useState<string>('');
    const [queryRunStatus, setQueryRunStatus] = useState<QueryRunStatus>({} as QueryRunStatus);
    const isCancelledRef = useRef(false);

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#/logsV2:log-groups/log-group/${logGroupName}/log-events/${logStreamName}`

    useEffect(() => {
        setDrawers([
            {
                id: DRAWERS.HISTORY,
                ariaLabels: {
                    drawerName: 'Query History',
                },
                // badge: true,
                resizable: true,
                defaultSize: 600,
                content: <div style={{ padding: "30px", paddingTop: "40px" }}><QueryHistory /></div>,
                trigger: {
                    iconName: 'insert-row',
                }
            },
            {
                id: DRAWERS.QUERIES,
                ariaLabels: {
                    drawerName: 'Saved Queries',
                },
                // badge: true,
                resizable: true,
                defaultSize: 600,
                content: <div style={{ padding: "30px", paddingTop: "40px" }}><SavedQueries /></div>,
                trigger: {
                    iconName: 'folder',
                }
            }
        ]);

        // unmount cleanup
        return () => {
            setDrawers([]);
        };
    }, []);

    const loadLogGroups = async (filteringText: string) => {
        setStatus('loading');
        [];

        const response = await APIUtils.getCachedData<any>({
            method: 'POST',
            url: '/aws/CloudWatchLogs/DescribeLogGroups',
            forceFetch: false,
            fetchAllPages: true,
            body: {},
            environment: environment,
            region: region
        });

        if (response.isError) {
            setStatus('error');
            notify({ type: 'error', content: response.errorMessage });
            return;
        }

        if (response.data?.logGroups) {
            const options: SelectProps.Options = response.data.logGroups.map((logGroup: any) => {
                return { label: logGroup.logGroupName, value: logGroup.logGroupName };
            });
            setLogGroupOptions(options);
        }

        setStatus('finished');

    }

    const runQuery = async () => {
        const { startTime, endTime } = DateUtils.calculateStartAndEndTimes(dateRange);

        if (!startTime || !endTime) {
            notify({ type: 'error', content: 'Invalid date range.' });
            return;
        }

        if (selectedLogGroups.length === 0) {
            notify({ type: 'error', content: 'Select at least one log group.' });
            return;
        }

        setLoading(true);
        const startQueryResponse = await APIUtils.getData<any>({
            method: 'POST',
            url: '/aws/CloudWatchLogs/StartQuery',
            body: {
                logGroupNames: selectedLogGroups.map(option => option.value),
                startTime: startTime,
                endTime: endTime,
                queryString: editorText
            },
            environment: environment,
            region: region
        });

        if (startQueryResponse.isError) {
            notify({ type: 'error', content: startQueryResponse.errorMessage });
            setLoading(false);
            return;
        }

        const queryId = startQueryResponse.data.queryId;
        setQueryId(queryId);

        let queryResponse = await getQueryResults(queryId);

        if (!queryResponse) {
            return;
        }

        while (true) {
            if (queryResponse.status === 'Complete') {
                setQueryId('');
                setQueryRunStatus({
                    status: queryResponse.status,
                    statusType: 'success',
                    matches: queryResponse.statistics.recordsMatched,
                    scanned: queryResponse.statistics.recordsScanned,
                    bytes: queryResponse.statistics.bytesScanned,
                    timeLeft: 0
                });
                break;
            }

            if (['Failed', 'Cancelled', 'Timeout', 'Unknown'].includes(queryResponse.status)) {
                notify({ type: 'error', content: `Query status: ${queryResponse.status}` });
                setLoading(false);
                setQueryId('');
                setQueryRunStatus({
                    status: queryResponse.status,
                    statusType: 'error',
                    matches: 0,
                    scanned: 0,
                    bytes: 0,
                    timeLeft: 0
                });
                return;
            }

            if (['Running', 'Scheduled'].includes(queryResponse.status)) {

                setQueryRunStatus({
                    status: queryResponse.status,
                    statusType: 'in-progress',
                    matches: queryResponse.statistics.recordsMatched,
                    scanned: queryResponse.statistics.recordsScanned,
                    bytes: queryResponse.statistics.bytesScanned,
                    timeLeft: 10
                });

                // Wait 10 seconds before checking again
                await new Promise(resolve => {

                    // update the query status every second
                    const interval = setInterval(() => {
                        if (isCancelledRef.current) {
                            clearInterval(interval);
                            resolve(undefined);
                            return;
                        }

                        setQueryRunStatus(prevState => {
                            return {
                                status: queryResponse.status,
                                statusType: 'in-progress',
                                matches: queryResponse.statistics.recordsMatched,
                                scanned: queryResponse.statistics.recordsScanned,
                                bytes: queryResponse.statistics.bytesScanned,
                                timeLeft: prevState.timeLeft - 1
                            }
                        });
                    }, 1000);

                    setTimeout(() => {
                        if (!isCancelledRef.current) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    }, 10000);
                });
                queryResponse = await getQueryResults(queryId);
            }
        }


        setLoading(false);
        setLogs(queryResponse.results);
    }

    const getQueryResults = async (queryId: string) => {

        const queryResponse = await APIUtils.getData<any>({
            method: 'POST',
            url: '/aws/CloudWatchLogs/GetQueryResults',
            body: {
                queryId: queryId
            },
            environment: environment,
            region: region
        });

        if (queryResponse.isError) {
            notify({ type: 'error', content: queryResponse.errorMessage });
            setLoading(false);
            return false;
        }

        return queryResponse.data;
    }

    const cancelQuery = async () => {

        if (!queryId) {
            return;
        }

        const response = await APIUtils.getData<any>({
            method: 'POST',
            url: '/aws/CloudWatchLogs/StopQuery',
            body: {
                queryId: queryId
            },
            environment: environment,
            region: region
        });

        if (response.isError) {
            notify({ type: 'error', content: response.errorMessage });
            if (response.errorMessage.startsWith('Query is already ended with Complete')) {
                setQueryId('');
            }
            return;
        }

        setQueryId('');
        isCancelledRef.current = true;
    }

    const toggleDrawer = (drawerId: DRAWERS) => {
        setActiveDrawerId(activeDrawerId === drawerId ? null : drawerId);
    }

    return <>

        <ContentLayout
            header={<Header
                variant="h1"
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button
                            href={awsUrl}
                            iconAlign="right"
                            iconName="external"
                            target="_blank">View on AWS</Button>
                    </SpaceBetween>
                }
            >
                Insights
            </Header>}
        >

            <SpaceBetween size="m">
                <Container>
                    <SpaceBetween size="xs">

                        <ColumnLayout columns={2} variant="text-grid">
                            <FormField
                                description="Select log groups, and then run a query."
                                stretch={true}
                            >
                                <Multiselect
                                    onLoadItems={({ detail: { filteringText } }) => loadLogGroups(filteringText)}
                                    options={logGroupOptions}
                                    selectedOptions={selectedLogGroups}
                                    onChange={event => setSelectedLogGroups(event.detail.selectedOptions as MultiselectProps.Option[])}
                                    statusType={status}
                                    placeholder="Select up to 50 log groups."
                                    loadingText="Loading log groups"
                                    errorText="Error fetching log grouops."
                                    recoveryText="Retry"
                                    filteringType="auto"
                                    tokenLimit={1}
                                />
                            </FormField>

                            <FormField description="&nbsp;">
                                <SpaceBetween size="m">
                                    <DateRangePicker
                                        onChange={({ detail }) => { setDateRange(detail.value!); }}
                                        value={dateRange}
                                        relativeOptions={[
                                            { key: "previous-5-minutes", amount: 5, unit: "minute", type: "relative" },
                                            { key: "previous-30-minutes", amount: 30, unit: "minute", type: "relative" },
                                            { key: "previous-1-hour", amount: 1, unit: "hour", type: "relative" },
                                            { key: "previous-6-hours", amount: 6, unit: "hour", type: "relative" }
                                        ]}
                                        isValidRange={() => ({ valid: true })}
                                        placeholder="Filter by a date and time range" />

                                    {selectedLogGroups.length > 0 && <Button onClick={() => setSelectedLogGroups([])}>Clear all</Button>}
                                </SpaceBetween>
                            </FormField>
                        </ColumnLayout>

                        <LogsInsightsEditor onTextChange={setEditorText} defaultValue={editorText} />

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Button disabled={queryId?.length > 0}
                                        variant="primary"
                                        loading={loading}
                                        onClick={() => runQuery()}>Run query</Button>
                                    <Button disabled={queryId?.length === 0}
                                        // loading={queryId?.length > 0 && loading}
                                        onClick={() => cancelQuery()}>Cancel</Button>
                                    <Button onClick={() => toggleDrawer(DRAWERS.HISTORY) }>History</Button>
                                </SpaceBetween>
                            </div>
                            <div>
                                <SpaceBetween direction="horizontal" size="xs">
                                    <Button onClick={() => toggleDrawer(DRAWERS.QUERIES) }>Saved Queries</Button>
                                </SpaceBetween>
                            </div>
                        </div>


                        {Object.keys(queryRunStatus).length > 0 &&
                            <Box variant="awsui-key-label">Query stats: status: <StatusIndicator type={queryRunStatus.statusType}>{queryRunStatus.status}</StatusIndicator>
                                {queryRunStatus.statusType !== 'error' ? `, matches: ${queryRunStatus.matches}, scanned: ${queryRunStatus.scanned}, bytes: ${(queryRunStatus.bytes / 1024).toFixed(2)} KB.` : ""}
                                {queryRunStatus.timeLeft > 0 ? ` checking again in ${queryRunStatus.timeLeft}s` : ""}
                            </Box>
                        }
                    </SpaceBetween>
                </Container>


                <Tabs
                    tabs={[
                        {
                            label: "Logs",
                            id: "first",
                            content:
                                <>
                                    <LoadingErrorEmptyHandler
                                        isLoading={loading}
                                        isError={false}
                                        errorMessage={""}
                                        dataLength={logs?.length}>
                                        <LogInsightsTable logs={logs} logGroupName={selectedLogGroups.length === 1 ? selectedLogGroups[0].value || "" : ""} ></LogInsightsTable>
                                    </LoadingErrorEmptyHandler>
                                </>
                        },
                        {
                            label: "Visualization",
                            id: "second",
                            content: "TO-DO."
                        }
                    ]}
                />


            </SpaceBetween>
        </ContentLayout>


    </>
}