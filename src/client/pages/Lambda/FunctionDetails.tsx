/// <reference types="vite-plugin-svgr/client" />
import { useParams } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import {
    Box, SpaceBetween, Header, ContentLayout,
    Button, ColumnLayout, StatusIndicator, Container, ExpandableSection
} from "@cloudscape-design/components";
import CopyText from "../../components/CopyText";
import ZipSvg from "../../assets/zip.svg?react";
import ContainerImageSvg from "../../assets/container-image.svg?react";
import { KeyValueTable } from "../../components/KeyValueTable";
import { LambdaRuntimeIcon } from "../../components/LambdaRuntimeIcon";
import { DateUtils } from "../../utility/dates";
import { ViewRolePolicy } from "../../components/ViewRolePolicy";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { useCachedData } from "../../hooks/use-cached-data";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";
import { FileSize } from "../../components/FileSize"; // Import FileSize component

export const FunctionDetail = () => {

    const [functionDetails, setFunctionDetails] = useState<any>({});
    const [functionTags, setFunctionTags] = useState<any>({});
    const { region } = useContext(GlobalContext) as GlobalContextType;
    const { functionName } = useParams();

    const defaultParams = {
        method: 'POST',
        url: '/aws/Lambda/GetFunction',
        body: {
            FunctionName: functionName
        },
        forceFetch: 0,
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data?.Configuration) {
            setFunctionDetails(data.Configuration);
            setFunctionTags(data.Tags);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${functionName}?tab=code`

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={Object.keys(functionDetails || {}).length}>
            <ContentLayout
                header={<Header
                    variant="h1"
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <RefreshButton onClick={forceFetch} lastFetched={lastFetched} />
                            <CopyText
                                buttonText="Copy ARN"
                                copyText={functionDetails.FunctionArn}
                                copyButtonLabel="Copy ARN"
                                successText="ARN copied"
                                errorText="ARN failed to copy"
                            />
                            <Button
                                href={awsUrl}
                                iconAlign="right"
                                iconName="external"
                                target="_blank">View on AWS</Button>
                        </SpaceBetween>
                    }
                >
                    {functionName}
                </Header>}
            >

                <SpaceBetween size="l">

                    <Container>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">Runtime</Box>
                                <LambdaRuntimeIcon runtime={functionDetails.Runtime} />
                            </div>

                            <div>
                                <Box variant="awsui-key-label">Handler</Box>
                                <div>{functionDetails.Handler}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Memory</Box>
                                <div>{functionDetails.MemorySize}</div>
                            </div>
                            <div>
                                <Box variant="awsui-key-label">Timeout</Box>
                                <div>{functionDetails.Timeout}</div>
                            </div>

                        </ColumnLayout>
                    </Container>

                    <Container>
                        <ColumnLayout columns={4} variant="text-grid">
                            <div>
                                <Box variant="awsui-key-label">Last Modified &nbsp;
                                    <StatusIndicator type='success'>
                                        Success
                                    </StatusIndicator>
                                </Box>
                                <div>{DateUtils.formatDateAgo(functionDetails.LastModified)}</div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">ARN</Box>
                                <div><CopyText
                                    iconOnly={true}
                                    copyText={functionDetails.FunctionArn}
                                    successText="ARN copied"
                                    errorText="ARN failed to copy"
                                /></div>
                            </div>
                            <div>
                                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                    <div>
                                        <Box variant="awsui-key-label">Code Size</Box>
                                        <div><FileSize bytes={functionDetails.CodeSize} /></div>
                                    </div>
                                    <div>
                                        <Box variant="awsui-key-label">Package</Box>
                                        {functionDetails.PackageType?.toLowerCase() == "zip" ? <ZipSvg height={24} width={24} /> : <ContainerImageSvg height={24} width={24} />}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Box variant="awsui-key-label">Architectures</Box>
                                <div>{functionDetails.Architectures?.join(',')}</div>
                            </div>

                        </ColumnLayout>
                    </Container>

                    <Container
                        header={
                            <Header variant="h2">
                                Role
                            </Header>
                        }
                    >
                        <SpaceBetween size="l">
                            <div>{functionDetails.Role}</div>

                            <ExpandableSection
                                headerText="View role policy"
                            >
                                <ViewRolePolicy roleName={functionDetails.Role?.split('/').pop()} />
                            </ExpandableSection>
                        </SpaceBetween>
                    </Container>

                    <KeyValueTable headerText="Environment Variables" keyValueObject={functionDetails.Environment?.Variables || []} />

                    <ExpandableSection
                        headerText="Tags"
                        variant="container"
                    >
                        <KeyValueTable headerText="Total" keyValueObject={functionTags} variant="borderless" />
                    </ExpandableSection>

                </SpaceBetween>

            </ContentLayout>
        </LoadingErrorEmptyHandler>
    </>

}
