'use client';

import {
  Box,
  Button,
  ButtonDropdown,
  Cards,
  Container,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Textarea,
  TextFilter,
} from '@cloudscape-design/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createSavedQuery,
  deleteSavedQuery,
  getSavedQueries,
  getSavedQueryById,
  type SavedQuery,
  updateSavedQuery,
} from '@/app/lib/server/actions/favorites';

type Props = {
  onSelectQuery?: (queryString: string) => void;
};

type FormState = { name: string; query: string; logGroups: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FORM: FormState = { name: '', query: '', logGroups: '' };

export function SavedQueriesPanel({ onSelectQuery }: Props) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueries(await getSavedQueries());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      queries.filter((q) => {
        const lc = filter.toLowerCase();
        return (
          q.name.toLowerCase().includes(lc) ||
          q.query.toLowerCase().includes(lc) ||
          q.logGroups.toLowerCase().includes(lc)
        );
      }),
    [queries, filter],
  );

  const openAdd = () => {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = async (item: SavedQuery) => {
    const q = await getSavedQueryById(item.id);
    setForm({ name: q?.name ?? '', query: q?.query ?? '', logGroups: q?.logGroups ?? '' });
    setEditId(item.id);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (item: SavedQuery) => {
    await deleteSavedQuery(item.id);
    await load();
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.query.trim()) e.query = 'Query is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await updateSavedQuery(editId, form);
      } else {
        await createSavedQuery(form);
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <Button variant="link" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            }
          >
            {editId !== null ? 'Edit' : 'Add'} saved query
          </Header>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" loading={saving} onClick={handleSave}>
                  {editId !== null ? 'Save' : 'Add'}
                </Button>
              </SpaceBetween>
            }
          >
            <SpaceBetween size="m">
              <FormField label="Name" errorText={errors.name}>
                <Input
                  value={form.name}
                  onChange={({ detail }) => setForm((f) => ({ ...f, name: detail.value }))}
                />
              </FormField>
              <FormField label="Query" errorText={errors.query}>
                <Textarea
                  value={form.query}
                  rows={5}
                  onChange={({ detail }) => setForm((f) => ({ ...f, query: detail.value }))}
                />
              </FormField>
              <FormField label="Log Groups" description="Comma-separated log group names">
                <Input
                  value={form.logGroups}
                  onChange={({ detail }) => setForm((f) => ({ ...f, logGroups: detail.value }))}
                />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" variant="icon" loading={loading} onClick={load} />
              <Button onClick={openAdd}>Add Query</Button>
            </SpaceBetween>
          }
        >
          Saved Queries
        </Header>
      }
    >
      <SpaceBetween size="m">
        <FormField label="Filter" stretch>
          <TextFilter
            filteringText={filter}
            filteringPlaceholder="Filter queries"
            onChange={({ detail }) => setFilter(detail.filteringText)}
          />
        </FormField>

        <Cards
          loading={loading}
          loadingText="Loading saved queries…"
          items={filtered}
          cardDefinition={{
            header: (item) => (
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{item.name}</span>
                <ButtonDropdown
                  items={[
                    { text: 'Use', id: 'use' },
                    { text: 'Edit', id: 'edit' },
                    { text: 'Delete', id: 'rm' },
                  ]}
                  variant="inline-icon"
                  onItemClick={({ detail }) => {
                    if (detail.id === 'use' && onSelectQuery) onSelectQuery(item.query);
                    if (detail.id === 'edit') openEdit(item);
                    if (detail.id === 'rm') handleDelete(item);
                  }}
                />
              </div>
            ),
            sections: [
              {
                id: 'query',
                header: 'Query',
                content: (item) =>
                  item.query
                    ? item.query
                        .split('|')
                        .map((line, i) => <div key={i}>{i === 0 ? line : `| ${line}`}</div>)
                    : '',
              },
              {
                id: 'logGroups',
                header: 'Log Groups',
                content: (item) => item.logGroups || '—',
              },
            ],
          }}
          cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
          empty={
            <Box margin={{ vertical: 'xs' }} textAlign="center">
              <SpaceBetween size="m">
                <b>No saved queries</b>
                {filter ? (
                  <Button onClick={() => setFilter('')}>Clear filter</Button>
                ) : (
                  <Button onClick={openAdd}>Add Query</Button>
                )}
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>
    </Container>
  );
}
