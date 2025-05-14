import React, { useState } from 'react';
import { Link, SpaceBetween, StatusIndicator } from '@cloudscape-design/components';
import { APIUtils } from '../utility/api';
import { NotificationContextValue } from '../context/NotificationsContext';

interface S3DownloadLinkProps {
    bucketName: string;
    s3Key: string;
    displayName: string;
    region: string;
    environment: string | undefined;
    notify: NotificationContextValue['notify'];
}

export const S3DownloadLink: React.FC<S3DownloadLinkProps> = ({
    bucketName,
    s3Key,
    displayName,
    region,
    environment,
    notify,
}) => {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const handleDownload = async () => {
        if (!bucketName) {
            notify({ type: 'error', content: 'Bucket name is missing for download.' });
            return;
        }
        setIsDownloading(true);

        const response = await APIUtils.getData<any>({
            method: 'POST',
            url: '/aws/S3/GetObject',
            body: {
                Bucket: bucketName,
                Key: s3Key,
            },
            region: region,
            environment: environment,
        });

        if (response.isError || !response.data || !response.data.Body) {
            const errorMessage = response.errorMessage || 'Failed to download file: Body is missing from the response.';
            console.error('Error downloading S3 object:', errorMessage, response.data);
            notify({ type: 'error', content: `Failed to download ${displayName}: ${errorMessage}` });
            setIsDownloading(false);
            return;
        }

        try {
            const bodyData = response.data.Body;
            const contentType = response.data.ContentType || 'application/octet-stream';
            let blobContentForDownload;

            // Check if bodyData is the serialized form of a Node.js Buffer
            // (e.g., { type: "Buffer", data: [byte, byte, ...] })
            if (bodyData && typeof bodyData === 'object' && bodyData.type === 'Buffer' && Array.isArray(bodyData.data)) {
                // Convert the array of byte values (bodyData.data) into a Uint8Array
                blobContentForDownload = new Uint8Array(bodyData.data);
            } else if (typeof bodyData === 'string') {
                // If it's already a string (e.g., for text files), we can use it directly
                blobContentForDownload = bodyData;
            } else {
                // Handle other unexpected formats or if bodyData is not what's expected
                console.error('Unexpected format for file content:', bodyData);
                notify({ type: 'error', content: `Failed to process file content for ${displayName}. Unexpected format.` });
                setIsDownloading(false);
                return;
            }

            const blob = new Blob([blobContentForDownload], { type: contentType });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = displayName || s3Key.split('/').pop() || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            notify({ type: 'success', content: `Successfully downloaded ${displayName}.` });
        } catch (error: any) {
            console.error('Error triggering download:', error);
            notify({ type: 'error', content: `An error occurred while downloading ${displayName}: ${error.message}` });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <SpaceBetween direction="horizontal" size="xs">
            <Link
                variant="secondary"
                onFollow={(e) => {
                    e.preventDefault();
                    if (!isDownloading) {
                        handleDownload();
                    }
                }}
            >
                {displayName}
            </Link>
            {isDownloading && <StatusIndicator type="loading">Downloading</StatusIndicator>}
        </SpaceBetween>
    );
};
