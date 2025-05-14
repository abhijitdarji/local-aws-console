import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { FileSize } from "../../components/FileSize"; // Import FileSize component

const columnDef: ColumnDefinitionType[] = [
    {
        id: "logStreamName",
        header: "Log Stream",
        cell: item => <RouterLink href={"/cloudwatchlogs/" + encodeURIComponent(item.logGroupName) + "/" + encodeURIComponent(item.logStreamName)} variant="secondary">{item.logStreamName}</RouterLink>,
        sortingField: "logStreamName",
        isRowHeader: true,
        visible: true,
        isKey: true,
        width: 500
    },
    {
        id: "lastEventTimestamp",
        header: "Last Event",
        cell: item => item.lastEventTimestamp ? new Date(item.lastEventTimestamp).toISOString().replace('T', ' ').replace('Z', ''): '',
        sortingField: "lastEventTimestamp",
        visible: true,
        width: 200
    },
    {
        id: "firstEventTimestamp",
        header: "First Event",
        cell: item => item.firstEventTimestamp ? new Date(item.firstEventTimestamp).toISOString().replace('T', ' ').replace('Z', '') : '',
        sortingField: "firstEventTimestamp",
        visible: true,
        width: 200
    },
    {
        id: "storedBytes",
        header: "Storage",
        cell: item => <FileSize bytes={item.storedBytes} />,
        sortingField: "storedBytes",
        visible: true,
        width: 150
    }
];

export const LogStreams = () => {
    const [logStreams, setLogStreams] = useState<any>({});
    const { logGroupName } = useParams();
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/CloudWatchLogs/DescribeLogStreams',
        forceFetch: false,
        body: {
            logGroupName: logGroupName,
            descending: true
        }
    });

    useEffect(() => {
        if (data?.logStreams) {
            data.logStreams.map((stream: any) => {
                stream.logGroupName = logGroupName;
            });
            data.logStreams.sort((a: any, b: any) => {
                return new Date(b.lastEventTimestamp).getTime() - new Date(a.lastEventTimestamp).getTime();
            });
            setLogStreams(data.logStreams);
        }
    }, [data]);

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#/logsV2:log-groups/log-group/${logGroupName}`

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={logStreams?.length}>

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
                    {logGroupName}
                </Header>}
            >
                <AppTable
                    resourceName="LogStream"
                    columnDef={columnDef}
                    items={logStreams}
                    pageSize={20}
                // loading={loading}
                />
            </ContentLayout>
        </LoadingErrorEmptyHandler>

    </>
}