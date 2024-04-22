
import { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "logGroupName",
        header: "Log Group",
        cell: item => <RouterLink href={"/cloudwatchlogs/" + encodeURIComponent(item.logGroupName)} variant="secondary">{item.logGroupName}</RouterLink>,
        sortingField: "logGroupName",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "logGroupClass",
        header: "Log Class",
        cell: item => item.logGroupClass,
        sortingField: "logGroupClass",
        visible: true,
        width: 150
    },
    {
        id: "metricFilterCount",
        header: "Metric Filters",
        cell: item => item.metricFilterCount,
        sortingField: "metricFilterCount",
        visible: true,
        width: 150
    },
    {
        id: "storedBytes",
        header: "Storage (GB)",
        cell: item => (item.storedBytes / 1024 / 1024 / 1024).toFixed(2),
        sortingField: "storedBytes",
        visible: true,
        width: 150
    },
    {
        id: "logGroupArn",
        header: "Arn",
        cell: item => item.logGroupArn,
        sortingField: "logGroupArn",
        visible: true,
        width: 250
    },
];

export const CloudWatchLogsHome = () => {
    const [logGroups, setLogGroups] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/CloudWatchLogs/DescribeLogGroups',
        forceFetch: 0,
        fetchAllPages: true,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.logGroups)
            setLogGroups(data.logGroups);
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#/logsV2:log-groups`

    return <>

        <ContentLayout
            header={<Header
                variant="h1"
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <RefreshButton onClick={forceFetch} lastFetched={lastFetched} />
                        <Button
                            href={awsUrl}
                            iconAlign="right"
                            iconName="external"
                            target="_blank">View on AWS</Button>
                    </SpaceBetween>
                }
            >
                CloudWatch Logs
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={logGroups?.length}>
                <AppTable
                    resourceName="LogGroup"
                    columnDef={columnDef}
                    items={logGroups}
                    pageSize={20}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};