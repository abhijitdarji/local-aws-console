import { useContext, useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useCachedData } from "../../hooks/use-cached-data";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { Button, ContentLayout, Header, SpaceBetween, StatusIndicator } from "@cloudscape-design/components";
import { useParams } from "react-router-dom";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { RefreshButton } from "../../components/RefreshButton";
import RouterLink from "../../components/RouterLink";


const columnDef: ColumnDefinitionType[] = [
    {
        id: "PhysicalResourceId",
        header: "PhysicalResourceId",
        cell: (item) => {
                switch(item.ResourceType) {
                    case "AWS::Lambda::Function":
                        return <RouterLink href={`/lambda/${item.PhysicalResourceId}`}>{item.PhysicalResourceId}</RouterLink>;
                    case "AWS::DynamoDB::Table":
                        return <RouterLink href={`/dynamoDB/${item.PhysicalResourceId}`}>{item.PhysicalResourceId}</RouterLink>;
                    case "AWS::SQS::Queue":
                        return <RouterLink href={`/sqs/${encodeURIComponent(item.PhysicalResourceId)}`}>{item.PhysicalResourceId}</RouterLink>;
                    case "AWS::SNS::Topic":
                        return <RouterLink href={`/sns/${item.PhysicalResourceId}`}>{item.PhysicalResourceId}</RouterLink>;
                    default:
                        return item.ResourceType;
                }
        },
        sortingField: "PhysicalResourceId",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "ResourceType",
        header: "ResourceType",
        cell: item => item.ResourceType,
        sortingField: "ResourceType",
        visible: true
    },
    {
        id: "LastUpdatedTimestamp",
        header: "LastUpdated",
        cell: item => item.LastUpdatedTimestamp,
        sortingField: "LastUpdatedTimestamp",
        visible: true
    },
    {
        id: "ResourceStatus",
        header: "Status",
        cell: item => item.ResourceStatus.indexOf('COMPLETE') > -1 ? <StatusIndicator type="success">{item.ResourceStatus}</StatusIndicator> : <StatusIndicator type="error">{item.ResourceStatus}</StatusIndicator>,
        sortingField: "ResourceStatus",
        visible: true
    }
];

export const StackResources = () => {

    const [resources, setResources] = useState<any>(null);
    const { region } = useContext(GlobalContext) as GlobalContextType;
    const { stackId } = useParams();
    const stackName = stackId ? decodeURIComponent(stackId).split(":").pop()?.split('/')[1] : '';
    const defaultParams = {
        method: 'POST',
        url: '/aws/CloudFormation/ListStackResources',
        body: {
            StackName: stackName
        },
        forceFetch: 0
    }
    const [apiParams, setApiParams] = useState<any>(defaultParams);
    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.StackResourceSummaries) {
            setResources(data.StackResourceSummaries);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/stackinfo?filteringText=&filteringStatus=active&viewNested=true&hideStacks=false&stackId=${stackId}`

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={resources?.length}>

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
                    {stackName}
                </Header>}
            >
                <AppTable
                    resourceName="Stack resource"
                    columnDef={columnDef}
                    items={resources}
                    pageSize={20}
                />
            </ContentLayout>

        </LoadingErrorEmptyHandler>

    </>

}