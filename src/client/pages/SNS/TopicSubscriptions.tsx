import { useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useCachedData } from "../../hooks/use-cached-data";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";

interface TopicSubscriptionsProps {
    topicArn: string;
}

const columnDef: ColumnDefinitionType[] = [
    {
        id: "Endpoint",
        header: "Endpoint",
        cell: item => item.Endpoint,
        sortingField: "Endpoint",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "Protocol",
        header: "Protocol",
        cell: item => item.Protocol,
        sortingField: "Protocol",
        visible: true
    },
    {
        id: "Owner",
        header: "Owner",
        cell: item => item.Owner,
        sortingField: "Owner",
        visible: true
    }
];

export const TopicSubscriptions = (props: TopicSubscriptionsProps) => {

    const [subscriptions, setSubscriptions] = useState<any>(null);
    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/SNS/ListSubscriptionsByTopic',
        body: {
            "TopicArn": props.topicArn
        },
        forceFetch: 0
    });

    useEffect(() => {
        if (data?.Subscriptions) {
            setSubscriptions(data.Subscriptions);
        }
    }, [data]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={subscriptions?.length}>

            <AppTable
                resourceName="Subscription"
                columnDef={columnDef}
                items={subscriptions}
                pageSize={20}
            />

        </LoadingErrorEmptyHandler>

    </>

}