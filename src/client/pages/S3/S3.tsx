
import React, { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";

const columnDef: ColumnDefinitionType[] = [
    {
        id: "BucketName",
        header: "Bucket Name",
        cell: item => <RouterLink href={"/s3/" + item.Name} variant="secondary">{item.Name}</RouterLink>,
        sortingField: "Name",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "CreationDate",
        header: "CreationDate",
        cell: item => item.CreationDate,
        sortingField: "CreationDate",
        visible: true
    }
];

export const S3Home: React.FC = () => {
    const [buckets, setBuckets] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultParams = {
        method: 'POST',
        url: '/aws/S3/ListBuckets',
        forceFetch: 0,
        body: {}
    }

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Buckets) {
            setBuckets(data.Buckets);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/s3/buckets?region=${region}&bucketType=general`

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
                S3
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={buckets?.length}
            >
                <AppTable
                    resourceName="Bucket"
                    columnDef={columnDef}
                    items={buckets}
                    pageSize={20}
                // loading={loading}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};