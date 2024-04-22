
import { useState, useEffect, useContext, useMemo } from 'react';
import { useCachedData } from '../../hooks/use-cached-data';
import {
    Header, SpaceBetween, Button, Box, Cards,
    TextFilter, ButtonDropdown,
    Container,
    FormField
} from '@cloudscape-design/components';
import { LoadingErrorEmptyHandler } from '../../components/LoadingErrorEmptyHandler';
import { APIUtils } from '../../utility/api';
import { NotificationContext, NotificationContextValue } from '../../context/NotificationsContext';
import { RefreshButton } from '../../components/RefreshButton';
import { AddEditSavedQueries } from './AddEditSavedQueries';


export const SavedQueries = () => {

    const defaultApiParams = {
        method: 'GET',
        url: '/app/db/savedQueries',
        headers: {},
        body: {},
        forceFetch: 0
    };
    const [apiParams, setApiParams] = useState(defaultApiParams);
    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any[]>(apiParams);
    const [savedQueries, setSavedQueries] = useState<any[]>([]);
    const { notify } = useContext(NotificationContext) as NotificationContextValue;
    const [filter, setFilter] = useState<string>('');
    const [clickedQuery, setClickedQuery] = useState<any | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);

    useEffect(() => {
        if (data) {
            setSavedQueries(data);
        }
    }, [data]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const filteredQueries = useMemo(() => {

        return savedQueries.filter(query => {
            return query.name.toLowerCase().includes(filter.toLowerCase()) ||
                query.query.toLowerCase().includes(filter.toLowerCase()) ||
                query.logGroups.toLowerCase().includes(filter.toLowerCase());
        });

    }, [savedQueries, filter]);


    const removeQuery = async (item: any) => {

        const response = await APIUtils.getData({
            method: 'DELETE',
            url: `/app/db/savedQueries/${item.id}`,
            headers: {},
            body: {}
        });

        if (response.isError) {
            notify({ type: 'error', content: response.errorMessage });
            return;
        }

        forceFetch();
    }

    const editQuery = (item: any) => {
        setShowForm(true);
        setClickedQuery(item);
    }

    const hideForm = () => {
        setShowForm(false);
        setClickedQuery(null);
    }

    const saveSuccess = () => {
        forceFetch();
        hideForm();
    }


    return (
        <>
            <Container
                header={<Header variant="h1" actions={
                    <SpaceBetween
                        direction="horizontal"
                        size="xs"
                    >
                        <RefreshButton onClick={forceFetch} lastFetched={lastFetched} />
                        <Button onClick={() => setShowForm(true)}>Add Query</Button>

                    </SpaceBetween>
                }>Saved Queries</Header>}
            >

                {showForm &&
                    <AddEditSavedQueries id={clickedQuery?.id} onCancel={hideForm} onSave={saveSuccess} />
                }

                {!showForm &&
                    <LoadingErrorEmptyHandler
                        isLoading={isLoading}
                        isError={isError}
                        errorMessage={errorMessage}
                        dataLength={savedQueries?.length}>

                        <Cards
                            cardDefinition={{
                                header: item => (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between"
                                        }}
                                    >

                                        {item.name}
                                        <ButtonDropdown
                                            items={[
                                                {
                                                    text: "Edit",
                                                    id: "edit",
                                                    disabled: false
                                                },
                                                {
                                                    text: "Delete",
                                                    id: "rm",
                                                    disabled: false
                                                }
                                            ]}
                                            variant="inline-icon"
                                            onItemClick={({ detail }) => {
                                                switch (detail.id) {
                                                    case "edit":
                                                        editQuery(item);
                                                        break;
                                                    case "rm":
                                                        removeQuery(item);
                                                        break;
                                                    default:
                                                        break;
                                                }
                                            }}
                                        />
                                    </div>
                                ),
                                sections: [
                                    {
                                        id: "query",
                                        header: "Query",
                                        content: item => item.query
                                            ? item.query.split('|').map((line: string, index: number) => {
                                                if (index === 0) return <div key={index}>{line}</div>;
                                                return <div key={index}>| {line}</div>;
                                            })
                                            : ''
                                    },
                                    {
                                        id: "logGroups",
                                        header: "Log Groups",
                                        content: item => item.logGroups
                                    }
                                ]
                            }}
                            cardsPerRow={[
                                { cards: 1 },
                                { minWidth: 500, cards: 2 }
                            ]}
                            items={filteredQueries}
                            loadingText="Loading queries"
                            empty={
                                <Box
                                    margin={{ vertical: "xs" }}
                                    textAlign="center"
                                    color="inherit"
                                >
                                    <SpaceBetween size="m">
                                        <b>No saved queries</b>
                                        {filter !== '' &&
                                            <Button onClick={() => { setFilter('') }}>Clear filter</Button>
                                        }
                                        {savedQueries.length === 0 && filter === '' &&
                                            <Button>Add Query</Button>
                                        }
                                    </SpaceBetween>
                                </Box>
                            }
                            header={<FormField label="Filter" stretch={true}>
                                <TextFilter filteringPlaceholder="Filter queries" filteringText={filter} onChange={({ detail }) => {
                                    setFilter(detail.filteringText);
                                }} />
                            </FormField>}
                        />

                    </LoadingErrorEmptyHandler>
                }
            </Container>

        </>
    );
}