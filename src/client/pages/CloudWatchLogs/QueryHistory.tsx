import { useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useCachedData } from "../../hooks/use-cached-data";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { DateUtils } from "../../utility/dates";
import { StatusIndicator } from "@cloudscape-design/components";
import CopyText from "../../components/CopyText";


const columnDef: ColumnDefinitionType[] = [
    {
        id: "createTime",
        header: "Last Run",
        cell: item => item.createTimeAgoFormat,
        sortingField: "createTime",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "queryString",
        header: "Query",
        cell: item => <div>
            <CopyText
                iconOnly={true}
                copyText={item.queryStringWithoutSource}
                successText="Query copied"
                errorText="Query failed to copy"
            />
        </div>,
        sortingField: "queryString",
        visible: true
    },
    {
        id: "logGroupNames",
        header: "Log Group",
        cell: item => item.logGroupNames,
        sortingField: "logGroupNames",
        visible: true
    },
    {
        id: "status",
        header: "Status",
        cell: item => item.status === 'Complete' ? <StatusIndicator type="success">Complete</StatusIndicator> : <StatusIndicator type="error">{item.status}</StatusIndicator>,
        sortingField: "status",
        visible: true
    }
];

export const QueryHistory = () => {

    const [queries, setQueries] = useState<any>(null);
    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/CloudWatchLogs/DescribeQueries',
        body: {},
        forceFetch: 0
    });

    useEffect(() => {
        if (data?.queries) {
            data.queries.map((query: any) => {
                query.createTimeAgoFormat = DateUtils.formatDateAgo(query.createTime)?.replace('about ', '');
                const queryStringArray = query.queryString.length > 0 ? query.queryString.split('|') : [];
                const logGroupNames = queryStringArray.filter((q: string) => q.trim().startsWith('SOURCE'))
                    .map((q: string) => {
                        const regex = /SOURCE\s+"([^"]+)"\s+START=(\S+)\s+END=(\S+)/;
                        const match = q.match(regex);
                        return match ? match[1] : '';
                    }).filter((name: string) => name).join(', ');
                query.logGroupNames = logGroupNames;
                query.queryStringWithoutSource = queryStringArray.length > 1 ? queryStringArray.filter((q: string) => !q.trim().startsWith('SOURCE')).join('|') : query.queryString;
                return query;
            });
            setQueries(data.queries);
        }
    }, [data]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={queries?.length}>

            <AppTable
                resourceName="Querie"
                columnDef={columnDef}
                items={queries}
                pageSize={20}
            />

        </LoadingErrorEmptyHandler>

    </>

}