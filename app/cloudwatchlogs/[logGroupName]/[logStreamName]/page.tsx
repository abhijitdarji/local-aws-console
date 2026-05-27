'use client';

import {
  Box,
  Button,
  ButtonDropdown,
  Container,
  ContentLayout,
  DateRangePicker,
  type DateRangePickerProps,
  Grid,
  Header,
  Input,
  Select,
  type SelectProps,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loading } from '@/app/components/loading';
import { type LogEntry, LogEventsTable } from '@/app/components/log-events-table';
import { useAppStore } from '@/app/lib/client/store/app-store';
import { DateUtils } from '@/app/lib/dates';
import {
  filterLogEventsAction,
  getLogEventsAction,
} from '@/app/lib/server/actions/cloudwatchlogs-actions';

const TIMEZONE_OPTIONS: SelectProps.Option[] = [
  { label: 'Local timezone', value: 'local' },
  { label: 'UTC', value: 'utc' },
];

export default function LogEventsPage() {
  const params = useParams<{ logGroupName: string; logStreamName: string }>();
  const logGroupName = decodeURIComponent(params.logGroupName);
  const logStreamName = decodeURIComponent(params.logStreamName);
  const { environment, region } = useAppStore();

  const [events, setEvents] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterText, setFilterText] = useState('');
  const [dateRange, setDateRange] = useState<DateRangePickerProps.Value>({
    key: 'previous-5-minutes',
    amount: 5,
    unit: 'minute',
    type: 'relative',
  });

  // Display controls
  const [timezone, setTimezone] = useState<SelectProps.Option>(TIMEZONE_OPTIONS[0]);
  const [plainText, setPlainText] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  const awsUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroupName)}/log-events/${encodeURIComponent(logStreamName)}`;

  const loadEvents = useCallback(async () => {
    if (!environment || !region) return;
    setLoading(true);
    setError(null);
    try {
      const { startTime, endTime } = DateUtils.calculateStartAndEndTimes(dateRange);
      const usingFilter = filterText.trim().length > 0 || (startTime !== null && endTime !== null);

      const result = usingFilter
        ? await filterLogEventsAction(
            environment,
            region,
            logGroupName,
            logStreamName,
            filterText,
            startTime ?? undefined,
            endTime ?? undefined,
          )
        : await getLogEventsAction(environment, region, logGroupName, logStreamName);

      if (!result.ok) {
        setError(result.error.message);
        setEvents([]);
        return;
      }
      const data = result.data as { events?: LogEntry[] };
      const sorted = (data.events ?? []).slice().sort((a, b) => b.timestamp - a.timestamp);
      setEvents(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [environment, region, logGroupName, logStreamName, filterText, dateRange]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: search runs explicitly via Enter
  useEffect(() => {
    loadEvents();
  }, [environment, region, logGroupName, logStreamName, dateRange]);

  const onSearchKeyDown = (e: { detail: { key: string } }) => {
    if (e.detail.key === 'Enter') loadEvents();
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={`${logGroupName} / ${logStreamName}`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={loadEvents} iconName="refresh" loading={loading}>
                Refresh
              </Button>
              <Button href={awsUrl} iconAlign="right" iconName="external" target="_blank">
                View on AWS
              </Button>
            </SpaceBetween>
          }
        >
          Log Events
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Container>
          <Grid gridDefinition={[{ colspan: 5 }, { colspan: 3 }, { colspan: 2 }, { colspan: 2 }]}>
            <Input
              onKeyDown={onSearchKeyDown}
              onChange={({ detail }) => setFilterText(detail.value)}
              value={filterText}
              placeholder="Search (CloudWatch filter pattern). Press Enter."
              type="search"
            />
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
            <Select
              selectedOption={timezone}
              onChange={({ detail }) => setTimezone(detail.selectedOption)}
              options={TIMEZONE_OPTIONS}
              expandToViewport
            />
            <ButtonDropdown
              variant="primary"
              expandToViewport
              items={[
                { text: 'View in plain text', id: 'plain', disabled: plainText },
                { text: 'View in columns', id: 'columns', disabled: !plainText },
                { text: 'Toggle expand all', id: 'expand', disabled: plainText },
              ]}
              onItemClick={({ detail }) => {
                switch (detail.id) {
                  case 'plain':
                    setPlainText(true);
                    setExpandAll(false);
                    break;
                  case 'columns':
                    setPlainText(false);
                    setExpandAll(false);
                    break;
                  case 'expand':
                    setExpandAll((x) => !x);
                    break;
                }
              }}
            >
              Display
            </ButtonDropdown>
          </Grid>
        </Container>

        {loading ? (
          <Loading />
        ) : error ? (
          <Box color="text-status-error" padding="m">
            Error: {error}
          </Box>
        ) : (
          <LogEventsTable
            logs={events}
            viewPlainText={plainText}
            expandAllRows={expandAll}
            useLocalTimezone={timezone.value === 'local'}
          />
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}
