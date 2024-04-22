import { useContext, useEffect, useState } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header } from "@cloudscape-design/components";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { useSearchParams } from "react-router-dom";
import { EnvironmentContext, EnvironmentContextType } from "../../context/EnvironmentContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "FunctionName",
        header: "Function Name",
        cell: item => <RouterLink href={"/lambda/" + item.FunctionName} variant="secondary">{item.FunctionName}</RouterLink>,
        sortingField: "FunctionName",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "Description",
        header: "Description",
        cell: item => item.Description,
        sortingField: "Description",
        visible: true
    },
    {
        id: "Runtime",
        header: "Runtime",
        cell: item => item.Runtime,
        sortingField: "Runtime",
        visible: true
    },
    {
        id: "LastModified",
        header: "LastModified",
        cell: item => new Date(item.LastModified).toISOString().replace('T', ' ').replace('Z', ''),
        sortingField: "LastModified",
        visible: true
    },
    {
        id: "MemorySize",
        header: "MemorySize",
        cell: item => item.MemorySize,
        sortingField: "MemorySize",
        visible: false
    },
    {
        id: "Timeout",
        header: "Timeout",
        cell: item => item.Timeout,
        sortingField: "Timeout",
        visible: false
    },
    // {
    //     id: 'state',
    //     sortingField: 'state',
    //     header: 'State',
    //     cell: item => (
    //       <StatusIndicator type={item.state === 'Deactivated' ? 'error' : 'success'}>{item.state}</StatusIndicator>
    //     ),
    //     minWidth: 120,
    //   },
];

export const LambdaHome = () => {
    const PAGE_KEY = 'lambda';
    const [functions, setFunctions] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;
    const { getFilter, saveFilter } = useContext(EnvironmentContext) as EnvironmentContextType;
    const [filter, setFilter] = useState(getFilter(PAGE_KEY) || '');
    const [searchParams, setSearchParams] = useSearchParams();

    const defaultParams = {
        method: 'POST',
        url: '/aws/Lambda/ListFunctions',
        forceFetch: 0,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Functions) {
            setFunctions(data.Functions);
        }
    }, [data]);

    useEffect(() => {
        setSearchParams({ ...searchParams, search: filter });
        saveFilter(PAGE_KEY, filter);
    }, [filter]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    // on filter change add the text to searchParams
    const onFilterChange = (item: any) => {
        setFilter(item);
    };

    const awsUrl = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions`;

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
                Lambda
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={functions?.length}>
                <AppTable
                    resourceName="Function"
                    columnDef={columnDef}
                    items={functions}
                    pageSize={20}
                    selectionType="single"
                    onFilterChange={onFilterChange}
                    defaultFilter={filter}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>
    </>
};