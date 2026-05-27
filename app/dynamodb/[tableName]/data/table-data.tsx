'use client';

import { Alert, Button, ContentLayout, Header, SpaceBetween } from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import { DynamoTable } from '@/app/components/dynamo-table';
import { QueryType, ScanQuery } from '@/app/components/scan-query';
import { runAwsCommandSafe } from '@/app/lib/server/actions/aws';

type Props = {
  tableName: string;
  env: string;
  region: string;
  tableDetailsPromise: Promise<any>;
};

export function TableData({ tableName, env, region, tableDetailsPromise }: Props) {
  const tableDetails = use(tableDetailsPromise);
  const router = useRouter();

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<{
    type: QueryType;
    query: Record<string, unknown>;
  } | null>(null);
  const [appending, setAppending] = useState(false);

  const executeQuery = useCallback(
    async (type: QueryType, query: Record<string, unknown>, append: boolean) => {
      if (append) setAppending(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await runAwsCommandSafe({
          env,
          region,
          service: 'DynamoDB',
          command: type,
          options: query,
          allPages: false,
        });

        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        const data = result.data as any;
        const incoming: Record<string, unknown>[] = data?.Items ?? [];
        setItems(append ? (prev) => [...prev, ...incoming] : incoming);
        setLastEvaluatedKey((data?.LastEvaluatedKey as Record<string, unknown>) ?? null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        setAppending(false);
      }
    },
    [env, region],
  );

  const handleRunQuery = useCallback(
    (type: QueryType, query: Record<string, unknown>) => {
      setLastQuery({ type, query });
      void executeQuery(type, query, false);
    },
    [executeQuery],
  );

  // Auto-run a default Scan on first mount so the page shows data immediately,
  // matching the main-branch behavior. The user can still hit Reset/Run to
  // re-query with different parameters via the ScanQuery form.
  const didAutoScanRef = useRef(false);
  useEffect(() => {
    if (didAutoScanRef.current) return;
    didAutoScanRef.current = true;
    handleRunQuery(QueryType.SCAN, {
      TableName: tableName,
      Select: 'ALL_ATTRIBUTES',
      Limit: 50,
      ReturnConsumedCapacity: 'TOTAL',
    });
  }, [handleRunQuery, tableName]);

  const handleReset = () => {
    setItems([]);
    setLastEvaluatedKey(null);
    setLastQuery(null);
    setError(null);
  };

  const handleNextPage = () => {
    if (!lastQuery || !lastEvaluatedKey) return;
    void executeQuery(
      lastQuery.type,
      { ...lastQuery.query, ExclusiveStartKey: lastEvaluatedKey },
      true,
    );
  };

  const awsUrl = `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#item-explorer?maximize=true&operation=SCAN&table=${tableName}`;

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                onClick={() => router.push(`/dynamodb/${encodeURIComponent(tableName)}`)}
              >
                View table details
              </Button>
              <Button href={awsUrl} iconAlign="right" iconName="external" target="_blank">
                View on AWS
              </Button>
            </SpaceBetween>
          }
        >
          {tableName}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ScanQuery
          tableName={tableName}
          tableDetails={tableDetails}
          onRunQuery={handleRunQuery}
          onReset={handleReset}
        />

        {error && (
          <Alert type="error" header="Query error">
            {String(error)}
          </Alert>
        )}

        {(loading || appending || items.length > 0) && (
          <SpaceBetween size="m">
            {loading ? (
              <DynamoTable rawItems={[]} tableDetails={tableDetails} hasNextPage={false} />
            ) : (
              <DynamoTable
                rawItems={items}
                tableDetails={tableDetails}
                hasNextPage={!!lastEvaluatedKey}
              />
            )}

            {lastEvaluatedKey && !loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button loading={appending} onClick={handleNextPage}>
                  Next page
                </Button>
              </div>
            )}
          </SpaceBetween>
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}
