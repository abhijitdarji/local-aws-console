import { useState, useEffect } from "react";
import { useCachedData } from "../hooks/use-cached-data";
import { LoadingErrorEmptyHandler } from "./LoadingErrorEmptyHandler";
import { ViewCode } from "./ViewCode";

type ViewRolePolicyDocumentProps = {
    roleName: string;
    policyName: string;
}

export const ViewRolePolicyDocument = ({ roleName, policyName }: ViewRolePolicyDocumentProps) => {

    const [policyDocument, setPolicyDocument] = useState<any>({});

    const { data, isLoading, isError, errorMessage } = useCachedData<any>({
        method: 'POST',
        url: '/aws/IAM/GetRolePolicy',
        forceFetch: false,
        body: { RoleName: roleName, PolicyName: policyName }
    });

    useEffect(() => {
        if (data?.PolicyDocument) {
            try {
                let formattedDocument = JSON.stringify(JSON.parse(decodeURIComponent(data.PolicyDocument)), null, 2)
                setPolicyDocument(formattedDocument);
            } catch (error) {
                setPolicyDocument("cannot parse");
            }

        }
    }, [data]);

    return (
        <>
            <LoadingErrorEmptyHandler
                isLoading={isLoading}
                isError={isError}
                errorMessage={errorMessage}
                dataLength={Object.keys(policyDocument || {}).length}>

                <h3>{policyName}</h3>
                <ViewCode language="json" code={policyDocument} />
            </LoadingErrorEmptyHandler>
        </>
    );
}