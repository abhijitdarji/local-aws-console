import { useState, useEffect } from "react";
import { SpaceBetween, Table, Header, Modal, Button, TableProps } from "@cloudscape-design/components";
import { useCachedData } from "../hooks/use-cached-data";
import { LoadingErrorEmptyHandler } from "./LoadingErrorEmptyHandler";
import { ViewRolePolicyDocument } from "./ViewRolePolicyDocument";

type ViewRolePolicyProps = {
    roleName: string;
}

type PolicyType = {
    PolicyName: string;
    Type: string;
    PolicyArn: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<PolicyType>[] = [
    {
        id: 'PolicyName',
        header: 'PolicyName',
        cell: item => item.PolicyName,
        isRowHeader: true,
    },
    {
        id: 'Type',
        header: 'Policy Type',
        cell: item => item.Type,
    },
    {
        id: 'PolicyArn',
        header: 'Policy ARN',
        cell: item => item.PolicyArn,
    }
];

export const ViewRolePolicy = ({ roleName }: ViewRolePolicyProps) => {

    const [rolePolicies, setRolePolicies] = useState<any>({});
    const [selectedItems, setSelectedItems] = useState(([] as PolicyType[]));
    const [showPolicyDocument, setShowPolicyDocument] = useState(false);

    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/IAM/ListRolePolicies',
        forceFetch: false,
        body: { RoleName: roleName }
    });

    const { data: attachedData } = useCachedData<any>({
        method: 'POST',
        url: '/aws/IAM/ListAttachedRolePolicies',
        forceFetch: false,
        body: { RoleName: roleName }
    });

    useEffect(() => {
        if (data && attachedData) {

            const allPolicies = {
                Policies: [...data.PolicyNames.map((policyName: string) => {
                    return {
                        PolicyName: policyName,
                        Type: 'Inline',
                        PolicyArn: ''
                    }
                }),
                ...attachedData.AttachedPolicies.map((policy: any) => {
                    return {
                        PolicyName: policy.PolicyName,
                        Type: 'Attached',
                        PolicyArn: policy.PolicyArn
                    }
                })
                ],
            }

            setRolePolicies(allPolicies);
        }
    }, [data, attachedData]);


    const handleViewPolicyDocument = () => {
        if (selectedItems.length > 0) {
            setShowPolicyDocument(true);
        }
    }

    return <>
        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={rolePolicies?.Policies?.length}>

            <SpaceBetween size="l">
                <Table
                    columnDefinitions={COLUMN_DEFINITIONS}
                    items={rolePolicies?.Policies}
                    selectionType="single"
                    variant="borderless"
                    selectedItems={selectedItems}
                    onSelectionChange={event => {
                        return setSelectedItems(event.detail.selectedItems);
                    }}
                    header={
                        <Header
                            variant="h3"
                            counter={`(${rolePolicies?.Policies?.length})`}
                        >
                            Policies
                        </Header>
                    }
                />
                <Button onClick={handleViewPolicyDocument} disabled={!selectedItems.length} >View Policy Document</Button>
                <Modal
                    size="large"
                    visible={showPolicyDocument}
                    onDismiss={() => setShowPolicyDocument(false)}
                    header="Policy Document"
                >
                    {showPolicyDocument && selectedItems?.length &&
                        <ViewRolePolicyDocument roleName={roleName} policyName={selectedItems[0].PolicyName} />
                    }
                </Modal>

            </SpaceBetween>
        </LoadingErrorEmptyHandler>
    </>
}