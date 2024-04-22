
import React, { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { FavoritesButton } from "../../components/FavoritesButton";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "TopicName",
        header: "Topic Name",
        cell: item => <RouterLink href={"/sns/" + item.TopicArn} variant="secondary">{item.TopicName}</RouterLink>,
        sortingField: "TopicName",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "Type",
        header: "Type",
        cell: item => item.Type,
        sortingField: "Type",
        visible: true
    },
    {
        id: "TopicArn",
        header: "TopicArn",
        cell: item => item.TopicArn,
        sortingField: "TopicArn",
        visible: true
    }
];

export const SNSHome: React.FC = () => {
    const [topics, setTopics] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/SNS/ListTopics',
        forceFetch: 0,
        body: {}
    }

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Topics) {
            data.Topics.map((topic: any) => {
                let topicArn: string = topic.TopicArn;
                topic.TopicName = topicArn.split(':').pop();
                topic.Type = topicArn.endsWith('.fifo') ? 'FIFO' : 'Standard';
            });
            setTopics(data.Topics);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/sns/v3/home?region=${region}#/queues`

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
                SNS
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={topics?.length}
            >
                <AppTable
                    resourceName="Topic"
                    columnDef={columnDef}
                    items={topics}
                    pageSize={20}
                // loading={loading}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};