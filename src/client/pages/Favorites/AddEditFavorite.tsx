import {
    SpaceBetween, Button, Container, Header, FormField, Input, Select,
    ContentLayout, SelectProps, Form
} from "@cloudscape-design/components";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { APIUtils } from "../../utility/api";
import { NotificationContext, NotificationContextValue } from "../../context/NotificationsContext";
import { GlobalContext, GlobalContextType } from "../../context/GlobalContext";
import { LoadingErrorEmptyHandler } from "../../components/LoadingErrorEmptyHandler";
import { useForm } from "../../hooks/use-form";


interface FormValues {
    name: string;
    path: string;
    environment: SelectProps.Option;
    region: SelectProps.Option;
}

export const AddEditFavorite = () => {

    const navigate = useNavigate();
    const { id } = useParams();
    const { notify } = useContext(NotificationContext) as NotificationContextValue;
    const { environments, regions } = useContext(GlobalContext) as GlobalContextType;
    const [formMode] = useState<'add' | 'edit'>(id ? 'edit' : 'add');

    const [data, setData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const defaultFormValues: FormValues = {
        name: '',
        path: '',
        environment: { value: '' },
        region: { value: '' }
    };

    const { data: formData, onChange, errors, validate, errorRef } = useForm({
        initialValue: () => ({
            ...defaultFormValues,
        }),
        validate: (form) => {
            const errors: Record<string, string | string[]> = {};
            const name = form.name.trim();
            const path = form.path.trim();
            const environment = form.environment;
            const region = form.region;

            // check all fields
            // or do "else if" for each errors shown one by one
            if (name.trim().length === 0) {
                errors.name = "Name is required";
            }
            if (path.trim().length === 0) {
                errors.path = "Path is required";
            }
            if (!environment || !environment?.value) {
                errors.environment = "Environment is required";
            }
            if (!region || !region?.value) {
                errors.region = "Region is required";
            }

            return errors;
        },
    });

    useEffect(() => {
        const getEditData = async () => {
            if (formMode === 'edit' && id) {
                const response = await APIUtils.getData<any>({
                    method: 'GET',
                    url: `/app/db/favorites/${id}`,
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
                        path: response.data.path,
                        environment: { value: response.data.environment },
                        region: { value: response.data.region }
                    });
                }
            }
        };
        getEditData();

    }, [formMode, id]);

    const goBackToFavorites = (reload: boolean) => {
        if (reload) {
            navigate('/favorites?reload=true');
        } else {
            navigate('/favorites');
        }
    }

    const saveFavorite = () => async () => {

        if (!validate()) return;

        const newFavorite = {
            name: formData.name,
            path: formData.path,
            environment: formData.environment.value,
            region: formData.region.value
        };
        let response;

        if (formMode === 'add') {
            // add favorite
            response = await APIUtils.getData({
                method: 'POST',
                url: '/app/db/favorites',
                headers: {},
                body: newFavorite
            });
        } else {
            // edit favorite
            response = await APIUtils.getData({
                method: 'PATCH',
                url: `/app/db/favorites/${id}`,
                headers: {},
                body: newFavorite
            });
        }

        if (response?.isError) {
            notify({ type: 'error', content: response.errorMessage });
            return;
        }

        goBackToFavorites(true);
    }


    return <>
        <ContentLayout
            header={<Header variant="h1" actions={
                <SpaceBetween
                    direction="horizontal"
                    size="xs"
                >
                    <Button onClick={() => goBackToFavorites(false)} >Cancel</Button>

                </SpaceBetween>
            }>{formMode === 'add' ? "Add" : "Edit"} favorite</Header>}
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
                            <Button formAction="none" variant="link" onClick={() => goBackToFavorites(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveFavorite()}> {formMode === 'add' ? "Add" : "Save"} </Button>
                        </SpaceBetween>
                    }
                >
                    <Container>
                        <SpaceBetween direction="vertical" size="l">
                            <Header variant="h2">
                                {formMode === 'add' ? "Add" : "Edit"} favorite
                            </Header>
                            <FormField label="Name" errorText={errors.name}>
                                <Input value={formData.name} onChange={({ detail: { value } }) =>
                                    onChange({ name: value })
                                } ref={errorRef.name} />
                            </FormField>
                            <FormField label="Path" errorText={errors.path}>
                                <Input value={formData.path} onChange={({ detail: { value } }) =>
                                    onChange({ path: value })
                                } ref={errorRef.path} />
                            </FormField>
                            <FormField label="Environment" errorText={errors.environment}>
                                <Select
                                    selectedOption={formData.environment}
                                    onChange={({ detail }) =>
                                        onChange({ environment: detail.selectedOption })
                                    }
                                    options={environments.map(env => ({ label: env, value: env }))}
                                    ref={errorRef.environment}
                                />
                            </FormField>
                            <FormField label="Region" errorText={errors.region}>
                                <Select
                                    selectedOption={formData.region}
                                    onChange={({ detail }) =>
                                        onChange({ region: detail.selectedOption })
                                    }
                                    options={regions.map(region => ({ label: region.name, value: region.code }))}
                                    ref={errorRef.region}
                                />
                            </FormField>
                        </SpaceBetween>
                    </Container>
                </Form>
            </form>
        </ContentLayout>
    </>
}