
import { useContext, useState } from "react";
import { ContentLayout, Header, SpaceBetween, Button } from "@cloudscape-design/components";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { useParams } from "react-router-dom";
import { SecretDetails } from "./SecretDetails";
import { SecretValue } from "./SecretValue";
import { RefreshButton } from "../../components/RefreshButton";


export const ViewSecret = () => {
    const { region } = useContext(GlobalContext) as GlobalContextType;
    const { secretId } = useParams();
    const [fetch, setFetch] = useState<number>(0);

    const forceFetch = () => {
        setFetch(prevFetch => prevFetch + 1);
    }

    const awsUrl = `https://${region}.console.aws.amazon.com/secretsmanager/secret?name=${secretId}&region=${region}`

    return <>

        <ContentLayout
            header={<Header
                variant="h1"
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <RefreshButton onClick={forceFetch} />

                        <Button
                            href={awsUrl}
                            iconAlign="right"
                            iconName="external"
                            target="_blank">View on AWS</Button>
                    </SpaceBetween>
                }
            >
                {decodeURIComponent(secretId || '')}
            </Header>}
        >

            {secretId && <SpaceBetween size="l">
                <SecretDetails secretId={secretId || ''} forceFetch={fetch} />
                <SecretValue secretId={secretId || ''} forceFetch={fetch} />
            </SpaceBetween>
            }


        </ContentLayout>
    </>
};