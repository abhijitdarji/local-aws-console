import {
    SpaceBetween, Button, Container, Header, FormField, Input,
    ContentLayout, Form
} from "@cloudscape-design/components";
import { useContext, useEffect, useState } from "react";
import { APIUtils } from "../../utility/api";
import { NotificationContext, NotificationContextValue } from "../../context/NotificationsContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useForm } from "../../hooks/use-form";


interface AddEditSavedQueriesProps {
    id: string;
    onCancel: () => void;
    onSave: () => void;
}

interface FormValues {
    name: string;
    query: string;
    logGroups: string;
}

const RESOURCE_NAME = 'savedQueries';

export const AddEditSavedQueries = (props: AddEditSavedQueriesProps) => {

    const { notify } = useContext(NotificationContext) as NotificationContextValue;
    const [formMode] = useState<'add' | 'edit'>(props.id ? 'edit' : 'add');

    const [data, setData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const defaultFormValues: FormValues = {
        name: '',
        query: '',
        logGroups: ''
    };

    const { data: formData, onChange, errors, validate, errorRef } = useForm({
        initialValue: () => ({
            ...defaultFormValues,
        }),
        validate: (form) => {
            const errors: Record<string, string | string[]> = {};
            const name = form.name.trim();
            const query = form.query.trim();

            // check all fields
            // or do "else if" for each errors shown one by one
            if (name.trim().length === 0) {
                errors.name = "Name is required";
            }
            if (query.trim().length === 0) {
                errors.query = "Query is required";
            }
            
            return errors;
        },
    });

    useEffect(() => {
        const getEditData = async () => {
            if (formMode === 'edit' && props.id) {
                const response = await APIUtils.getData<any>({
                    method: 'GET',
                    url: `/app/db/${RESOURCE_NAME}/${props.id}`,
                });

                setIsLoading(false);

                if (response?.isError) {
                    setIsError(true);
                    setErrorMessage(response.errorMessage);
                    return;
                }

                setData(response.data);
                setIsError(response.isError);
                setErrorMessage(response.errorMessage);

                if (response.data) {
                    onChange({
                        name: response.data.name,
                        query: response.data.query,
                        logGroups: response.data.logGroups
                    });
                }
            }
        };
        getEditData();

    }, [formMode, props.id]);


    const saveQuery = () => async () => {

        if (!validate()) return;

        const newQuery = {
            name: formData.name,
            query: formData.query,
            logGroups: formData.logGroups,
        };
        let response;

        if (formMode === 'add') {
            // add query
            response = await APIUtils.getData({
                method: 'POST',
                url: `/app/db/${RESOURCE_NAME}`,
                headers: {},
                body: newQuery
            });
        } else {
            // edit query
            response = await APIUtils.getData({
                method: 'PATCH',
                url: `/app/db/${RESOURCE_NAME}/${props.id}`,
                headers: {},
                body: newQuery
            });
        }

        if (response?.isError) {
            notify({ type: 'error', content: response.errorMessage });
            return;
        }

        props.onSave();
    }


    return <>
        <ContentLayout
            header={<Header variant="h1" actions={
                <SpaceBetween
                    direction="horizontal"
                    size="xs"
                >
                    <Button onClick={props.onCancel} >Cancel</Button>

                </SpaceBetween>
            }>{formMode === 'add' ? "Add" : "Edit"} query</Header>}
        >
            {formMode === 'edit' &&
                <LoadingErrorEmptyHandler
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    dataLength={Object.keys(data || {})?.length}>
                    <></>
                </LoadingErrorEmptyHandler>
            }
            <form onSubmit={e => e.preventDefault()}>
                <Form
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button formAction="none" variant="link" onClick={props.onCancel}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveQuery()}> {formMode === 'add' ? "Add" : "Save"} </Button>
                        </SpaceBetween>
                    }
                >
                    <Container>
                        <SpaceBetween direction="vertical" size="l">
                            <FormField label="Name" errorText={errors.name}>
                                <Input value={formData.name} onChange={({ detail: { value } }) =>
                                    onChange({ name: value })
                                } ref={errorRef.name} />
                            </FormField>
                            <FormField label="Query" errorText={errors.query}>
                                <Input value={formData.query} onChange={({ detail: { value } }) =>
                                    onChange({ query: value })
                                } ref={errorRef.query} />
                            </FormField>
                            <FormField label="LogGroups">
                                <Input value={formData.logGroups} onChange={({ detail: { value } }) =>
                                    onChange({ logGroups: value })
                                } />
                            </FormField>
                        </SpaceBetween>
                    </Container>
                </Form>
            </form>
        </ContentLayout>
    </>
}