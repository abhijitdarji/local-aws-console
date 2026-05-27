'use client';

import {
  Box,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  DateRangePicker,
  type DateRangePickerProps,
  FormField,
  Header,
  Multiselect,
  type MultiselectProps,
  SpaceBetween,
  StatusIndicator,
  Tabs,
} from '@cloudscape-design/components';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LogInsightsTable } from '@/app/components/log-insights-table';
import { LogsInsightsEditor } from '@/app/components/logs-insights-editor';
import { QueryHistoryPanel } from '@/app/components/query-history-panel';
import { SavedQueriesPanel } from '@/app/components/saved-queries-panel';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { useLayoutStore } from '@/app/lib/client/store/layout-store';
import { DateUtils } from '@/app/lib/dates';
import {
  describeLogGroups,
  getQueryResults,
  startQueryMulti,
  stopQuery,
} from '@/app/lib/server/actions/cloudwatchlogs-actions';

const DEFAULT_QUERY = `fields @timestamp, @message
| filter @message like /error/
| limit 20`;

const DRAWER_HISTORY = 'cwl-insights-history';
const DRAWER_SAVED = 'cwl-insights-saved';

type QueryRunStatus = {
  status: string;
  statusType: 'success' | 'error' | 'in-progress';
  matches: number;
  scanned: number;
  bytes: number;
  timeLeft: number;
};

export default function LogInsightsPage() {
  const { environment, region } = useAppStore();
  const { setDrawers, setActiveDrawerId, activeDrawerId } = useLayoutStore();

  const [logGroupOptions, setLogGroupOptions] = useState<MultiselectProps.Options>([]);
  const [selectedLogGroups, setSelectedLogGroups] = useState<MultiselectProps.Option[]>([]);
  const [logGroupStatus, setLogGroupStatus] = useState<
    'loading' | 'error' | 'finished' | 'pending'
  >('finished');

  const [queryString, setQueryString] = useState(DEFAULT_QUERY);
  const [dateRange, setDateRange] = useState<DateRangePickerProps.Value>({
    key: 'previous-5-minutes',
    amount: 5,
    unit: 'minute',
    type: 'relative',
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState('');
  const [queryRunStatus, setQueryRunStatus] = useState<QueryRunStatus | null>(null);
  const isCancelledRef = useRef(false);

  const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:logs-insights`;

  // Register History + Saved Queries drawers
  useEffect(() => {
    setDrawers([
      {
        id: DRAWER_HISTORY,
        ariaLabels: { drawerName: 'Query History' },
        resizable: true,
        defaultSize: 620,
        content: (
          <div style={{ padding: '30px 30px 40px' }}>
            <QueryHistoryPanel
              environment={environment}
              region={region}
              onSelectQuery={(qs) => setQueryString(qs)}
            />
          </div>
        ),
        trigger: { iconName: 'insert-row' },
      },
      {
        id: DRAWER_SAVED,
        ariaLabels: { drawerName: 'Saved Queries' },
        resizable: true,
        defaultSize: 620,
        content: (
          <div style={{ padding: '30px 30px 40px' }}>
            <SavedQueriesPanel onSelectQuery={(qs) => setQueryString(qs)} />
          </div>
        ),
        trigger: { iconName: 'folder' },
      },
    ]);
    return () => setDrawers([]);
  }, [environment, region, setDrawers]);

  const loadLogGroups = useCallback(async () => {
    if (!environment || !region) return;
    setLogGroupStatus('loading');
    try {
      const result = await describeLogGroups(environment, region);
      if (!result.ok) {
        setLogGroupStatus('error');
        return;
      }
      const groups = (result.data as Record<string, unknown>).logGroups as Record<
        string,
        unknown
      >[];
      const options: MultiselectProps.Options = (groups ?? []).map((g) => ({
        label: String(g.logGroupName ?? ''),
        value: String(g.logGroupName ?? ''),
      }));
      setLogGroupOptions(options);
      setLogGroupStatus('finished');
    } catch {
      setLogGroupStatus('error');
    }
  }, [environment, region]);

  const runQuery = async () => {
    if (!environment || !region) return;
    if (selectedLogGroups.length === 0) return;

    const { startTime, endTime } = DateUtils.calculateStartAndEndTimes(dateRange as any);
    if (!startTime || !endTime) return;

    isCancelledRef.current = false;
    setLoading(true);
    setLogs([]);
    setQueryRunStatus(null);

    try {
      const startResult = await startQueryMulti(
        environment,
        region,
        selectedLogGroups.map((g) => g.value as string),
        queryString,
        startTime,
        endTime,
      );

      if (!startResult.ok) {
        throw new Error(startResult.error.message);
      }
      const qId = String((startResult.data as Record<string, unknown>).queryId ?? '');
      setActiveQueryId(qId);

      let response = await fetchQueryResults(qId);
      if (!response) return;

      while (true) {
        if (isCancelledRef.current) break;

        if (response.status === 'Complete') {
          setActiveQueryId('');
          setQueryRunStatus({
            status: response.status,
            statusType: 'success',
            matches: response.statistics?.recordsMatched ?? 0,
            scanned: response.statistics?.recordsScanned ?? 0,
            bytes: response.statistics?.bytesScanned ?? 0,
            timeLeft: 0,
          });
          setLogs(response.results ?? []);
          break;
        }

        if (['Failed', 'Cancelled', 'Timeout', 'Unknown'].includes(response.status)) {
          setActiveQueryId('');
          setQueryRunStatus({
            status: response.status,
            statusType: 'error',
            matches: 0,
            scanned: 0,
            bytes: 0,
            timeLeft: 0,
          });
          break;
        }

        if (['Running', 'Scheduled'].includes(response.status)) {
          const stats =
            (response.statistics as
              | { recordsMatched?: number; recordsScanned?: number; bytesScanned?: number }
              | undefined) ?? {};
          setQueryRunStatus({
            status: response.status,
            statusType: 'in-progress',
            matches: stats.recordsMatched ?? 0,
            scanned: stats.recordsScanned ?? 0,
            bytes: stats.bytesScanned ?? 0,
            timeLeft: 10,
          });

          await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
              if (isCancelledRef.current) {
                clearInterval(interval);
                resolve();
                return;
              }
              setQueryRunStatus((prev) =>
                prev ? { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) } : prev,
              );
            }, 1000);

            setTimeout(() => {
              if (!isCancelledRef.current) {
                clearInterval(interval);
                resolve();
              }
            }, 10_000);
          });

          if (isCancelledRef.current) break;
          response = await fetchQueryResults(qId);
          if (!response) break;
        }
      }
    } catch (e: unknown) {
      setQueryRunStatus({
        status: e instanceof Error ? e.message : String(e),
        statusType: 'error',
        matches: 0,
        scanned: 0,
        bytes: 0,
        timeLeft: 0,
      });
    } finally {
      setLoading(false);
      setActiveQueryId('');
    }
  };

  const fetchQueryResults = async (qId: string) => {
    try {
      const r = await getQueryResults(environment, region, qId);
      if (!r.ok) return null;
      return r.data as {
        status: string;
        results?: any[][];
        statistics?: { recordsMatched: number; recordsScanned: number; bytesScanned: number };
      };
    } catch {
      return null;
    }
  };

  const cancelQuery = async () => {
    if (!activeQueryId) return;
    isCancelledRef.current = true;
    try {
      await stopQuery(environment, region, activeQueryId);
    } catch {
      // ignore — may already be ended
    }
    setActiveQueryId('');
    setLoading(false);
  };

  const toggleHistory = () => {
    setActiveDrawerId(activeDrawerId === DRAWER_HISTORY ? null : DRAWER_HISTORY);
  };

  const toggleSaved = () => {
    setActiveDrawerId(activeDrawerId === DRAWER_SAVED ? null : DRAWER_SAVED);
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button href={awsUrl} iconAlign="right" iconName="external" target="_blank">
                View on AWS
              </Button>
            </SpaceBetween>
          }
        >
          Log Insights
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Container>
          <SpaceBetween size="xs">
            <ColumnLayout columns={2} variant="text-grid">
              <FormField label="Log groups" description="Select log groups to query." stretch>
                <Multiselect
                  onLoadItems={() => loadLogGroups()}
                  options={logGroupOptions}
                  selectedOptions={selectedLogGroups}
                  onChange={({ detail }) =>
                    setSelectedLogGroups(detail.selectedOptions as MultiselectProps.Option[])
                  }
                  statusType={logGroupStatus}
                  placeholder="Select up to 50 log groups"
                  loadingText="Loading log groups…"
                  errorText="Error fetching log groups."
                  recoveryText="Retry"
                  filteringType="auto"
                  tokenLimit={2}
                />
              </FormField>

              <FormField label="Time range">
                <SpaceBetween size="s">
                  <DateRangePicker
                    onChange={({ detail }) => setDateRange(detail.value!)}
                    value={dateRange}
                    relativeOptions={[
                      { key: 'previous-5-minutes', amount: 5, unit: 'minute', type: 'relative' },
                      { key: 'previous-30-minutes', amount: 30, unit: 'minute', type: 'relative' },
                      { key: 'previous-1-hour', amount: 1, unit: 'hour', type: 'relative' },
                      { key: 'previous-6-hours', amount: 6, unit: 'hour', type: 'relative' },
                      { key: 'previous-24-hours', amount: 24, unit: 'hour', type: 'relative' },
                    ]}
                    isValidRange={() => ({ valid: true })}
                    i18nStrings={{
                      relativeModeTitle: 'Relative range',
                      absoluteModeTitle: 'Absolute range',
                      relativeRangeSelectionHeading: 'Choose a range',
                      cancelButtonLabel: 'Cancel',
                      clearButtonLabel: 'Clear and dismiss',
                      applyButtonLabel: 'Apply',
                      customRelativeRangeOptionLabel: 'Custom range',
                      customRelativeRangeOptionDescription: 'Set a custom range in the past',
                      customRelativeRangeDurationLabel: 'Duration',
                      customRelativeRangeDurationPlaceholder: 'Enter duration',
                      customRelativeRangeUnitLabel: 'Unit of time',
                      formatRelativeRange: (v) =>
                        `Previous ${v.amount} ${v.unit}${v.amount !== 1 ? 's' : ''}`,
                      formatUnit: (unit, value) => (value === 1 ? unit : `${unit}s`),
                    }}
                    placeholder="Filter by date and time range"
                  />
                  {selectedLogGroups.length > 0 && (
                    <Button onClick={() => setSelectedLogGroups([])}>Clear selection</Button>
                  )}
                </SpaceBetween>
              </FormField>
            </ColumnLayout>

            <LogsInsightsEditor value={queryString} onChange={setQueryString} height={130} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  loading={loading}
                  disabled={activeQueryId.length > 0}
                  onClick={runQuery}
                >
                  Run query
                </Button>
                <Button disabled={activeQueryId.length === 0} onClick={cancelQuery}>
                  Cancel
                </Button>
                <Button onClick={toggleHistory}>History</Button>
              </SpaceBetween>
              <Button onClick={toggleSaved}>Saved Queries</Button>
            </div>

            {queryRunStatus && (
              <Box variant="awsui-key-label">
                Query status:{' '}
                <StatusIndicator type={queryRunStatus.statusType}>
                  {queryRunStatus.status}
                </StatusIndicator>
                {queryRunStatus.statusType !== 'error' && (
                  <span>
                    {', '}matches: {queryRunStatus.matches}, scanned: {queryRunStatus.scanned},
                    bytes: {(queryRunStatus.bytes / 1024).toFixed(2)} KB
                  </span>
                )}
                {queryRunStatus.timeLeft > 0 && (
                  <span> — checking again in {queryRunStatus.timeLeft}s</span>
                )}
              </Box>
            )}
          </SpaceBetween>
        </Container>

        <Tabs
          tabs={[
            {
              label: 'Logs',
              id: 'logs',
              content: (
                <>
                  {loading && logs.length === 0 && (
                    <Box textAlign="center" padding="l" color="text-status-inactive">
                      Running query…
                    </Box>
                  )}
                  {!loading && logs.length === 0 && queryRunStatus && (
                    <Box textAlign="center" padding="l" color="text-status-inactive">
                      No results
                    </Box>
                  )}
                  {logs.length > 0 && (
                    <LogInsightsTable
                      logs={logs}
                      logGroupName={
                        selectedLogGroups.length === 1
                          ? String(selectedLogGroups[0].value ?? '')
                          : ''
                      }
                    />
                  )}
                </>
              ),
            },
            {
              label: 'Visualization',
              id: 'viz',
              content: (
                <Box textAlign="center" padding="l" color="text-status-inactive">
                  Visualization coming soon.
                </Box>
              ),
            },
          ]}
        />
      </SpaceBetween>
    </ContentLayout>
  );
}
