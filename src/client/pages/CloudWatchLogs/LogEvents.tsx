
import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useCachedData } from "../../hooks/use-cached-data";
import {
    ContentLayout, Header, SpaceBetween, Button, Box,
    ColumnLayout, Container, DateRangePicker, DateRangePickerProps, Input,
    ButtonDropdown, Select
} from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { LogEventsTable } from "../../components/LogEventsTable";
import { DateUtils } from '../../utility/dates';


export const LogEvents = () => {
    const [logEvents, setLogEvents] = useState<any[]>([]);
    const { logGroupName, logStreamName } = useParams();
    const { region } = useContext(GlobalContext) as GlobalContextType;
    const [dateRange, setDateRange] = useState<DateRangePickerProps.Value>({ key: "previous-5-minutes", amount: 5, unit: "minute", type: "relative" });
    const [filterText, setFilterText] = useState<string>('');
    const [selectedTimezone, setSelectedTimezone] = useState({ label: "Local timezone", value: "1" });
    const getAllLogEvents = {
        method: 'POST',
        url: '/aws/CloudWatchLogs/GetLogEvents',
        forceFetch: false,
        body: {
            logGroupName: logGroupName,
            logStreamName: logStreamName,
            limit: 200
        }
    }
    const [apiParams, setApiParams] = useState<any>(getAllLogEvents);
    const [plainText, setPlainText] = useState<boolean>(false);
    const [expandAllRows, setExpandAllRows] = useState<boolean>(false);

    let { data, isLoading, isError, errorMessage } = useCachedData<any>(apiParams);

    useEffect(() => {
        // console.log('Setting log events', data);
        if (data?.events) {
            data.events.map((event: any) => {
                event.isoTimestamp = DateUtils.formatDateAs(event.timestamp, DateUtils.LOG_TIMESTAMP_FORMAT);
            });
            data.events.sort((a: any, b: any) => {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
            setLogEvents(data.events);
        }
    }, [data]);

    const onTimezoneChange = (timezone: any) => {
        setSelectedTimezone(timezone);

        if (logEvents.length) {
            const updatedDates = logEvents.map((event: any) => {
                const tz = timezone.value === "1" ? DateUtils.getLocalTimeZone() : DateUtils.UTC_TZ;

                event.isoTimestamp = DateUtils.formatDateAsTz(event.timestamp, DateUtils.LOG_TIMESTAMP_FORMAT, tz);
                return event;
            });
            setLogEvents(updatedDates);
        }
    }

    const getFilteredEvents = () => {
        const { startTime, endTime } = DateUtils.calculateStartAndEndTimes(dateRange);

        if (!startTime && !endTime) {
            setApiParams(getAllLogEvents);
        } else {
            setApiParams({
                method: 'POST',
                url: '/aws/CloudWatchLogs/FilterLogEvents',
                forceFetch: true,
                body: {
                    logGroupName: logGroupName,
                    logStreamNames: [logStreamName],
                    filterPattern: filterText,
                    limit: 200,
                    startTime: startTime,
                    endTime: endTime
                }
            })
        }
    }

    const searchOnEnter = (e: any) => {
        if (e.detail.key === 'Enter') {
            getFilteredEvents();
        }
    };


    const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#/logsV2:log-groups/log-group/${logGroupName}/log-events/${logStreamName}`

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
                {logStreamName}
            </Header>}
        >

            <SpaceBetween size="m">

                <Container>
                    <ColumnLayout columns={2} variant="text-grid">
                        <div>
                            <Box>
                                <Input
                                    onKeyDown={searchOnEnter}
                                    onChange={({ detail }) => setFilterText(detail.value)}
                                    value={filterText}
                                    placeholder="Search"
                                    type="search" />
                            </Box>
                        </div>

                        <div>

                            <ColumnLayout columns={2} variant="text-grid">


                                <DateRangePicker
                                    onChange={({ detail }) => { setDateRange(detail.value!); getFilteredEvents(); }}
                                    value={dateRange}
                                    relativeOptions={[
                                        { key: "previous-5-minutes", amount: 5, unit: "minute", type: "relative" },
                                        { key: "previous-30-minutes", amount: 30, unit: "minute", type: "relative" },
                                        { key: "previous-1-hour", amount: 1, unit: "hour", type: "relative" },
                                        { key: "previous-6-hours", amount: 6, unit: "hour", type: "relative" }
                                    ]}
                                    isValidRange={() => ({ valid: true })}
                                    i18nStrings={{}}
                                    placeholder="Filter by a date and time range" />

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'end',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <Select
                                        selectedOption={selectedTimezone}
                                        onChange={({ detail }) => onTimezoneChange(detail.selectedOption)}
                                        options={[
                                            { label: "Local timezone", value: "1" },
                                            { label: "UTC timezone", value: "2" }
                                        ]} />

                                    
                                    <ButtonDropdown 
                                        variant="primary"
                                        items={[
                                            { text: "View in plain text", id: "plain-text", disabled:plainText },
                                            { text: "View in columns with details", id: "table", disabled:!plainText },
                                            { text: "Toggle expand all rows", id: "expand", disabled:plainText },
                                        ]}
                                        onItemClick={({ detail }) => {
                                            switch (detail.id) {
                                                case "plain-text":
                                                    setPlainText(true);
                                                    break;
                                                case "table":
                                                    setPlainText(false);
                                                    setExpandAllRows(false);
                                                    break;
                                                case "expand":
                                                    setExpandAllRows(!expandAllRows);
                                                    break;
                                                default:
                                                    break;
                                            }
                                        }}
                                    >Display</ButtonDropdown>

                                </div>

                            </ColumnLayout>
                        </div>

                    </ColumnLayout>
                </Container>

                <LoadingErrorEmptyHandler
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    dataLength={logEvents?.length}>

                    <LogEventsTable
                        headerText='Events'
                        logs={logEvents}
                        viewPlainText={plainText}
                        expandAllRows={expandAllRows}
                    />
                </LoadingErrorEmptyHandler>
            </SpaceBetween>

        </ContentLayout>

    </>
}
