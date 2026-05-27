'use client';

import { Box, Container, ExpandableSection, SpaceBetween } from '@cloudscape-design/components';
import { use, useState } from 'react';
import { CopyText } from '@/app/components/copy-text';
import { KeyValueTable } from '@/app/components/key-value-table';

export function SecretValueDisplay({ valuePromise }: { valuePromise: Promise<any> }) {
  const data = use(valuePromise);
  const [visible, setVisible] = useState(false);
  const secretValue = data?.SecretString ?? (data?.SecretBinary ? '[Binary]' : '');

  let parsedObject: Record<string, string> | null = null;
  let formatted = secretValue;
  try {
    const parsed = JSON.parse(secretValue);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      parsedObject = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
      );
    }
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // not JSON — leave secretValue as-is
  }

  return (
    <ExpandableSection
      headerText="Secret Value"
      variant="container"
      onChange={({ detail }) => setVisible(detail.expanded)}
    >
      {visible && (
        <SpaceBetween size="s">
          {parsedObject ? (
            <KeyValueTable
              headerText="Key/Value pairs"
              keyValueObject={parsedObject}
              variant="embedded"
            />
          ) : (
            <Container>
              <Box fontSize="body-s" padding="s">
                <SpaceBetween size="xs">
                  <CopyText copyText={String(secretValue)} buttonText="Copy" />
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatted}
                  </pre>
                </SpaceBetween>
              </Box>
            </Container>
          )}
        </SpaceBetween>
      )}
    </ExpandableSection>
  );
}
