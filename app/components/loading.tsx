'use client';
import { Box, Spinner } from '@cloudscape-design/components';

export function Loading() {
  return (
    <Box textAlign="center" padding="xl">
      <Spinner size="large" />
    </Box>
  );
}
