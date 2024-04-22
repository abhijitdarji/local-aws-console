
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
        id: "QueueName",
        header: "Queue Name",
        cell: item => <RouterLink href={`/sqs/${encodeURIComponent(item.QueueUrl)}`} variant="secondary">{item.QueueName}</RouterLink>,
        sortingField: "QueueName",
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
        id: "QueueUrl",
        header: "QueueUrl",
        cell: item => item.QueueUrl,
        sortingField: "QueueUrl",
        visible: true
    }
];

export const SQSHome = () => {
    const [queues, setQueues] = useState<any>([]);
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/SQS/ListQueues',
        forceFetch: 0,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.QueueUrls) {
            data.QueueUrls = data.QueueUrls.map((url: any) => {
                let q: any = {};
                q.QueueUrl = url;
                q.QueueName = url.split('/').pop();
                q.Type = q.QueueName.endsWith('.fifo') ? 'FIFO' : 'Standard';
                return q;
            });
            setQueues(data.QueueUrls);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/sqs/v3/home?region=${region}#/queues`

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
                SQS
            </Header>}
        >

            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={queues?.length}>
                <AppTable
                    resourceName="Topic"
                    columnDef={columnDef}
                    items={queues}
                    pageSize={20}
                // loading={loading}
                />

            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};