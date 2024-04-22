
import { useState, useEffect } from "react";
import { useCachedData } from "../../hooks/use-cached-data";
import { Box, ExpandableSection, ColumnLayout, SpaceBetween } from "@cloudscape-design/components";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import CopyText from "../../components/CopyText";

interface SecretDetailsProps {
    secretId: string;
    forceFetch?: number;
}

export const SecretDetails = ({ secretId, forceFetch }: SecretDetailsProps) => {
    const [secret, setSecret] = useState<any>({});


    const defaultParams = {
        method: 'POST',
        url: '/aws/SecretsManager/DescribeSecret',
        forceFetch: false,
        body: {
            SecretId: secretId
        }
    };
    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data)
            setSecret(data);
    }, [data]);

    useEffect(() => {
        setApiParams({
            ...defaultParams,
            forceFetch: forceFetch
        });
    }, [forceFetch]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={Object.keys(secret || {}).length}>

            <ExpandableSection
                headerText="Secret Details"
                variant="container"
                defaultExpanded={true}
            >
                <ColumnLayout columns={2} variant="text-grid">
                    <div>
                        <SpaceBetween size="m">
                            <div>
                                <Box variant="awsui-key-label">Secret name</Box>
                                <CopyText
                                    iconOnly={true}
                                    copyText={secret.Name}
                                    successText="Name copied"
                                    errorText="Name failed to copy"
                                />
                            </div>

                            <div>
                                <Box variant="awsui-key-label">Secret ARN</Box>
                                <CopyText
                                    iconOnly={true}
                                    copyText={secret.ARN}
                                    successText="ARN copied"
                                    errorText="ARN failed to copy"
                                />
                            </div>
                        </SpaceBetween>
                    </div>
                    <div>
                        <SpaceBetween size="m">
                            <div>
                                <Box variant="awsui-key-label">Secret Description</Box>
                                <div>{secret.Description || '-'}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Encryption Key</Box>
                                <CopyText
                                    iconOnly={true}
                                    copyText={secret.KmsKeyId || '-'}
                                    successText="Key copied"
                                    errorText="Key failed to copy"
                                />
                            </div>

                        </SpaceBetween>
                    </div>
                </ColumnLayout>
            </ExpandableSection>

        </LoadingErrorEmptyHandler>

    </>
};