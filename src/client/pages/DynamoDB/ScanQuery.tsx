import {
    SpaceBetween, Button, ExpandableSection, RadioGroup,
    Select, FormField, ColumnLayout, SelectProps, Input, Grid, Checkbox,
    TokenGroup,
    TokenGroupProps
} from "@cloudscape-design/components"
import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";
import { useEffect, useState } from "react";

export enum QueryType {
    SCAN = 'Scan',
    QUERY = 'Query'
}

interface ScanQueryProps {
    tableName: string;
    tableDetails: any;
    onRunQuery: (type: string, query: object) => void;
    onResetQuery: () => void;
}

interface FiltersArray {
    attributeName: string;
    attributeType: OptionDefinition | null;
    filterCondition: OptionDefinition | null;
    attributeValue: string;
    attributeValue2?: string;
}

export const ScanQuery: React.FC<ScanQueryProps> = (props) => {

    const [scanQuery, setScanQuery] = useState<string>(QueryType.SCAN);
    const [selectedOption, setSelectedOption] = useState<SelectProps.Option>({ label: props.tableName, value: props.tableName });
    const [projectionOption, setProjectionOption] = useState<SelectProps.Option>({ label: "All attributes", value: "all" });
    const [partitionKeyQuery, setPartitionKeyQuery] = useState<string>('');
    const [sortKeyQuery, setSortKeyQuery] = useState<string>('');
    const [sortKeyBetweenQuery, setSortKeyBetweenQuery] = useState<string>('');
    const [sortKeyConditionOption, setSortKeyConditionOption] = useState<SelectProps.Option>({ label: "Equal to", value: "=" });
    const [sortDescChecked, setSortDescChecked] = useState<boolean>(false);
    const [projectionAttributeName, setProjectionAttributeName] = useState<string>('');
    const [projectionAttributes, setProjectionAttributes] = useState<TokenGroupProps.Item[]>([]);

    const defaultFilters: FiltersArray[] = [{
        attributeName: '',
        attributeType: { label: "String", value: "S" },
        filterCondition: { label: "Equal to", value: "=" },
        attributeValue: '',
        attributeValue2: ''
    }]

    const [filters, setFilters] = useState<FiltersArray[]>(defaultFilters);

    const handleAddFilter = () => {
        setFilters(prevFilters => [...prevFilters, {
            attributeName: '',
            attributeType: { label: "String", value: "S" },
            filterCondition: { label: "Equal to", value: "=" },
            attributeValue: '',
            attributeValue2: ''
        }]);
    };

    const handleRemoveFilter = (index: number) => {
        const values = [...filters];
        values.splice(index, 1);
        setFilters(values);
    };


    const getSelectOptions: () => SelectProps.OptionGroup[] = () => {
        const tableOption: SelectProps.OptionGroup =
        {
            label: "Table",
            options: [
                { label: props.tableName, value: props.tableName }
            ]
        };

        const indexOption: SelectProps.OptionGroup | null = props.tableDetails.Table.GlobalSecondaryIndexes ? {
            label: "Index",
            options: props.tableDetails.Table.GlobalSecondaryIndexes.map((index: any) => {
                return { label: index.IndexName, value: index.IndexName }
            })
        } : null;

        return indexOption ? [tableOption, indexOption] : [tableOption];
    }

    const getProjectionOptions = () => {

        if (selectedOption.value === props.tableName) {
            return [
                { label: "All attributes", value: "all" },
                { label: "Specific attributes", value: "specific" }
            ]
        } else {
            return [
                { label: "Projected attributes", value: "all" },
                { label: "Specific attributes", value: "specific" }
            ]
        }
    }

    const getAttributeTypeOptions = () => {
        return [
            { label: "String", value: "S" },
            { label: "Number", value: "N" },
            { label: "Binary", value: "B" },
            { label: "Boolean", value: "BOOL" },
            { label: "Null", value: "NULL" }
        ]
    }

    const getAttributeConditionOptions = (type: string) => {

        switch (type) {
            case "N":
                return [
                    { label: "Equal to", value: "=" },
                    { label: "Not equal to", value: "<>" },
                    { label: "Less than or equal to", value: "<=" },
                    { label: "Less than", value: "<" },
                    { label: "Greater than or equal to", value: ">=" },
                    { label: "Greater than", value: ">" },
                    { label: "Between", value: "between" },
                    { label: "Exists", value: "attribute_exists" },
                    { label: "Not exists", value: "attribute_not_exists" }
                ];

            case "BOOL":
                return [
                    { label: "Equal to", value: "=" },
                    { label: "Not equal to", value: "<>" },
                    { label: "Exists", value: "attribute_exists" },
                    { label: "Not exists", value: "attribute_not_exists" }
                ];

            case "NULL":
                return [
                    { label: "Exists", value: "attribute_exists" },
                    { label: "Not exists", value: "attribute_not_exists" }
                ];

            default:
                return [
                    { label: "Equal to", value: "=" },
                    { label: "Not equal to", value: "<>" },
                    { label: "Less than or equal to", value: "<=" },
                    { label: "Less than", value: "<" },
                    { label: "Greater than or equal to", value: ">=" },
                    { label: "Greater than", value: ">" },
                    { label: "Between", value: "between" },
                    { label: "Exists", value: "attribute_exists" },
                    { label: "Not exists", value: "attribute_not_exists" },
                    { label: "Contains", value: "contains" },
                    { label: "Not contains", value: "not_contains" },
                    { label: "Begins with", value: "begins_with" }
                ]
        }

    }

    const getSortKeyConditionOptions = () => {
        return [
            { label: "Equal to", value: "=" },
            { label: "Less than or equal to", value: "<=" },
            { label: "Less than", value: "<" },
            { label: "Greater than or equal to", value: ">=" },
            { label: "Greater than", value: ">" },
            { label: "Between", value: "between" },
            { label: "Begins with", value: "begins_with" },
        ]
    }

    const getPartitionKeyName = () => {
        if (selectedOption.value === props.tableName) {
            return props.tableDetails.Table.KeySchema.find((key: any) => key.KeyType === 'HASH').AttributeName;
        } else {
            const index = props.tableDetails.Table.GlobalSecondaryIndexes.find((index: any) => index.IndexName === selectedOption.value);
            return index.KeySchema.find((key: any) => key.KeyType === 'HASH').AttributeName;
        }
    }

    const getSortKeyName = () => {
        if (selectedOption.value === props.tableName) {
            return props.tableDetails.Table.KeySchema.find((key: any) => key.KeyType === 'RANGE').AttributeName;
        } else {
            const index = props.tableDetails.Table.GlobalSecondaryIndexes.find((index: any) => index.IndexName === selectedOption.value);
            return index.KeySchema.find((key: any) => key.KeyType === 'RANGE').AttributeName;
        }
    }

    const hasSortKey = () => {
        if (selectedOption.value === props.tableName) {
            return props.tableDetails.Table.KeySchema.find((key: any) => key.KeyType === 'RANGE') !== undefined;
        } else {
            const index = props.tableDetails.Table.GlobalSecondaryIndexes.find((index: any) => index.IndexName === selectedOption.value);
            return index.KeySchema.find((key: any) => key.KeyType === 'RANGE') !== undefined;
        }
    }

    const showAttributeValueTextBox = (type: string, condition: string) => {
        return type !== "NULL" && !["attribute_exists", "attribute_not_exists"].includes(condition);
    }

    const addAttributeProjection = () => {
        if (projectionAttributeName !== '') {

            if (projectionAttributes.find(attr => attr.label === projectionAttributeName)) {
                setProjectionAttributeName('');
                return;
            }

            setProjectionAttributeName('');
            setProjectionAttributes([
                ...projectionAttributes,
                { label: projectionAttributeName, dismissLabel: `Remove ${projectionAttributeName}` }
            ]);
        }
    }

    useEffect(() => {
        setProjectionOption(getProjectionOptions()[0]);
    }, [selectedOption]);

    const runScanQuery = () => {

        const buildQuery = () => {

            let finalQuery: any = {};

            const baseQeury: any = {
                TableName: props.tableName,
                Limit: 50,
            }

            if (selectedOption.value !== props.tableName) {
                baseQeury.IndexName = selectedOption.value;
                if (projectionOption.value === 'all') {
                    baseQeury.Select = 'ALL_PROJECTED_ATTRIBUTES';
                } else {
                    baseQeury.Select = 'SPECIFIC_ATTRIBUTES';
                }
            } else {
                if (projectionOption.value === 'all') {
                    baseQeury.Select = 'ALL_ATTRIBUTES';
                } else {
                    baseQeury.Select = 'SPECIFIC_ATTRIBUTES';
                }
            }

            if (sortDescChecked) {
                baseQeury.ScanIndexForward = false;
            }

            if (baseQeury.Select === 'SPECIFIC_ATTRIBUTES' && projectionAttributes.length > 0) {

                baseQeury.ProjectionExpression = projectionAttributes.map((attr, index) => `#ap${index}`).join(', ');
                baseQeury.ExpressionAttributeNames = projectionAttributes.reduce((acc: any, attr, index: number) => {
                    let key: string = `#ap${index}`;
                    acc[key] = attr.label;
                    return acc;
                }, {});
            }


            if (scanQuery === QueryType.SCAN) {
                finalQuery = baseQeury;
            } else {
                let query: any = {
                    ...baseQeury,
                    KeyConditionExpression: `#kn0 = :kv0`,
                    ExpressionAttributeNames: {
                        ...baseQeury.ExpressionAttributeNames,
                        "#kn0": getPartitionKeyName()
                    },
                    ExpressionAttributeValues: {
                        ":kv0": {
                            S: partitionKeyQuery
                        }
                    },
                    ...baseQeury.ProjectionExpression ? { ProjectionExpression: baseQeury.ProjectionExpression } : {}
                }

                if (hasSortKey()) {

                    let sortCondition;

                    switch (sortKeyConditionOption.value) {
                        case "between":
                            sortCondition = ` AND #kn1 BETWEEN :kv1 AND :kv2`;
                            query.ExpressionAttributeValues[":kv2"] = {
                                S: sortKeyBetweenQuery
                            }
                            break;
                        case "begins_with":
                            sortCondition = ` AND begins_with(#kn1, :kv1)`;
                            break;
                        default:
                            sortCondition = ` AND #kn1 ${sortKeyConditionOption.value} :kv1`;
                            break;
                    }

                    query = {
                        ...query,
                        KeyConditionExpression: query.KeyConditionExpression + sortCondition,
                        ExpressionAttributeNames: {
                            ...query.ExpressionAttributeNames,
                            "#kn1": getSortKeyName()
                        },
                        ExpressionAttributeValues: {
                            ...query.ExpressionAttributeValues,
                            ":kv1": {
                                S: sortKeyQuery
                            }
                        }
                    }
                }

                finalQuery = query;
            }

            if (filters.length > 0) {
                filters.forEach((filter, index) => {
                    let condition;

                    // get last index from values because between condition will have 2 values
                    let lastIndex = Math.max(...Object.keys(finalQuery.ExpressionAttributeValues || {}).map(key => +key.replace(':kv', '')));

                    let attributeIndex = lastIndex >= 0 ? lastIndex + 1 : 0;

                    let attributeIndex2 = attributeIndex + 1;

                    // Skip if attribute value is empty
                    if (showAttributeValueTextBox(filter.attributeType?.value || '', filter.filterCondition?.value || '')
                        && filter.attributeValue === '') {
                        return;
                    }

                    switch (filter.filterCondition?.value) {
                        case "between":
                            condition = `#kn${attributeIndex} BETWEEN :kv${attributeIndex} AND :kv${attributeIndex2}`;
                            finalQuery.ExpressionAttributeValues[`:kv${attributeIndex2}`] = {
                                [`${filter.attributeType?.value}`]: filter.attributeValue2
                            }
                            break;
                        case "begins_with":
                            condition = `begins_with(#kn${attributeIndex}, :kv${attributeIndex})`;
                            break;
                        case "contains":
                            condition = `contains(#kn${attributeIndex}, :kv${attributeIndex})`;
                            break;
                        case "not_contains":
                            condition = `NOT contains(#kn${attributeIndex}, :kv${attributeIndex})`;
                            break;
                        case "attribute_exists":
                            condition = `attribute_exists(#kn${attributeIndex})`;
                            break;
                        case "attribute_not_exists":
                            condition = `attribute_not_exists(#kn${attributeIndex})`;
                            break;
                        default:
                            condition = `#kn${attributeIndex} ${filter.filterCondition?.value} :kv${attributeIndex}`;
                            break;
                    }

                    finalQuery = {
                        ...finalQuery,
                        FilterExpression: finalQuery.FilterExpression ? `${finalQuery.FilterExpression} AND ${condition}` : condition,
                        ExpressionAttributeNames: {
                            ...finalQuery.ExpressionAttributeNames,
                            [`#kn${attributeIndex}`]: filter.attributeName
                        },
                        ExpressionAttributeValues: {
                            ...finalQuery.ExpressionAttributeValues,
                            [`:kv${attributeIndex}`]: {
                                [`${filter.attributeType?.value}`]: filter.attributeValue
                            }
                        }
                    }
                });
            }

            return finalQuery;
        }

        props.onRunQuery(scanQuery, buildQuery());
    }

    const resetScanQuery = () => {
        setScanQuery(QueryType.SCAN);
        setFilters(defaultFilters);
        setPartitionKeyQuery('');
        setSortKeyQuery('');
        setSortKeyBetweenQuery('');
        setProjectionOption(getProjectionOptions()[0]);
        setProjectionAttributes([]);
        setProjectionAttributeName('');
    }


    return <>

        <SpaceBetween size="l">

            <ExpandableSection
                variant="container"
                headerText="Scan or query items"
                defaultExpanded={true}
            >
                <SpaceBetween size="l">
                    <div className="radio-group-container">
                        <RadioGroup
                            onChange={({ detail }) => setScanQuery(detail.value)}
                            value={scanQuery}
                            items={[
                                { label: QueryType.SCAN, value: QueryType.SCAN },
                                { label: QueryType.QUERY, value: QueryType.QUERY }
                            ]}
                        />
                    </div>

                    <ColumnLayout columns={2} variant="text-grid">
                        <FormField
                            label="Select a table or index"
                            stretch={true}
                        >
                            <Select
                                selectedOption={selectedOption}
                                onChange={({ detail }) => {
                                    setSelectedOption(detail.selectedOption);
                                }}
                                options={getSelectOptions()}
                            />
                        </FormField>

                        <FormField
                            label="Select attribute projection"
                        >
                            <Select
                                selectedOption={projectionOption}
                                onChange={({ detail }) => {
                                    setProjectionOption(detail.selectedOption)
                                    setProjectionAttributes([]);
                                    setProjectionAttributeName('');
                                }}
                                options={getProjectionOptions()}
                            />
                        </FormField>
                    </ColumnLayout>

                    {projectionOption.value === 'specific' && <FormField>
                        <Grid
                            gridDefinition={[{ colspan: 6 }, { colspan: 2 }]}
                        >
                            <Input
                                onChange={({ detail }) => setProjectionAttributeName(detail.value)}
                                value={projectionAttributeName}
                                placeholder="Search"
                                type="search"
                            />
                            <Button onClick={addAttributeProjection}>Add attribute</Button>
                        </Grid>
                        <TokenGroup
                            onDismiss={({ detail: { itemIndex } }) => {
                                setProjectionAttributes([
                                    ...projectionAttributes.slice(0, itemIndex),
                                    ...projectionAttributes.slice(itemIndex + 1)
                                ]);
                            }}
                            items={projectionAttributes}
                        />
                    </FormField>
                    }

                    {scanQuery === QueryType.QUERY && (
                        <>
                            <FormField
                                label={getPartitionKeyName() + " (Partition key)"}
                            >
                                <Input
                                    onChange={({ detail }) => setPartitionKeyQuery(detail.value)}
                                    value={partitionKeyQuery}
                                    placeholder="Enter partition key value"
                                />
                            </FormField>

                            {hasSortKey() && (
                                <FormField
                                    label={getSortKeyName() + " (Sort key)"}
                                    stretch={true}
                                >
                                    <Grid
                                        gridDefinition={[{ colspan: 2 }, { colspan: 6 }, { colspan: 2 }]}
                                    >
                                        <Select
                                            selectedOption={sortKeyConditionOption}
                                            onChange={({ detail }) => {
                                                setSortKeyConditionOption(detail.selectedOption);
                                            }}
                                            options={getSortKeyConditionOptions()}
                                        />
                                        <Input
                                            onChange={({ detail }) => setSortKeyQuery(detail.value)}
                                            value={sortKeyQuery}
                                            placeholder="Enter sort key value"
                                        />
                                        <Checkbox
                                            onChange={({ detail }) =>
                                                setSortDescChecked(detail.checked)
                                            }
                                            checked={sortDescChecked}
                                        >
                                            Sort descending
                                        </Checkbox>
                                    </Grid>
                                    {sortKeyConditionOption.value === 'between' && (
                                        <Grid
                                            gridDefinition={[{ colspan: 6, offset: { xxs: 2 } }]}
                                        >
                                            <SpaceBetween size="m">
                                                <span>and</span>
                                                <Input
                                                    onChange={({ detail }) => setSortKeyBetweenQuery(detail.value)}
                                                    value={sortKeyBetweenQuery}
                                                    placeholder="Enter sort key value"
                                                />
                                            </SpaceBetween>
                                        </Grid>
                                    )}

                                </FormField>
                            )}
                        </>
                    )}
                    <div></div>

                    <div className="separator"></div>
                    <ExpandableSection
                        variant="footer"
                        headerText="Filters"
                    >


                        <SpaceBetween size="m">
                            {filters.map((filter, index) => (<div key={index}>

                                <Grid
                                    gridDefinition={[{ colspan: 2 }, { colspan: 2 }, { colspan: 2 }, { colspan: 2 }, { colspan: 4 }]}
                                >
                                    <SpaceBetween size="s">
                                        {index === 0 && (
                                            <span><b>Attribute name</b></span>
                                        )}
                                        <Input
                                            onChange={({ detail }) => {
                                                setFilters(prevFilters => {
                                                    const newFilters = [...prevFilters];
                                                    newFilters[index].attributeName = detail.value;
                                                    return newFilters;
                                                })
                                            }}
                                            value={filter.attributeName}
                                            placeholder="Enter attribute name"
                                        />
                                    </SpaceBetween>

                                    <SpaceBetween size="s">
                                        {index === 0 && (
                                            <span><b>Type</b></span>
                                        )}
                                        <Select
                                            selectedOption={filter.attributeType}
                                            onChange={({ detail }) => {
                                                setFilters(prevFilters => {
                                                    const newFilters = [...prevFilters];
                                                    newFilters[index].attributeType = detail.selectedOption;
                                                    newFilters[index].filterCondition = getAttributeConditionOptions(detail.selectedOption.value || '')[0];
                                                    return newFilters;
                                                })
                                            }}
                                            options={getAttributeTypeOptions()}
                                        />
                                    </SpaceBetween>

                                    <SpaceBetween size="s">
                                        {index === 0 && (
                                            <span><b>Condition</b></span>
                                        )}
                                        <Select
                                            selectedOption={filter.filterCondition}
                                            onChange={({ detail }) => {
                                                setFilters(prevFilters => {
                                                    const newFilters = [...prevFilters];
                                                    newFilters[index].filterCondition = detail.selectedOption;
                                                    return newFilters;
                                                })
                                            }}
                                            options={getAttributeConditionOptions(filter.attributeType?.value || '')}
                                        />
                                    </SpaceBetween>


                                    <SpaceBetween size="s">
                                        {index === 0 && (
                                            <span><b>Value</b></span>
                                        )}
                                        {showAttributeValueTextBox(filter.attributeType?.value || '', filter.filterCondition?.value || '') &&
                                            <>
                                                <Input
                                                    onChange={({ detail }) => {
                                                        setFilters(prevFilters => {
                                                            const newFilters = [...prevFilters];
                                                            newFilters[index].attributeValue = detail.value;
                                                            return newFilters;
                                                        })
                                                    }}
                                                    value={filter.attributeValue}
                                                    placeholder="Enter attribute value"
                                                />
                                                {filter.filterCondition?.value === 'between' && (
                                                    <SpaceBetween size="m">
                                                        <span>and</span>
                                                        <Input
                                                            onChange={({ detail }) => {
                                                                setFilters(prevFilters => {
                                                                    const newFilters = [...prevFilters];
                                                                    newFilters[index].attributeValue2 = detail.value;
                                                                    return newFilters;
                                                                })
                                                            }}
                                                            value={filter.attributeValue2!}
                                                            placeholder="Enter attribute value"
                                                        />
                                                    </SpaceBetween>
                                                )}
                                            </>
                                        }
                                    </SpaceBetween>


                                    <SpaceBetween size="s">
                                        {index === 0 && (
                                            <span><b>&nbsp;</b></span>
                                        )}
                                        <Button onClick={() => handleRemoveFilter(index)}>Remove</Button>
                                    </SpaceBetween>

                                </Grid>

                            </div>))}
                            <Button onClick={() => handleAddFilter()}>Add filter</Button>
                        </SpaceBetween>
                    </ExpandableSection>
                    <div className="separator"></div>

                    <SpaceBetween direction="horizontal" size="m">
                        <Button
                            variant="primary"
                            onClick={runScanQuery}
                        >Run</Button>
                        <Button
                            variant="normal"
                            onClick={resetScanQuery}
                        >Reset</Button>
                    </SpaceBetween>
                </SpaceBetween>

            </ExpandableSection>

        </SpaceBetween>
    </>

}