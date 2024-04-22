import { useEffect, useState } from "react";

export interface AppFavorite {
    environment: string;
    region: string;
    path: string;
    name: string;
    id: string;
}

export const useFavorites = () => {

    const [favorites, setFavorites] = useState<AppFavorite[]>([]);

    useEffect(() => {
        const getFavorites = async () => {

            const favorites = [] as AppFavorite[];

            if (favorites.length) {
                setFavorites(favorites);
            }
        }
        getFavorites();
    }, []);

    const addToFavorites = async (fav: AppFavorite) => {


        setFavorites(prevFavorites => {
            if (prevFavorites.map(p => p.name).includes(fav.name)) {
                return prevFavorites.filter(f => f.name !== fav.name);
            }
            return [...prevFavorites, fav];
        });
    }

    return { favorites, addToFavorites };
}