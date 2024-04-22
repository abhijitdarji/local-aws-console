
import { useState, useEffect, useContext, useMemo } from 'react';
import { useCachedData } from '../../hooks/use-cached-data';
import {
    ContentLayout, Header, SpaceBetween, Button, Box, Cards, Link,
    TextFilter, ButtonDropdown
} from '@cloudscape-design/components';
import { LoadingErrorEmptyHandler } from '../../components/LoadingErrorEmptyHandler';
import { useNavigate } from 'react-router-dom';
import { GlobalContext, GlobalContextType } from '../../context/GlobalContext';
import { APIUtils } from '../../utility/api';
import { NotificationContext, NotificationContextValue } from '../../context/NotificationsContext';
import { RefreshButton } from '../../components/RefreshButton';

export const Favorites = () => {

    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const reload = queryParams.get('reload');
    const defaultApiParams = {
        method: 'GET',
        url: '/app/db/favorites',
        headers: {},
        body: {},
        forceFetch: 0
    };
    const [apiParams, setApiParams] = useState(defaultApiParams);
    const { data, isLoading, isError, errorMessage, lastFetched } = useCachedData<any[]>(apiParams);
    const [favorites, setFavorites] = useState<any[]>([]);
    const { environment, region, setEnvironment, setRegion } = useContext(GlobalContext) as GlobalContextType;
    const { notify } = useContext(NotificationContext) as NotificationContextValue;
    const [clickedFavorite, setClickedFavorite] = useState<any | null>(null);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        if (data) {
            setFavorites(data);
        }
    }, [data]);

    useEffect(() => {
        if (reload) {
            forceFetch();
        }
    }, [reload]);

    const forceFetch = () => {
        setApiParams((prevParams: any) => ({
            ...prevParams,
            forceFetch: prevParams.forceFetch + 1
        }))
    }

    const onFavoriteClick = (favorite: any) => {
        if (region !== favorite.region) {
            setRegion(favorite.region);
            setClickedFavorite(favorite);
        }
        if (environment !== favorite.environment) {
            setEnvironment(favorite.environment);
            setClickedFavorite(favorite);
        }
        if (region === favorite.region && environment === favorite.environment) {
            navigate(favorite.path);
        }
    }

    const filteredFavorites = useMemo(() => {

        return favorites.filter(favorite => {
            return favorite.name.toLowerCase().includes(filter.toLowerCase()) ||
                favorite.path.toLowerCase().includes(filter.toLowerCase()) ||
                favorite.environment.toLowerCase().includes(filter.toLowerCase()) ||
                favorite.region.toLowerCase().includes(filter.toLowerCase());
        });

    }, [favorites, filter]);


    useEffect(() => {
        if (clickedFavorite) {
            navigate(clickedFavorite.path);
        }
    }, [region, environment, clickedFavorite]);

    const removeFavorite = async (item: any) => {

        const response = await APIUtils.getData({
            method: 'DELETE',
            url: `/app/db/favorites/${item.id}`,
            headers: {},
            body: {}
        });

        if (response.isError) {
            notify({ type: 'error', content: response.errorMessage });
            return;
        }

        forceFetch();
    }

    const editFavorite = (item: any) => {
        navigate(`edit/${item.id}`);
    }


    return (
        <>
            <ContentLayout
                header={<Header variant="h1" actions={
                    <SpaceBetween
                        direction="horizontal"
                        size="xs"
                    >
                        <RefreshButton onClick={forceFetch} lastFetched={lastFetched} />
                        <Button onClick={() => {
                            navigate('add');
                        }} >Add Favorite</Button>

                    </SpaceBetween>
                }>Favorites</Header>}
            >
                <LoadingErrorEmptyHandler
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage={errorMessage}
                    dataLength={favorites?.length}>

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
                                    <Link href={item.path} fontSize="heading-m" onFollow={(event) => {
                                        event.preventDefault();
                                        onFavoriteClick(item)
                                    }}>
                                        {item.name}
                                    </Link>
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
                                                    editFavorite(item);
                                                    break;
                                                case "rm":
                                                    removeFavorite(item);
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
                                    id: "environment",
                                    header: "Environment",
                                    content: item => item.environment
                                },
                                {
                                    id: "region",
                                    header: "Region",
                                    content: item => item.region
                                }
                            ]
                        }}
                        cardsPerRow={[
                            { cards: 1 },
                            { minWidth: 500, cards: 4 }
                        ]}
                        items={filteredFavorites}
                        loadingText="Loading favorites"
                        empty={
                            <Box
                                margin={{ vertical: "xs" }}
                                textAlign="center"
                                color="inherit"
                            >
                                <SpaceBetween size="m">
                                    <b>No favorites</b>
                                    {filter !== '' &&
                                        <Button onClick={() => { setFilter('') }}>Clear filter</Button>
                                    }
                                    {favorites.length === 0 && filter === '' &&
                                        <Button>Add Favorite</Button>
                                    }
                                </SpaceBetween>
                            </Box>
                        }
                        header={<Header>
                            <div style={{
                                width: "500px"
                            }}>
                                <TextFilter filteringPlaceholder="Filter favorites" filteringText={filter} onChange={({ detail }) => {
                                    setFilter(detail.filteringText);
                                }} />
                            </div>
                        </Header>}
                    />

                </LoadingErrorEmptyHandler>
            </ContentLayout>

        </>
    );
}