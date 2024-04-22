import { useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useCachedData } from "../../hooks/use-cached-data";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import RouterLink from "../../components/RouterLink";
import { StatusIndicator } from "@cloudscape-design/components";

interface LambdaTriggersProps {
    eventSourceArn: string;
}

const columnDef: ColumnDefinitionType[] = [
    {
        id: "UUID",
        header: "UUID",
        cell: item => item.UUID,
        sortingField: "UUID",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "ARN",
        header: "ARN",
        cell: item => <RouterLink href={`/lambda/${item.FunctionArn.split(':').pop()}`} variant="secondary">{item.FunctionArn}</RouterLink>,
        sortingField: "FunctionArn",
        visible: true
    },
    {
        id: "Status",
        header: "Status",
        cell: item => item.State === 'Enabled' ? <StatusIndicator type="success">Enabled</StatusIndicator> : <StatusIndicator type="error">Disabled</StatusIndicator>,
        sortingField: "State",
        visible: true
    },
    {
        id: "LastModified",
        header: "LastModified",
        cell: item => item.LastModified,
        sortingField: "LastModified",
        visible: true
    },
    {
        id: "BatchSize",
        header: "BatchSize",
        cell: item => item.BatchSize,
        sortingField: "BatchSize",
        visible: true
    }
];


export const LambdaTriggers = (props: LambdaTriggersProps) => {

    const [triggers, setTriggers] = useState<any[]>([]);
    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/Lambda/ListEventSourceMappings',
        body: {
            EventSourceArn: props.eventSourceArn
        },
        forceFetch: 0
    });

    useEffect(() => {
        if (data?.EventSourceMappings?.length) {
            setTriggers(data.EventSourceMappings);
        }
    }, [data]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={triggers?.length}>

            <AppTable
                resourceName="Lambda Trigger"
                columnDef={columnDef}
                items={triggers}
                pageSize={20}
            />

        </LoadingErrorEmptyHandler>

    </>

}