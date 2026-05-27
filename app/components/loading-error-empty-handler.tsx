'use client';
import { Alert, Box } from '@cloudscape-design/components';
import { type ReactNode, useEffect } from 'react';
import { useNotificationsStore } from '@/app/lib/client/store/notifications-store';
import { Loading } from './loading';

interface Props {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  dataLength?: number;
  children?: ReactNode;
}

export function LoadingErrorEmptyHandler({
  isLoading = false,
  isError = false,
  errorMessage = '',
  dataLength,
  children,
}: Props) {
  const notify = useNotificationsStore((s) => s.notify);

  useEffect(() => {
    if (isError && errorMessage) {
      notify({ type: 'error', content: errorMessage });
    }
  }, [isError, errorMessage, notify]);

  if (isLoading) return <Loading />;
  if (isError) return <Alert type="error">{errorMessage}</Alert>;
  if (dataLength === 0) return <Box color="text-body-secondary">No data found</Box>;
  return <>{children}</>;
}
