import React, { useState, useEffect, useContext } from "react";
import { AppTable, ColumnDefinitionType } from "../../components/AppTable";
import { useCachedData } from "../../hooks/use-cached-data";
import { ContentLayout, Header, SpaceBetween, Button, Link } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import RouterLink from "../../components/RouterLink";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { RefreshButton } from "../../components/RefreshButton";
import { useParams } from "react-router-dom";
import { NotificationContext, NotificationContextValue } from "../../context/NotificationsContext";
import { S3DownloadLink } from "../../components/S3DownloadLink";
import { FileSize } from "../../components/FileSize"; // Import the new component

const getColumnDefinitions = (
    bucketName?: string,
    currentPath?: string,
    region?: string,
    environment?: string | undefined,
    notify?: NotificationContextValue['notify']
): ColumnDefinitionType[] => [
    {
        id: "ObjectName",
        header: "Name",
        cell: item => {
            const displayName = item.Prefix.substring(currentPath ? currentPath.length : 0);
            if (item.Type === "Object") {
                if (bucketName && region && notify) {
                    return (
                        <S3DownloadLink
                            bucketName={bucketName}
                            s3Key={item.Prefix}
                            displayName={displayName}
                            region={region}
                            environment={environment}
                            notify={notify}
                        />
                    );
                }
                // Fallback or error display if essential props are missing
                return <Link variant="secondary">{displayName} (Download unavailable)</Link>;
            } else {
                return <RouterLink href={`/s3/${bucketName}/${item.Prefix}`} variant="secondary">{displayName}</RouterLink>;
            }
        },
        sortingField: "Prefix",
        isRowHeader: true,
        visible: true,
        isKey: true
    },
    {
        id: "Type",
        header: "Type",
        cell: item => item.Type,
        sortingField: "Type",
        visible: true
    },
    {
        id: "LastModified",
        header: "LastModified",
        cell: item => item.LastModified,
        sortingField: "LastModified",
        visible: true
    },
    {
        id: "Size",
        header: "Size",
        cell: item => <FileSize bytes={item.Size} />, // Use FileSize component
        sortingField: "Size",
        visible: true
    },
    {
        id: "StorageClass",
        header: "StorageClass",
        cell: item => item.StorageClass,
        sortingField: "StorageClass",
        visible: true
    }
];

export const BucketPrefixNavigator: React.FC = () => {
    const [bucketObjects, setBucketObjects] = useState<any[]>([]);
    const { bucketName, '*': objectPath } = useParams();
    const { region, environment } = useContext(GlobalContext) as GlobalContextType;
    const { notify } = useContext(NotificationContext) as NotificationContextValue;

    const [apiParams, setApiParams] = useState<any>({
        method: 'POST',
        url: '/aws/S3/ListObjectsV2',
        forceFetch: 0,
        body: {
            Bucket: bucketName,
            Prefix: objectPath ? objectPath : "",
            Delimiter: "/"
        }
    });

    const columnDef = getColumnDefinitions(bucketName, objectPath, region, environment, notify); // Pass new props

    useEffect(() => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1,
            body: {
                ...prevParams.body,
                Bucket: bucketName,
                Prefix: objectPath ? objectPath : ""
            }
        }));
    }, [bucketName, objectPath]);

    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any>(apiParams);

    useEffect(() => {
        let allItems: any[] = [];
        if (data?.CommonPrefixes) {
            const mappedPrefixes = data.CommonPrefixes.map((item: any) => ({
                ...item,
                Type: "Folder",
                LastModified: "",
                Size: "",
                StorageClass: ""
            }));
            allItems = allItems.concat(mappedPrefixes);
        }
        if (data?.Contents) {
            const filteredContents = data.Contents.filter((obj: any) => obj.Key !== objectPath || obj.Size > 0);
            const mappedObjects = filteredContents.map((object: any) => ({
                ...object,
                Type: "Object",
                Prefix: object.Key,
                LastModified: object.LastModified,
                Size: object.Size,
                StorageClass: object.StorageClass
            }));
            allItems = allItems.concat(mappedObjects);
        }
        
        if (data || (!isLoading && !isError)) {
            setBucketObjects(allItems);
        }
    }, [data, bucketName, objectPath, isLoading, isError]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/s3/buckets/${bucketName}${objectPath ? `/${objectPath}` : ''}?region=${region}&bucketType=general&tab=objects`

    const getDisplayPath = () => {
        const fullPath = `${bucketName}${objectPath ? `/${objectPath}` : ""}`;
        const maxLength = 60; // 20 (start) + 40 (end)
        const firstChars = 20;
        const lastChars = 40;

        if (fullPath.length > maxLength) {
            return `${fullPath.substring(0, firstChars)}...${fullPath.substring(fullPath.length - lastChars)}`;
        }
        return fullPath;
    };

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
                {getDisplayPath()}
            </Header>}
        >
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={bucketObjects?.length}
            >
                <AppTable
                    resourceName="Object"
                    columnDef={columnDef}
                    items={bucketObjects}
                    pageSize={20}
                />
            </LoadingErrorEmptyHandler>
        </ContentLayout>

    </>
};