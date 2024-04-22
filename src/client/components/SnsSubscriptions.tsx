import { useEffect, useMemo, useState } from "react";
import { useCachedData } from "../hooks/use-cached-data";
import { ColumnDefinitionType, AppTable } from "./AppTable";
import { LoadingErrorEmptyHandler } from "./LoadingErrorEmptyHandler";

interface SnsSubscriptionsProps {
    endpoint: string;
}

const columnDef: ColumnDefinitionType[] = [
    {
        id: "TopicArn",
        header: "TopicArn",
        cell: item => item.TopicArn,
        sortingField: "TopicArn",
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

export const SnsSubscriptions = (props: SnsSubscriptionsProps) => {

    const [subscriptions, setSubscriptions] = useState<any>(null);
    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/SNS/ListSubscriptions',
        body: {},
        forceFetch: 0,
        fetchAllPages: true
    });

    const subscriptionsByEndpoint = useMemo(() => {
        let subscriptionsByEndpoint: any[] = [];
        if (subscriptions?.length && props.endpoint) {
            subscriptionsByEndpoint = subscriptions.filter((subscription: any) => subscription.Endpoint === props.endpoint);
        }
        return subscriptionsByEndpoint;
    }, [subscriptions, props.endpoint]);

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
                resourceName="SNS Subscription"
                columnDef={columnDef}
                items={subscriptionsByEndpoint}
                pageSize={20}
            />

        </LoadingErrorEmptyHandler>

    </>

}