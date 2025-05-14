import { useState, useEffect, useContext } from "react";
import { Box, Button, ColumnLayout, Container, ContentLayout, Header, SpaceBetween, Tabs } from "@cloudscape-design/components";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterButton from "../../components/RouterButton";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { FileSize } from "../../components/FileSize"; // Import FileSize component

interface DdbTableDetailsProps {
    tableName: string;
    tableDetails: any;
}

const columnDef: ColumnDefinitionType[] = [
    {
        id: "IndexName",
        header: "Name",
        cell: item => item.IndexName,
        sortingField: "IndexName",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "IndexStatus",
        header: "Status",
        cell: item => item.IndexStatus,
        sortingField: "IndexStatus",
        visible: true
    },
    {
        id: "PartitionKey",
        header: "Partition Key",
        cell: item => item.KeySchema.find((key: any) => key.KeyType === 'HASH')?.AttributeName,
        // sortingField: "PartitionKey",
        visible: true
    },
    {
        id: "SortKey",
        header: "Sort Key",
        cell: item => item.KeySchema.find((key: any) => key.KeyType === 'RANGE')?.AttributeName,
        // sortingField: "SortKey",
        visible: true
    },
    {
        id: "ItemCount",
        header: "ItemCount",
        cell: item => item.ItemCount,
        sortingField: "ItemCount",
        visible: true
    },
    {
        id: "IndexSizeBytes",
        header: "Size",
        cell: item => <FileSize bytes={item.IndexSizeBytes} />,
        sortingField: "IndexSizeBytes",
        visible: true
    }
];

export const DdbTableDetails: React.FC<DdbTableDetailsProps> = ({ tableName, tableDetails }) => {

    const [details, setDetails] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;
    

    useEffect(() => {
        setDetails(tableDetails.Table);
    });

    // const { data, isLoading, isError, errorMessage } = useCachedData<any>({
    //     method: 'POST',
    //     url: '/aws/DynamoDB/DescribeTable',
    //     forceFetch: false,
    //     body: {
    //         TableName: tableName
    //     }
    // });


    // useEffect(() => {
    //     if (data?.Table) {
    //         console.log('Setting table details', data.Table);
    //         setDetails(data.Table);
    //     }
    // }, [data]);

    const getPartitionKey = () => {
        if (details?.KeySchema) {
            const keySchema: [{ AttributeName: string, KeyType: string }] = details.KeySchema;
            const partitionKey = keySchema.find(key => key.KeyType === 'HASH');
            // const sortKey = keySchema.find(key => key.KeyType === 'RANGE');

            if (partitionKey)
                return partitionKey.AttributeName;
        }
        return '-';
    }

    const getSortKey = () => {
        if (details?.KeySchema) {
            const keySchema: [{ AttributeName: string, KeyType: string }] = details.KeySchema;
            // const partitionKey = keySchema.find(key => key.KeyType === 'HASH');
            const sortKey = keySchema.find(key => key.KeyType === 'RANGE');

            if (sortKey)
                return sortKey.AttributeName;
        }
        return '-';
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#table?name=${tableName}&tab=overview`

    return <>

        <LoadingErrorEmptyHandler
            isLoading={false}
            isError={false}
            errorMessage={''}
            dataLength={Object.keys(details || {}).length}>

            <ContentLayout
                header={<Header
                    variant="h1"
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button
                                href={awsUrl}
                                iconAlign="right"
                                iconName="external"
                                target="_blank">View on AWS</Button>
                        </SpaceBetween>
                    }
                >
                    {details.TableName}
                </Header>}
            >

                <SpaceBetween size="xxl">

                    <RouterButton href={`/dynamodb/${tableName}?page=query`} variant="primary">Explore table items</RouterButton>

                    <Tabs
                        tabs={[
                            {
                                label: "Overview",
                                id: "first",
                                content: <>
                                    <SpaceBetween size="l">
                                        <Container
                                            header={
                                                <Header variant="h2">
                                                    General Information
                                                </Header>
                                            }
                                        >
                                            <ColumnLayout columns={4} variant="text-grid">
                                                <div>
                                                    <Box variant="awsui-key-label">Partition Key</Box>
                                                    <div>{getPartitionKey()}</div>
                                                </div>

                                                <div>
                                                    <Box variant="awsui-key-label">Sort Key</Box>
                                                    <div>{getSortKey()}</div>
                                                </div>
                                                <div>
                                                    <Box variant="awsui-key-label">Capacity Mode</Box>
                                                    <div></div>
                                                </div>
                                                <div>
                                                    <Box variant="awsui-key-label">Status</Box>
                                                    <div>{details.TableStatus}</div>
                                                </div>

                                            </ColumnLayout>
                                        </Container>

                                        <Container
                                            header={
                                                <Header variant="h2">
                                                    Items summary
                                                </Header>
                                            }
                                        >
                                            <ColumnLayout columns={2} variant="text-grid">
                                                <div>
                                                    <Box variant="awsui-key-label">Item count</Box>
                                                    <div>{details.ItemCount}</div>
                                                </div>

                                                <div>
                                                    <Box variant="awsui-key-label">Table size</Box>
                                                    <div><FileSize bytes={details.TableSizeBytes} /></div>
                                                </div>

                                            </ColumnLayout>
                                        </Container>

                                    </SpaceBetween>
                                </>
                            },
                            {
                                label: "Indexes",
                                id: "second",
                                content: <>
                                    <AppTable
                                        resourceName="Global secondary indexe"
                                        columnDef={columnDef}
                                        items={details.GlobalSecondaryIndexes}
                                        pageSize={20}
                                    // loading={loading}
                                    />
                                </>
                            }
                        ]}
                    />

                </SpaceBetween>

            </ContentLayout>
        </LoadingErrorEmptyHandler>

    </>
}