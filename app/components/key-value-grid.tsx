'use client';

import { Box, ColumnLayout, Container } from '@cloudscape-design/components';
import type { ReactNode } from 'react';

export type Field = { label: string; value: ReactNode };

export function KeyValueGrid({
  columns = 4,
  fields,
  title,
}: {
  columns?: number;
  fields: Field[];
  title?: string;
}) {
  return (
    <Container header={title ? <Box variant="h2">{title}</Box> : undefined}>
      <ColumnLayout columns={columns} variant="text-grid">
        {fields.map((f) => (
          <div key={f.label}>
            <Box variant="awsui-key-label">{f.label}</Box>
            <div>{f.value ?? '—'}</div>
          </div>
        ))}
      </ColumnLayout>
    </Container>
  );
}
