import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import RouterButton from "../../components/RouterButton";
import { useContext, useEffect, useState } from "react";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { useCachedData } from "../../hooks/use-cached-data";
import { QueryType, ScanQuery } from "./ScanQuery";
import { DynamoTable } from "../../components/DynamoTable";

interface DdbTableItemsProps {
    tableName: string;
    tableDetails: any;
}

export const DdbTableItems: React.FC<DdbTableItemsProps> = (props) => {
    const [items, setItems] = useState<any>([]);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const { region } = useContext(GlobalContext) as GlobalContextType;

    const defaultQuery = {
        TableName: props.tableName,
        Select: 'ALL_ATTRIBUTES',
        Limit: 50,
        ReturnConsumedCapacity: 'TOTAL'
    };
    const [lastType, setLastType] = useState<string>(QueryType.SCAN);
    const [lastQuery, setLastQuery] = useState<object>(defaultQuery);
    const [appendItems, setAppendItems] = useState<boolean>(false);

    const scanApiParams = {
        method: 'POST',
        url: '/aws/DynamoDB/Scan',
        forceFetch: false,
        body: defaultQuery
    };
    const [apiParams, setApiParams] = useState<any>(scanApiParams);

    const { data, isLoading, isError, errorMessage } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Items) {
            if (appendItems) {
                setItems((prevItems: any) => [...prevItems, ...data.Items]);
            } else {
                setItems(data.Items);
            }
            setHasNextPage(data.LastEvaluatedKey ? true : false);
        }
    }, [data]);


    const runQuery = (type: string, query: object) => {
        setApiParams({
            method: 'POST',
            url: `/aws/DynamoDB/${type}`,
            forceFetch: true,
            body: {
                ...query
            }
        });
    }

    const onRunQuery = (type: string, query: object) => {
        setLastType(type);
        setLastQuery(query);
        setAppendItems(false);
        runQuery(type, query);
    }

    const onNextPage = () => {
        if (!data.LastEvaluatedKey) {
            return;
        }

        setAppendItems(true);

        runQuery(lastType, {
            ...lastQuery,
            ExclusiveStartKey: data.LastEvaluatedKey
        })
    }

    const onResetQuery = () => {
        console.log('Reset query');
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#item-explorer?maximize=true&operation=SCAN&table=${props.tableName}`

    return <>


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
                {props.tableName}
            </Header>}
        >

            <SpaceBetween size="l">

                <RouterButton href={`/dynamodb/${props.tableName}`} variant="primary">View table details</RouterButton>

                <ScanQuery {...props} onRunQuery={onRunQuery} onResetQuery={onResetQuery} />

                {hasNextPage &&
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                        <Button onClick={onNextPage}>Next Page</Button>
                    </div>}

                <LoadingErrorEmptyHandler
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    dataLength={items?.length}>
                    <DynamoTable items={items} tableDetails={props.tableDetails} hasNextPage={hasNextPage} />
                </LoadingErrorEmptyHandler>

            </SpaceBetween>


        </ContentLayout>

    </>
}