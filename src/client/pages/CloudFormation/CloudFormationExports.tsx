
import { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "Name",
        header: "Name",
        cell: item => item.Name,
        sortingField: "Name",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "Value",
        header: "Value",
        cell: item => item.Value,
        sortingField: "Value",
        visible: true
    },
    {
        id: "ExportingStackId",
        header: "Stack ARN",
        cell: item => item.ExportingStackId,
        sortingField: "ExportingStackId",
        visible: true
    }
];

export const CloudFormationExports = () => {
    const [exports, setExports] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/CloudFormation/ListExports',
        forceFetch: false,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Exports)
            setExports(data.Exports);
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/exports`

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
                dataLength={exports?.length}>
                <AppTable
                    resourceName="Export"
                    columnDef={columnDef}
                    items={exports}
                    pageSize={20}
                // loading={loading}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};