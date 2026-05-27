'use client';

import {
  Box,
  Button,
  Header,
  Modal,
  SpaceBetween,
  Table,
  type TableProps,
} from '@cloudscape-design/components';
import { useCallback, useEffect, useState } from 'react';
import { LoadingErrorEmptyHandler } from '@/app/components/loading-error-empty-handler';
import { ViewCode } from '@/app/components/view-code';
import { useAppStore } from '@/app/lib/client/store/app-store';
import {
  getRolePolicyAction,
  listAttachedRolePoliciesAction,
  listRolePoliciesAction,
} from '@/app/lib/server/actions/iam-actions';

type PolicyRow = {
  PolicyName: string;
  Type: 'Inline' | 'Attached';
  PolicyArn: string;
};

const COLUMNS: TableProps.ColumnDefinition<PolicyRow>[] = [
  { id: 'PolicyName', header: 'Policy Name', cell: (item) => item.PolicyName, isRowHeader: true },
  { id: 'Type', header: 'Policy Type', cell: (item) => item.Type },
  { id: 'PolicyArn', header: 'Policy ARN', cell: (item) => item.PolicyArn || '—' },
];

type Props = {
  roleName: string;
};

export function ViewRolePolicy({ roleName }: Props) {
  const { environment, region } = useAppStore();

  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PolicyRow[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docJson, setDocJson] = useState('');

  const load = useCallback(async () => {
    if (!environment || !region || !roleName) return;
    setLoading(true);
    setError(null);
    try {
      const [inlineRes, attachedRes] = await Promise.all([
        listRolePoliciesAction(environment, region, roleName),
        listAttachedRolePoliciesAction(environment, region, roleName),
      ]);
      if (!inlineRes.ok) {
        setError(inlineRes.error.message);
        return;
      }
      if (!attachedRes.ok) {
        setError(attachedRes.error.message);
        return;
      }

      const inline = (inlineRes.data as { PolicyNames?: string[] }).PolicyNames ?? [];
      const attached =
        (attachedRes.data as { AttachedPolicies?: { PolicyName: string; PolicyArn: string }[] })
          .AttachedPolicies ?? [];

      const rows: PolicyRow[] = [
        ...inline.map((name) => ({ PolicyName: name, Type: 'Inline' as const, PolicyArn: '' })),
        ...attached.map((p) => ({
          PolicyName: p.PolicyName,
          Type: 'Attached' as const,
          PolicyArn: p.PolicyArn,
        })),
      ];
      setPolicies(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [environment, region, roleName]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewDocument = async () => {
    const row = selected[0];
    if (!row) return;
    setModalOpen(true);
    setDocLoading(true);
    setDocError(null);
    setDocJson('');

    if (row.Type === 'Attached') {
      // GetRolePolicy only returns inline policies. Managed policy documents
      // require GetPolicy + GetPolicyVersion (two extra calls) — not yet
      // wired up. Show a clear message instead of silently failing.
      setDocError(
        `Inline document view is supported. For managed policy "${row.PolicyName}", open it in the IAM console using the ARN above.`,
      );
      setDocLoading(false);
      return;
    }

    try {
      const res = await getRolePolicyAction(environment, region, roleName, row.PolicyName);
      if (!res.ok) {
        setDocError(res.error.message);
        return;
      }
      const raw = (res.data as { PolicyDocument?: string }).PolicyDocument;
      if (!raw) {
        setDocError('No policy document returned.');
        return;
      }
      try {
        const decoded = JSON.parse(decodeURIComponent(raw));
        setDocJson(JSON.stringify(decoded, null, 2));
      } catch {
        // Some providers return the document already decoded (object form).
        try {
          setDocJson(JSON.stringify(JSON.parse(raw), null, 2));
        } catch {
          setDocJson(String(raw));
        }
      }
    } catch (e) {
      setDocError(e instanceof Error ? e.message : String(e));
    } finally {
      setDocLoading(false);
    }
  };

  return (
    <>
      <LoadingErrorEmptyHandler
        isLoading={loading}
        isError={!!error}
        errorMessage={error ?? ''}
        dataLength={policies.length}
      >
        <SpaceBetween size="m">
          <Table
            variant="borderless"
            columnDefinitions={COLUMNS}
            items={policies}
            selectionType="single"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            header={
              <Header variant="h3" counter={`(${policies.length})`}>
                Policies
              </Header>
            }
          />
          <Button onClick={handleViewDocument} disabled={selected.length === 0}>
            View Policy Document
          </Button>
        </SpaceBetween>
      </LoadingErrorEmptyHandler>

      <Modal
        size="large"
        visible={modalOpen}
        onDismiss={() => setModalOpen(false)}
        header={selected[0]?.PolicyName ?? 'Policy Document'}
      >
        {docLoading ? (
          <Box textAlign="center" padding="m" color="text-status-inactive">
            Loading…
          </Box>
        ) : docError ? (
          <Box color="text-status-error" padding="m">
            {docError}
          </Box>
        ) : (
          <ViewCode code={docJson} language="json" height="500px" />
        )}
      </Modal>
    </>
  );
}
