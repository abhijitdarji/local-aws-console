'use client';

import {
  Button,
  Checkbox,
  ColumnLayout,
  ExpandableSection,
  FormField,
  Grid,
  Input,
  RadioGroup,
  Select,
  type SelectProps,
  SpaceBetween,
  TokenGroup,
  type TokenGroupProps,
} from '@cloudscape-design/components';
import { useEffect, useState } from 'react';

export enum QueryType {
  SCAN = 'Scan',
  QUERY = 'Query',
}

type Filter = {
  attributeName: string;
  attributeType: SelectProps.Option;
  filterCondition: SelectProps.Option;
  attributeValue: string;
  attributeValue2: string;
};

type Props = {
  tableName: string;
  tableDetails: any;
  onRunQuery: (type: QueryType, query: Record<string, unknown>) => void;
  onReset: () => void;
};

const TYPE_OPTIONS: SelectProps.Option[] = [
  { label: 'String', value: 'S' },
  { label: 'Number', value: 'N' },
  { label: 'Binary', value: 'B' },
  { label: 'Boolean', value: 'BOOL' },
  { label: 'Null', value: 'NULL' },
];

const SORT_KEY_CONDITIONS: SelectProps.Option[] = [
  { label: 'Equal to', value: '=' },
  { label: 'Less than or equal to', value: '<=' },
  { label: 'Less than', value: '<' },
  { label: 'Greater than or equal to', value: '>=' },
  { label: 'Greater than', value: '>' },
  { label: 'Between', value: 'between' },
  { label: 'Begins with', value: 'begins_with' },
];

function conditionsFor(type: string): SelectProps.Option[] {
  const base: SelectProps.Option[] = [
    { label: 'Equal to', value: '=' },
    { label: 'Not equal to', value: '<>' },
    { label: 'Exists', value: 'attribute_exists' },
    { label: 'Not exists', value: 'attribute_not_exists' },
  ];
  if (type === 'BOOL' || type === 'NULL') return base;
  return [
    ...base.slice(0, 2),
    { label: 'Less than or equal to', value: '<=' },
    { label: 'Less than', value: '<' },
    { label: 'Greater than or equal to', value: '>=' },
    { label: 'Greater than', value: '>' },
    { label: 'Between', value: 'between' },
    ...base.slice(2),
    ...(type !== 'N'
      ? [
          { label: 'Contains', value: 'contains' },
          { label: 'Not contains', value: 'not_contains' },
          { label: 'Begins with', value: 'begins_with' },
        ]
      : []),
  ];
}

const DEFAULT_FILTER: Filter = {
  attributeName: '',
  attributeType: { label: 'String', value: 'S' },
  filterCondition: { label: 'Equal to', value: '=' },
  attributeValue: '',
  attributeValue2: '',
};

function getKeyName(
  tableDetails: any,
  indexName: string,
  keyType: 'HASH' | 'RANGE',
): string | undefined {
  const table = tableDetails?.Table;
  if (!table) return undefined;
  if (indexName === table.TableName) {
    return table.KeySchema?.find((k: any) => k.KeyType === keyType)?.AttributeName;
  }
  const gsi = table.GlobalSecondaryIndexes?.find((i: any) => i.IndexName === indexName);
  return gsi?.KeySchema?.find((k: any) => k.KeyType === keyType)?.AttributeName;
}

function hasSortKey(tableDetails: any, indexName: string): boolean {
  return !!getKeyName(tableDetails, indexName, 'RANGE');
}

export function ScanQuery({ tableName, tableDetails, onRunQuery, onReset }: Props) {
  const table = tableDetails?.Table;
  const tableOption: SelectProps.OptionGroup = {
    label: 'Table',
    options: [{ label: tableName, value: tableName }],
  };
  const gsiOptions: SelectProps.OptionGroup | null = table?.GlobalSecondaryIndexes?.length
    ? {
        label: 'Index',
        options: table.GlobalSecondaryIndexes.map((g: any) => ({
          label: g.IndexName,
          value: g.IndexName,
        })),
      }
    : null;
  const sourceOptions = gsiOptions ? [tableOption, gsiOptions] : [tableOption];

  const [scanOrQuery, setScanOrQuery] = useState<string>(QueryType.SCAN);
  const [source, setSource] = useState<SelectProps.Option>({ label: tableName, value: tableName });
  const [projection, setProjection] = useState<SelectProps.Option>({
    label: 'All attributes',
    value: 'all',
  });
  const [partitionKeyValue, setPartitionKeyValue] = useState('');
  const [sortKeyCondition, setSortKeyCondition] = useState<SelectProps.Option>(
    SORT_KEY_CONDITIONS[0],
  );
  const [sortKeyValue, setSortKeyValue] = useState('');
  const [sortKeyValue2, setSortKeyValue2] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [projAttrInput, setProjAttrInput] = useState('');
  const [projAttrs, setProjAttrs] = useState<TokenGroupProps.Item[]>([]);
  const [filters, setFilters] = useState<Filter[]>([{ ...DEFAULT_FILTER }]);

  const projectionOptions: SelectProps.Option[] =
    source.value === tableName
      ? [
          { label: 'All attributes', value: 'all' },
          { label: 'Specific attributes', value: 'specific' },
        ]
      : [
          { label: 'Projected attributes', value: 'all' },
          { label: 'Specific attributes', value: 'specific' },
        ];

  useEffect(() => {
    setProjection(projectionOptions[0]);
  }, [source.value]);

  const addProjAttr = () => {
    if (!projAttrInput || projAttrs.find((a) => a.label === projAttrInput)) return;
    setProjAttrs([...projAttrs, { label: projAttrInput, dismissLabel: `Remove ${projAttrInput}` }]);
    setProjAttrInput('');
  };

  const updateFilter = (i: number, patch: Partial<Filter>) => {
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };

  const buildAndRun = () => {
    const type = scanOrQuery as QueryType;
    const baseQuery: Record<string, unknown> = {
      TableName: tableName,
      Limit: 50,
    };

    if (source.value !== tableName) {
      baseQuery.IndexName = source.value;
      baseQuery.Select =
        projection.value === 'all' ? 'ALL_PROJECTED_ATTRIBUTES' : 'SPECIFIC_ATTRIBUTES';
    } else {
      baseQuery.Select = projection.value === 'all' ? 'ALL_ATTRIBUTES' : 'SPECIFIC_ATTRIBUTES';
    }

    if (sortDesc) baseQuery.ScanIndexForward = false;

    if (projection.value === 'specific' && projAttrs.length > 0) {
      const names: Record<string, string> = {};
      const placeholders = projAttrs.map((a, i) => {
        names[`#p${i}`] = a.label!;
        return `#p${i}`;
      });
      baseQuery.ProjectionExpression = placeholders.join(', ');
      baseQuery.ExpressionAttributeNames = names;
    }

    // Filter expressions
    const filterParts: string[] = [];
    const exprAttrNames: Record<string, string> = {
      ...((baseQuery.ExpressionAttributeNames as Record<string, string>) ?? {}),
    };
    const exprAttrValues: Record<string, unknown> = {};

    filters.forEach((f, fi) => {
      if (!f.attributeName || !f.filterCondition) return;
      const nameToken = `#f${fi}`;
      const valToken = `:fv${fi}`;
      const valToken2 = `:fv${fi}b`;
      exprAttrNames[nameToken] = f.attributeName;

      const cond = f.filterCondition.value;
      if (cond === 'attribute_exists' || cond === 'attribute_not_exists') {
        filterParts.push(`${cond}(${nameToken})`);
      } else if (cond === 'between') {
        exprAttrValues[valToken] = { [f.attributeType.value as string]: f.attributeValue };
        exprAttrValues[valToken2] = { [f.attributeType.value as string]: f.attributeValue2 };
        filterParts.push(`${nameToken} BETWEEN ${valToken} AND ${valToken2}`);
      } else if (cond === 'contains' || cond === 'not_contains' || cond === 'begins_with') {
        exprAttrValues[valToken] = { [f.attributeType.value as string]: f.attributeValue };
        filterParts.push(`${cond}(${nameToken}, ${valToken})`);
      } else {
        exprAttrValues[valToken] = { [f.attributeType.value as string]: f.attributeValue };
        filterParts.push(`${nameToken} ${cond} ${valToken}`);
      }
    });

    if (filterParts.length > 0) {
      baseQuery.FilterExpression = filterParts.join(' AND ');
      baseQuery.ExpressionAttributeNames = exprAttrNames;
      if (Object.keys(exprAttrValues).length) baseQuery.ExpressionAttributeValues = exprAttrValues;
    } else if (Object.keys(exprAttrNames).length) {
      baseQuery.ExpressionAttributeNames = exprAttrNames;
    }

    // Key condition for Query
    if (type === QueryType.QUERY && partitionKeyValue) {
      const pkName = getKeyName(tableDetails, source.value as string, 'HASH');
      const pkToken = '#pk';
      const pkValToken = ':pkv';
      exprAttrNames[pkToken] = pkName!;
      const pkExprAttrValues: Record<string, unknown> = { [pkValToken]: { S: partitionKeyValue } };
      let keyCondExpr = `${pkToken} = ${pkValToken}`;

      if (hasSortKey(tableDetails, source.value as string) && sortKeyValue) {
        const skName = getKeyName(tableDetails, source.value as string, 'RANGE');
        const skToken = '#sk';
        const skValToken = ':skv';
        exprAttrNames[skToken] = skName!;
        const cond = sortKeyCondition.value;
        if (cond === 'between') {
          const skValToken2 = ':skv2';
          pkExprAttrValues[skValToken] = { S: sortKeyValue };
          pkExprAttrValues[skValToken2] = { S: sortKeyValue2 };
          keyCondExpr += ` AND ${skToken} BETWEEN ${skValToken} AND ${skValToken2}`;
        } else if (cond === 'begins_with') {
          pkExprAttrValues[skValToken] = { S: sortKeyValue };
          keyCondExpr += ` AND begins_with(${skToken}, ${skValToken})`;
        } else {
          pkExprAttrValues[skValToken] = { S: sortKeyValue };
          keyCondExpr += ` AND ${skToken} ${cond} ${skValToken}`;
        }
      }

      baseQuery.KeyConditionExpression = keyCondExpr;
      baseQuery.ExpressionAttributeNames = exprAttrNames;
      baseQuery.ExpressionAttributeValues = {
        ...((baseQuery.ExpressionAttributeValues ?? {}) as Record<string, unknown>),
        ...(pkExprAttrValues as Record<string, unknown>),
      };
    }

    onRunQuery(type, baseQuery);
  };

  const resetAll = () => {
    setScanOrQuery(QueryType.SCAN);
    setSource({ label: tableName, value: tableName });
    setPartitionKeyValue('');
    setSortKeyValue('');
    setSortKeyValue2('');
    setSortDesc(false);
    setProjAttrs([]);
    setProjAttrInput('');
    setFilters([{ ...DEFAULT_FILTER }]);
    onReset();
  };

  const pkName = getKeyName(tableDetails, source.value as string, 'HASH');
  const skName = getKeyName(tableDetails, source.value as string, 'RANGE');
  const showSortKey = hasSortKey(tableDetails, source.value as string);

  return (
    <ExpandableSection headerText="Scan / Query" defaultExpanded variant="container">
      <SpaceBetween size="m">
        {/* Scan vs Query */}
        <FormField label="Operation">
          <RadioGroup
            value={scanOrQuery}
            onChange={({ detail }) => setScanOrQuery(detail.value)}
            items={[
              { value: QueryType.SCAN, label: 'Scan' },
              { value: QueryType.QUERY, label: 'Query' },
            ]}
          />
        </FormField>

        {/* Source (table or GSI) */}
        <ColumnLayout columns={2}>
          <FormField label="Table / Index">
            <Select
              options={sourceOptions}
              selectedOption={source}
              onChange={({ detail }) => setSource(detail.selectedOption)}
            />
          </FormField>
          <FormField label="Projection">
            <Select
              options={projectionOptions}
              selectedOption={projection}
              onChange={({ detail }) => setProjection(detail.selectedOption)}
            />
          </FormField>
        </ColumnLayout>

        {/* Specific projection attributes */}
        {projection.value === 'specific' && (
          <FormField label="Attributes to project">
            <SpaceBetween size="xs">
              <Grid gridDefinition={[{ colspan: 10 }, { colspan: 2 }]}>
                <Input
                  value={projAttrInput}
                  onChange={({ detail }) => setProjAttrInput(detail.value)}
                  placeholder="Attribute name"
                  onKeyDown={({ detail }) => detail.keyCode === 13 && addProjAttr()}
                />
                <Button onClick={addProjAttr}>Add</Button>
              </Grid>
              {projAttrs.length > 0 && (
                <TokenGroup
                  items={projAttrs}
                  onDismiss={({ detail }) =>
                    setProjAttrs(projAttrs.filter((_, i) => i !== detail.itemIndex))
                  }
                />
              )}
            </SpaceBetween>
          </FormField>
        )}

        {/* Query key conditions */}
        {scanOrQuery === QueryType.QUERY && (
          <SpaceBetween size="s">
            <FormField label={`Partition key  (${pkName ?? '—'})`}>
              <Input
                value={partitionKeyValue}
                onChange={({ detail }) => setPartitionKeyValue(detail.value)}
                placeholder="Enter value"
              />
            </FormField>
            {showSortKey && (
              <FormField label={`Sort key  (${skName ?? '—'})`}>
                <Grid
                  gridDefinition={
                    sortKeyCondition.value === 'between'
                      ? [{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]
                      : [{ colspan: 4 }, { colspan: 8 }]
                  }
                >
                  <Select
                    options={SORT_KEY_CONDITIONS}
                    selectedOption={sortKeyCondition}
                    onChange={({ detail }) => setSortKeyCondition(detail.selectedOption)}
                  />
                  <Input
                    value={sortKeyValue}
                    onChange={({ detail }) => setSortKeyValue(detail.value)}
                    placeholder="Enter value"
                  />
                  {sortKeyCondition.value === 'between' && (
                    <Input
                      value={sortKeyValue2}
                      onChange={({ detail }) => setSortKeyValue2(detail.value)}
                      placeholder="Enter upper bound"
                    />
                  )}
                </Grid>
              </FormField>
            )}
            <Checkbox checked={sortDesc} onChange={({ detail }) => setSortDesc(detail.checked)}>
              Descending sort
            </Checkbox>
          </SpaceBetween>
        )}

        {/* Filter expression */}
        <ExpandableSection headerText="Filter expression">
          <SpaceBetween size="s">
            {filters.map((f, fi) => (
              <Grid
                key={fi}
                gridDefinition={[
                  { colspan: 3 },
                  { colspan: 2 },
                  { colspan: 2 },
                  { colspan: 3 },
                  { colspan: 2 },
                ]}
              >
                <FormField label={fi === 0 ? 'Attribute name' : undefined}>
                  <Input
                    value={f.attributeName}
                    onChange={({ detail }) => updateFilter(fi, { attributeName: detail.value })}
                    placeholder="Attribute"
                  />
                </FormField>
                <FormField label={fi === 0 ? 'Type' : undefined}>
                  <Select
                    options={TYPE_OPTIONS}
                    selectedOption={f.attributeType}
                    onChange={({ detail }) =>
                      updateFilter(fi, {
                        attributeType: detail.selectedOption,
                        filterCondition: { label: 'Equal to', value: '=' },
                      })
                    }
                  />
                </FormField>
                <FormField label={fi === 0 ? 'Condition' : undefined}>
                  <Select
                    options={conditionsFor(f.attributeType.value as string)}
                    selectedOption={f.filterCondition}
                    onChange={({ detail }) =>
                      updateFilter(fi, { filterCondition: detail.selectedOption })
                    }
                  />
                </FormField>
                <FormField label={fi === 0 ? 'Value' : undefined}>
                  {f.filterCondition.value !== 'attribute_exists' &&
                  f.filterCondition.value !== 'attribute_not_exists' &&
                  f.attributeType.value !== 'NULL' ? (
                    <SpaceBetween size="xs">
                      <Input
                        value={f.attributeValue}
                        onChange={({ detail }) =>
                          updateFilter(fi, { attributeValue: detail.value })
                        }
                        placeholder="Value"
                      />
                      {f.filterCondition.value === 'between' && (
                        <Input
                          value={f.attributeValue2}
                          onChange={({ detail }) =>
                            updateFilter(fi, { attributeValue2: detail.value })
                          }
                          placeholder="Upper bound"
                        />
                      )}
                    </SpaceBetween>
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </FormField>
                <FormField label={fi === 0 ? '\u00a0' : undefined}>
                  <Button
                    iconName="remove"
                    onClick={() => setFilters(filters.filter((_, i) => i !== fi))}
                  >
                    Remove
                  </Button>
                </FormField>
              </Grid>
            ))}
            <Button onClick={() => setFilters([...filters, { ...DEFAULT_FILTER }])}>
              Add filter
            </Button>
          </SpaceBetween>
        </ExpandableSection>

        <SpaceBetween direction="horizontal" size="s">
          <Button variant="primary" onClick={buildAndRun}>
            Run
          </Button>
          <Button onClick={resetAll}>Reset</Button>
        </SpaceBetween>
      </SpaceBetween>
    </ExpandableSection>
  );
}
