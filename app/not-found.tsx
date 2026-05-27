'use client';
import { Box, Button, ContentLayout, Header, SpaceBetween } from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  return (
    <ContentLayout header={<Header variant="h1">Page not found</Header>}>
      <SpaceBetween size="m">
        <Box variant="p">The page you are looking for does not exist.</Box>
        <Button onClick={() => router.push('/')}>Go to Home</Button>
      </SpaceBetween>
    </ContentLayout>
  );
}
