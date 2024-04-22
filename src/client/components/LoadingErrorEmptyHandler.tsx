import React, { useContext, useEffect } from 'react';
import { Loading } from './Loading';
import { NotificationContext, NotificationContextValue } from '../context/NotificationsContext';
import { Box } from '@cloudscape-design/components';

interface LoadingErrorEmptyHandlerProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  dataLength: number;
  children: React.ReactNode;
}

export const LoadingErrorEmptyHandler: React.FC<LoadingErrorEmptyHandlerProps> = ({
  isLoading,
  isError,
  errorMessage,
  dataLength,
  children,
}) => {

  const { notify } = useContext(NotificationContext) as NotificationContextValue;

  useEffect(() => {
    if (isError) {
      notify(
        { type: 'error', content: errorMessage },
      )
    }
  }, [isError, errorMessage]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Box>Error in fetching data: {errorMessage}</Box>;
  }

  if (!dataLength) {
    return <Box>No data found</Box>;
  }

  return <>{children}</>;
};