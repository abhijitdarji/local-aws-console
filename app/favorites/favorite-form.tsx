'use client';

import {
  Button,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  Select,
  type SelectProps,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAppStore } from '@/app/lib/client/store/app-store';

type Props = {
  title: string;
  onSubmit: (data: { name: string; path: string; environment: string; region: string }) => void;
  pending: boolean;
  errors: Record<string, string>;
  defaultValues?: {
    name?: string;
    path?: string;
    environment?: string;
    region?: string;
  };
  /** Current header env (used as the default for the env selector). */
  environment: string;
  /** Current header region (used as the default for the region selector). */
  region: string;
};

export function FavoriteForm({
  title,
  onSubmit,
  pending,
  errors,
  defaultValues = {},
  environment,
  region,
}: Props) {
  const router = useRouter();
  const { environments, regions } = useAppStore();

  const [name, setName] = useState(defaultValues.name ?? '');
  const [path, setPath] = useState(defaultValues.path ?? '');

  const initialEnv = defaultValues.environment ?? environment;
  const initialRegion = defaultValues.region ?? region;

  const [selectedEnv, setSelectedEnv] = useState<SelectProps.Option | null>(
    initialEnv ? { label: initialEnv, value: initialEnv } : null,
  );
  const [selectedRegion, setSelectedRegion] = useState<SelectProps.Option | null>(
    initialRegion ? { label: initialRegion, value: initialRegion } : null,
  );

  const envOptions: SelectProps.Option[] = environments.map((e) => ({ label: e, value: e }));
  const regionOptions: SelectProps.Option[] = regions.map((r) => ({
    label: `${r.name} (${r.code})`,
    value: r.code,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      path,
      environment: String(selectedEnv?.value ?? initialEnv ?? ''),
      region: String(selectedRegion?.value ?? initialRegion ?? ''),
    });
  };

  return (
    <ContentLayout header={<Header variant="h1">{title}</Header>}>
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => router.push('/favorites')}>
                Cancel
              </Button>
              <Button variant="primary" loading={pending} formAction="submit">
                Save
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            <FormField label="Name" errorText={errors.name}>
              <Input
                value={name}
                onChange={({ detail }) => setName(detail.value)}
                placeholder="My Lambda Function"
              />
            </FormField>
            <FormField label="Path" errorText={errors.path}>
              <Input
                value={path}
                onChange={({ detail }) => setPath(detail.value)}
                placeholder="/lambda/my-function"
              />
            </FormField>
            <FormField label="Environment" errorText={errors.environment}>
              <Select
                selectedOption={selectedEnv}
                onChange={({ detail }) => setSelectedEnv(detail.selectedOption)}
                options={envOptions}
                placeholder="Select an environment"
                empty="No environments configured"
              />
            </FormField>
            <FormField label="Region" errorText={errors.region}>
              <Select
                selectedOption={selectedRegion}
                onChange={({ detail }) => setSelectedRegion(detail.selectedOption)}
                options={regionOptions}
                placeholder="Select a region"
                empty="No regions configured"
              />
            </FormField>
          </SpaceBetween>
        </Form>
      </form>
    </ContentLayout>
  );
}
