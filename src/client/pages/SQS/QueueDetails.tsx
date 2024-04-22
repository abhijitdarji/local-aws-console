import { ContentLayout, Header, SpaceBetween, Button, Box, ColumnLayout, Container, Tabs, StatusIndicator } from "@cloudscape-design/components";
import { useContext, useEffect, useState } from "react";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useParams } from "react-router-dom";
import { useCachedData } from "../../hooks/use-cached-data";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { DateUtils } from "../../utility/dates";
import CopyText from "../../components/CopyText";
import { ViewCode } from "../../components/ViewCode";
import RouterLink from "../../components/RouterLink";
import { LambdaTriggers } from "./LambdaTriggers";
import { RefreshButton } from "../../components/RefreshButton";
import { SnsSubscriptions } from "../../components/SnsSubscriptions";


export const QueueDetails = () => {

    const [queueDetails, setQueueDetails] = useState<any>({});
    const { queueUrl } = useParams();
    const { accountId, region } = useContext(GlobalContext) as GlobalContextType;
    const [queuePolicy, setQueuePolicy] = useState<any>(null);
    const [redrivePolicy, setRedrivePolicy] = useState<any>(null);
    const [deadLetterQueueUrl, setDeadLetterQueueUrl] = useState<string>('');

    const queueName = queueUrl?.split('/').pop();
    const defaultParams = {
        method: 'POST',
        url: '/aws/SQS/GetQueueAttributes',
        body: {
            AttributeNames: ['All'],
            QueueUrl: queueUrl
        },
        forceFetch: 0
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    const forceFetch = () => {
        setApiParams({ ...apiParams, forceFetch: apiParams.forceFetch + 1 });
    }

    useEffect(() => {
        setRedrivePolicy(null);
        setQueuePolicy(null);
        setApiParams(defaultParams);
    }, [queueUrl]);

    useEffect(() => {
        if (data?.Attributes) {
            setQueueDetails(data.Attributes);
            const queuePolicy = JSON.stringify(JSON.parse(data.Attributes.Policy || '{}'), null, 2);
            if (queuePolicy.length > 0) setQueuePolicy(queuePolicy);

            const redrivePolicy = JSON.parse(data.Attributes.RedrivePolicy || '{}');
            const deadLetterQueueName = redrivePolicy?.deadLetterTargetArn?.split(':').pop();
            const deadLetterQueueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${deadLetterQueueName}`
            if (Object.keys(redrivePolicy).length > 0) setRedrivePolicy(redrivePolicy);
            setDeadLetterQueueUrl(deadLetterQueueUrl);
        }
    }, [data]);

    const awsUrl = `https://${region}.console.aws.amazon.com/sqs/v3/home?region=${region}#/queues/${queueUrl}`;

    return <>
        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={Object.keys(queueDetails || {}).length}>
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
                    {queueName}
                </Header>}
            >

                <SpaceBetween size="l">

                    <Container>
                        <SpaceBetween size="l" direction="horizontal">
                            <Box variant="awsui-key-label">Type: <StatusIndicator type="success">{queueName?.endsWith('.fifo') ? 'FIFO' : 'Standard'}</StatusIndicator> </Box>
                            <Box variant="awsui-key-label">Created: {DateUtils.fomatTimestamp(queueDetails.CreatedTimestamp * 1000)}</Box>
                            <Box variant="awsui-key-label">Last Updated: {DateUtils.fomatTimestamp(queueDetails.LastModifiedTimestamp * 1000)}</Box>
                        </SpaceBetween>
                    </Container>

                    <Container>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">URL</Box>
                                <div>
                                    <CopyText
                                        iconOnly={true}
                                        copyText={queueUrl || ''}
                                        successText="URL copied"
                                        errorText="URL failed to copy"
                                    />
                                </div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">ARN</Box>
                                <div>
                                    <CopyText
                                        iconOnly={true}
                                        copyText={queueDetails.QueueArn}
                                        successText="ARN copied"
                                        errorText="ARN failed to copy"
                                    />
                                </div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Encryption</Box>
                                <div>{queueDetails.KmsMasterKeyId ? queueDetails.KmsMasterKeyId : 'None'}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Dead-letter queue</Box>
                                <div>
                                    {redrivePolicy ? (
                                        <>Enabled <RouterLink href={`/sqs/${encodeURIComponent(deadLetterQueueUrl)}`}>View</RouterLink></>
                                    ) : (
                                        "Disabled"
                                    )}
                                </div>
                                <Box variant="awsui-key-label">Max receive count</Box>
                                <div>{redrivePolicy ? `${redrivePolicy?.maxReceiveCount}` : "-"}</div>
                            </div>

                        </ColumnLayout>
                    </Container>

                    <Container>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">Default visibility timeout</Box>
                                <div>{DateUtils.formatDateAsWords(queueDetails.VisibilityTimeout)}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Message Retention period</Box>
                                <div>{DateUtils.formatDateAsWords(queueDetails.MessageRetentionPeriod)}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Delivery delay</Box>
                                <div>{queueDetails.DelaySeconds > 0 ? DateUtils.formatDateAsWords(queueDetails.DelaySeconds) : 0}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Receive message wait time</Box>
                                <div>{queueDetails.ReceiveMessageWaitTimeSeconds > 0 ? DateUtils.formatDateAsWords(queueDetails.ReceiveMessageWaitTimeSeconds) : 0}</div>
                            </div>

                        </ColumnLayout>
                    </Container>

                    <Container>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">Maximum message size</Box>
                                <div>{queueDetails.MaximumMessageSize / 1024} KB</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Messages Available</Box>
                                <div>{queueDetails.ApproximateNumberOfMessages}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Messages delayed</Box>
                                <div>{queueDetails.ApproximateNumberOfMessagesDelayed}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Messages in flight (not available to other consumers)</Box>
                                <div>{queueDetails.ApproximateNumberOfMessagesNotVisible}</div>
                            </div>
                        </ColumnLayout>
                    </Container>

                    {queueDetails.FifoQueue &&
                    <div className="focused-container">
                        <Container>
                            <ColumnLayout columns={4} variant="text-grid">
                                <div>
                                    <Box variant="awsui-key-label">FIFO throughput limit</Box>
                                    <div>{queueDetails.FifoThroughputLimit}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">High throughput FIFO</Box>
                                    <div>{queueDetails.ApproximateNumberOfMessagesDelayed}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Deduplication scope</Box>
                                    <div>{queueDetails.DeduplicationScope}</div>
                                </div>
                                <div>
                                    <Box variant="awsui-key-label">Content-based deduplication</Box>
                                    <div>{queueDetails.ContentBasedDeduplication}</div>
                                </div>
                            </ColumnLayout>
                        </Container>
                        </div>
                    }

                    <Tabs
                        tabs={[
                            {
                                label: "Lambda Triggers",
                                id: "triggers",
                                content: <LambdaTriggers eventSourceArn={queueDetails.QueueArn} />
                            },
                            {
                                label: "SNS subscriptions",
                                id: "snssub",
                                content: <SnsSubscriptions endpoint={queueDetails.QueueArn} />
                            },
                            {
                                label: "Access Policy",
                                id: "access",
                                content: <ViewCode height="400px" language="json" code={queuePolicy} />
                            }
                        ]}
                    />

                </SpaceBetween>


            </ContentLayout>
        </LoadingErrorEmptyHandler>
    </>

}