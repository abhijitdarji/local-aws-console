'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDefinitionType } from '@/app/components/app-table';
import { FileSize } from '@/app/components/file-size';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { runAwsCommandSafe } from '@/app/lib/server/actions/aws';

const _s3Cache = new Map<string, { data: unknown; time: number }>();
const CACHE_TTL_MS = 30 * 60_000;

function makeColumns(
  bucketName: string,
  currentPrefix: string,
  environment: string,
  region: string,
): ColumnDefinitionType[] {
  return [
    {
      id: 'Key',
      header: 'Name',
      cell: (item: any) => {
        if (item._type === 'prefix') {
          // Strip the current prefix so we show only the relative folder name.
          const displayName = (item.Prefix as string).substring(currentPrefix.length);
          // Split S3 prefix on '/', encode each segment individually so '/' stays
          // as a real path separator — NOT encoded as '%2F'.
          const encodedParts = (item.Prefix as string)
            .split('/')
            .filter(Boolean)
            .map(encodeURIComponent)
            .join('/');
          return (
            <Link href={`/s3/${encodeURIComponent(bucketName)}/${encodedParts}/`}>
              {displayName}
            </Link>
          );
        }
        // Strip current prefix from object keys to show the bare filename.
        const displayName = (item.Key as string).substring(currentPrefix.length);
        const downloadUrl = `/api/s3/download?env=${encodeURIComponent(environment)}&region=${encodeURIComponent(region)}&bucket=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(item.Key)}`;
        return (
          <a href={downloadUrl} download>
            {displayName}
          </a>
        );
      },
      sortingField: 'Key',
      isRowHeader: true,
      visible: true,
      isKey: true,
    },
    {
      id: 'Type',
      header: 'Type',
      cell: (item: any) => (item._type === 'prefix' ? 'Folder' : 'Object'),
      sortingField: '_type',
      visible: true,
    },
    {
      id: 'Size',
      header: 'Size',
      cell: (item: any) => (item._type === 'prefix' ? '—' : <FileSize bytes={item.Size} />),
      sortingField: 'Size',
      visible: true,
    },
    {
      id: 'StorageClass',
      header: 'Storage Class',
      cell: (item: any) => (item._type === 'prefix' ? '—' : (item.StorageClass ?? '—')),
      sortingField: 'StorageClass',
      visible: true,
    },
    {
      id: 'LastModified',
      header: 'Last Modified',
      cell: (item: any) => (item.LastModified ? new Date(item.LastModified).toLocaleString() : '—'),
      sortingField: 'LastModified',
      visible: true,
    },
  ];
}

export default function S3BucketPage() {
  const { bucketName: encodedBucket, prefix: prefixSegments } = useParams<{
    bucketName: string;
    prefix: string[];
  }>();
  const decoded = decodeURIComponent(encodedBucket);
  const prefix = prefixSegments?.length
    ? prefixSegments.map(decodeURIComponent).join('/') + '/'
    : '';

  const environment = useAppStore((s) => s.environment);
  const region = useAppStore((s) => s.region);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const doFetch = useCallback(
    (bust: boolean) => {
      if (!environment || !region) return;
      const key = `${environment}:${region}:s3:${decoded}:${prefix}`;
      const cached = _s3Cache.get(key);
      if (!bust && cached && Date.now() - cached.time < CACHE_TTL_MS) {
        const d = cached.data as any;
        const prefixes = (d.CommonPrefixes ?? []).map((p: any) => ({
          ...p,
          _type: 'prefix',
          Key: p.Prefix,
        }));
        const objects = (d.Contents ?? [])
          .filter((obj: any) => obj.Key !== prefix || obj.Size > 0)
          .map((obj: any) => ({ ...obj, _type: 'object' }));
        setItems([...prefixes, ...objects]);
        setLastFetched(cached.time);
        return;
      }
      setLoading(true);
      setError(null);
      runAwsCommandSafe({
        env: environment,
        region,
        service: 'S3',
        command: 'ListObjectsV2',
        options: { Bucket: decoded, Prefix: prefix, Delimiter: '/' },
      })
        .then((result) => {
          if (!result.ok) {
            setError(result.error.message);
            return;
          }
          const d: any = result.data;
          const now = Date.now();
          _s3Cache.set(key, { data: d, time: now });
          const prefixes = (d.CommonPrefixes ?? []).map((p: any) => ({
            ...p,
            _type: 'prefix',
            Key: p.Prefix,
          }));
          // Filter out 0-byte folder-marker objects (key === current prefix)
          const objects = (d.Contents ?? [])
            .filter((obj: any) => obj.Key !== prefix || obj.Size > 0)
            .map((obj: any) => ({ ...obj, _type: 'object' }));
          setItems([...prefixes, ...objects]);
          setLastFetched(now);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false));
    },
    [environment, region, decoded, prefix],
  );

  useEffect(() => {
    doFetch(false);
  }, [doFetch]);

  const refresh = useCallback(() => {
    const key = `${environment}:${region}:s3:${decoded}:${prefix}`;
    _s3Cache.delete(key);
    doFetch(true);
  }, [doFetch, environment, region, decoded, prefix]);

  const columns = useMemo(
    () => makeColumns(decoded, prefix, environment, region),
    [decoded, prefix, environment, region],
  );

  return (
    <ResourceListPage
      title={`${decoded}${prefix ? ` / ${prefix}` : ''}`}
      resourceName="Object"
      awsConsoleUrl={`https://s3.console.aws.amazon.com/s3/buckets/${decoded}?region=${region}&prefix=${prefix}`}
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      lastFetched={lastFetched}
      onRefresh={refresh}
    />
  );
}
