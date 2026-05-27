'use server';

import type { AwsActionResult } from '../aws-result';
import { runAwsCommandSafe } from './aws';

// Live (uncached) actions — called from client components for polling.
// All actions return a serializable `AwsActionResult` envelope so callers can
// surface the original AWS error message (Next.js redacts thrown errors from
// Server Actions in production builds).

export async function startQuery(
  env: string,
  region: string,
  logGroupName: string,
  queryString: string,
  startTime: number,
  endTime: number,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'StartQuery',
    options: {
      logGroupName,
      queryString,
      startTime: Math.floor(startTime / 1000),
      endTime: Math.floor(endTime / 1000),
    },
  });
}

export async function getQueryResults(
  env: string,
  region: string,
  queryId: string,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'GetQueryResults',
    options: { queryId },
  });
}

export async function stopQuery(
  env: string,
  region: string,
  queryId: string,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'StopQuery',
    options: { queryId },
  });
}

export async function describeLogGroups(env: string, region: string): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'DescribeLogGroups',
    options: {},
    allPages: true,
  });
}

export async function describeQueries(env: string, region: string): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'DescribeQueries',
    options: {},
  });
}

export async function startQueryMulti(
  env: string,
  region: string,
  logGroupNames: string[],
  queryString: string,
  startTime: number,
  endTime: number,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'StartQuery',
    options: {
      logGroupNames,
      queryString,
      startTime: Math.floor(startTime / 1000),
      endTime: Math.floor(endTime / 1000),
    },
  });
}

export async function getLogEventsAction(
  env: string,
  region: string,
  logGroupName: string,
  logStreamName: string,
  startTime?: number,
  endTime?: number,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'GetLogEvents',
    options: {
      logGroupName,
      logStreamName,
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      startFromHead: true,
      limit: 1000,
    },
  });
}

export async function filterLogEventsAction(
  env: string,
  region: string,
  logGroupName: string,
  logStreamName: string,
  filterPattern: string,
  startTime?: number,
  endTime?: number,
): Promise<AwsActionResult> {
  return runAwsCommandSafe({
    env,
    region,
    service: 'CloudWatchLogs',
    command: 'FilterLogEvents',
    options: {
      logGroupName,
      logStreamNames: [logStreamName],
      filterPattern,
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      limit: 1000,
    },
  });
}
