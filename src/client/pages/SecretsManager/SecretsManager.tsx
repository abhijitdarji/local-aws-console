
import { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import RouterLink from "../../components/RouterLink";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "Name",
        header: "Name",
        cell: item => <RouterLink href={"/secretsmanager/" + encodeURIComponent(item.Name)} variant="secondary">{item.Name}</RouterLink>,
        sortingField: "Name",
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
        id: "LastChangedDate",
        header: "Last Changed",
        cell: item => item.LastChangedDate,
        sortingField: "LastChangedDate",
        visible: true
    },
    {
        id: "LastAccessedDate",
        header: "Last Accessed",
        cell: item => item.LastAccessedDate,
        sortingField: "LastAccessedDate",
        visible: true
    }
];

export const SecretsManagerHome = () => {
    const [secrets, setSecrets] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/SecretsManager/ListSecrets',
        forceFetch: false,
        fetchAllPages: true,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.SecretList){
            setSecrets(data.SecretList);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/secretsmanager/listsecrets?region=${region}`

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
                SecretsManager
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={secrets?.length}>
                <AppTable
                    resourceName="Secret"
                    columnDef={columnDef}
                    items={secrets}
                    pageSize={20}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};