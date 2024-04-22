import { ContentLayout, Header, SpaceBetween, Button, Box, ColumnLayout, Container, Tabs, StatusIndicator } from "@cloudscape-design/components";
import { useContext, useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useParams } from "react-router-dom";
import { useCachedData } from "../../hooks/use-cached-data";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import CopyText from "../../components/CopyText";
import { ViewCode } from "../../components/ViewCode";
import { RefreshButton } from "../../components/RefreshButton";
import { TopicSubscriptions } from "./TopicSubscriptions";


export const TopicDetails = () => {

    const [topicDetails, setTopicDetails] = useState<any>({});
    const { topicArn } = useParams();
    const topicName = topicArn?.split(':').pop();
    const { accountId, region } = useContext(GlobalContext) as GlobalContextType;
    const [topicPolicy, setTopicPolicy] = useState<any>(null);
    const [deliveryPolicy, setDeliveryPolicy] = useState<any>(null);

    const defaultParams = {
        method: 'POST',
        url: '/aws/SNS/GetTopicAttributes',
        body: {
            TopicArn: topicArn
        },
        forceFetch: 0
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    const forceFetch = () => {
        setApiParams({ ...apiParams, forceFetch: apiParams.forceFetch + 1 });
    }

    useEffect(() => {
        setTopicPolicy(null);
        setApiParams(defaultParams);
    }, [topicArn]);

    useEffect(() => {
        if (data?.Attributes) {
            setTopicDetails(data.Attributes);
            const queuePolicy = JSON.stringify(JSON.parse(data.Attributes.Policy || '{}'), null, 2);
            if (queuePolicy.length > 0) setTopicPolicy(queuePolicy);
            const deliveryPolicy = JSON.stringify(JSON.parse(data.Attributes.EffectiveDeliveryPolicy || '{}'), null, 2);
            if (deliveryPolicy.length > 0) setDeliveryPolicy(deliveryPolicy);
        }
    }, [data]);

    const awsUrl = `https://${region}.console.aws.amazon.com/sns/v3/home?region=${region}#/topic/${topicArn}`;

    return <>
        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={Object.keys(topicDetails || {}).length}>
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
                    {topicName}
                </Header>}
            >

                <SpaceBetween size="l">

                    <Container>
                        <SpaceBetween size="l" direction="horizontal">
                            <Box variant="awsui-key-label">Type: <StatusIndicator type="success">{topicName?.endsWith('.fifo') ? 'FIFO' : 'Standard'}</StatusIndicator> </Box>
                        </SpaceBetween>
                    </Container>

                    <Container>
                        <ColumnLayout columns={2} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">ARN</Box>
                                <div>
                                    <CopyText
                                        iconOnly={true}
                                        copyText={topicDetails.TopicArn}
                                        successText="ARN copied"
                                        errorText="ARN failed to copy"
                                    />
                                </div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Encryption</Box>
                                <div>{topicDetails.KmsMasterKeyId ? topicDetails.KmsMasterKeyId : 'None'}</div>
                            </div>
                        </ColumnLayout>
                    </Container>

                    <Container>
                        <ColumnLayout columns={2} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">Topic owner</Box>
                                <div>{topicDetails.Owner}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Display name</Box>
                                <div>{topicDetails.DisplayName}</div>
                            </div>
                        </ColumnLayout>
                    </Container>

                    {topicDetails.FifoTopic &&
                        <div className="focused-container">
                            <Container>
                                <ColumnLayout columns={2} variant="text-grid">
                                    <div>
                                        <Box variant="awsui-key-label">FIFO</Box>
                                        <div>true</div>
                                    </div>
                                    <div>
                                        <Box variant="awsui-key-label">Content based deduplication</Box>
                                        <div>{topicDetails.ContentBasedDeduplication}</div>
                                    </div>
                                </ColumnLayout>
                            </Container>
                        </div>
                    }

                    <Tabs
                        tabs={[
                            {
                                label: "Subscriptions",
                                id: "sub",
                                content: <>{topicArn && <TopicSubscriptions topicArn={topicArn || ''} />}</>
                            },
                            {
                                label: "Access Policy",
                                id: "access",
                                content: <ViewCode height="400px" language="json" code={topicPolicy} />
                            },
                            {
                                label: "Delivery Policy",
                                id: "delivery",
                                content: <ViewCode height="400px" language="json" code={deliveryPolicy} />
                            }
                        ]}
                    />

                </SpaceBetween>


            </ContentLayout>
        </LoadingErrorEmptyHandler>
    </>

}