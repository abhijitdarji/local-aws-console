
import { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "StackName",
        header: "Stack Name",
        cell: item => <RouterLink href={"/cloudformation/" + encodeURIComponent(item.StackId)} variant="secondary">{item.StackName}</RouterLink>,
        sortingField: "StackName",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "TemplateDescription",
        header: "Description",
        cell: item => item.TemplateDescription,
        sortingField: "TemplateDescription",
        visible: true
    },
    {
        id: "LastUpdatedTime",
        header: "LastUpdatedTime",
        cell: item => item.LastUpdatedTime,
        sortingField: "LastUpdatedTime",
        visible: true
    },
    {
        id: 'StackStatus',
        header: 'StackStatus',
        cell: item => (
            <StatusIndicator type={item.StackStatus === 'DELETE_FAILED' ? 'error' : 'success'}>{item.StackStatus}</StatusIndicator>
        ),
        sortingField: 'StackStatus',
        visible: true
    },
];

export const CloudFormationHome = () => {
    const [stacks, setStacks] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/CloudFormation/ListStacks',
        forceFetch: false,
        body: {
            StackStatusFilter: [
                'CREATE_COMPLETE',
                'CREATE_IN_PROGRESS',
                'DELETE_IN_PROGRESS',
                'DELETE_FAILED',
                'ROLLBACK_IN_PROGRESS',
                'UPDATE_COMPLETE',
                'UPDATE_IN_PROGRESS',
                'UPDATE_ROLLBACK_COMPLETE',
                'UPDATE_ROLLBACK_IN_PROGRESS'
            ]
        }
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.StackSummaries) {
            setStacks(data.StackSummaries);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks`

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
                CloudFormation
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={stacks?.length}>

                <AppTable
                    resourceName="Stack"
                    columnDef={columnDef}
                    items={stacks}
                    pageSize={20}
                />
            </LoadingErrorEmptyHandler>

        </ContentLayout>

    </>
};