
import { useState, useEffect } from "react";
import { useCachedData } from "../../hooks/use-cached-data";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { KeyValueTable } from "../../components/KeyValueTable";
import { Container, Header } from "@cloudscape-design/components";

interface SecretValueProps {
    secretId: string;
    forceFetch?: number;
}

export const SecretValue = ({ secretId, forceFetch }: SecretValueProps) => {
    const [secretValue, setSecretValue] = useState<any>({});
    const [secretType, setSecretType] = useState<string>('JSON');

    const defaultParams = {
        method: 'POST',
        url: '/aws/SecretsManager/GetSecretValue',
        forceFetch: false,
        body: {
            SecretId: secretId
        }
    };

    const [apiParams, setApiParams] = useState<any>(defaultParams);

    const { data, isLoading, isError, errorMessage } = useCachedData<any>(apiParams);

    useEffect(() => {
        if (data) {
            try {
                const secretString = JSON.parse(data.SecretString);
                setSecretType('JSON');
                setSecretValue(secretString);
            } catch (error) {
                setSecretValue(data.SecretString);
                setSecretType('String');
            }
        }
    }, [data]);

    useEffect(() => {
        setApiParams({
            ...defaultParams,
            forceFetch: forceFetch
        });
    }, [forceFetch]);

    return <>

        <LoadingErrorEmptyHandler
            isLoading={isLoading}
            isError={isError}
            errorMessage={errorMessage}
            dataLength={secretType === 'JSON' ? Object.keys(secretValue || {}).length : secretValue?.length}>

            {secretType === 'JSON' &&
                <KeyValueTable headerText="Secret value" keyValueObject={secretValue || []} />
            }
            {secretType === 'String' &&
                <Container
                    header={
                        <Header
                            variant="h2"
                        >
                            Secret value
                        </Header>
                    }
                >
                    {secretValue}
                </Container>
            }

        </LoadingErrorEmptyHandler>

    </>
};