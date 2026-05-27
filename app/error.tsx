'use client';
import {
  Alert,
  Box,
  Button,
  ContentLayout,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// AWS SDK error names / messages that mean "the resource you asked for
// does not exist". When we see one of these we render a friendly
// "Resource not found" UI instead of the generic Something-went-wrong alert.
function isAwsNotFoundError(err: Error): boolean {
  const name = err.name || '';
  const message = err.message || '';
  if (/NotFound|DoesNotExist|NoSuchEntity|NoSuchBucket|NoSuchKey/i.test(name)) {
    return true;
  }
  if (name === 'ValidationError' && /does not exist|not found/i.test(message)) {
    return true;
  }
  return /does not exist|was not found|could not be found/i.test(message);
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  if (isAwsNotFoundError(error)) {
    return (
      <ContentLayout header={<Header variant="h1">Resource not found</Header>}>
        <SpaceBetween size="m">
          <Box variant="p">
            {error.message ||
              'The AWS resource you are looking for does not exist in this environment or region.'}
          </Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => router.back()}>Go back</Button>
            <Button variant="primary" onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout header={<Header variant="h1">Something went wrong</Header>}>
      <SpaceBetween size="m">
        <Alert type="error" header="An error occurred">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </SpaceBetween>
    </ContentLayout>
  );
}
