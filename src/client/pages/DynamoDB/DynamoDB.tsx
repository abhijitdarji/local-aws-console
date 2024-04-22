
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
        id: "TableName",
        header: "Table Name",
        cell: item => <RouterLink href={"/dynamodb/" + item.TableName} variant="secondary">{item.TableName}</RouterLink>,
        sortingField: "TableName",
        isRowHeader: true,
        visible: true,
        isKey: true
    }
];

export const DynamoDBHome = () => {
    const [tables, setTables] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/DynamoDB/ListTables',
        forceFetch: 0,
        body: {}
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.TableNames) {
            data.TableNames = data.TableNames.map((tableName: any) => {
                let t: any = {};
                t.TableName = tableName;
                return t;
            });

            setTables(data.TableNames);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#/tables`

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
                DynamoDB
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={tables?.length}>
                <AppTable
                    resourceName="Table"
                    columnDef={columnDef}
                    items={tables}
                    pageSize={20}
                />

            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};