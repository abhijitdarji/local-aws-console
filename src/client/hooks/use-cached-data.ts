import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { GlobalContext, GlobalContextType } from "../context/GlobalContext";

import { APIUtils, ApiRequestInput, ApiResponseDataType } from "../utility/api";


export function useCachedData<T>({ method, url, headers, body, forceFetch, fetchAllPages, configMode }: ApiRequestInput): ApiResponseDataType<T> {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [lastFetched, setLastFetched] = useState<number>(0);
    const [data, setData] = useState<T | null>(null);
    const { environment, region } = useContext(GlobalContext) as GlobalContextType;

    const bodyHash = btoa(JSON.stringify(body || {}));
    const memoizedBody = useMemo(() => bodyHash, [body]);

    const getDataFromApi = async () => {
        if (!configMode && (!environment || !region)) {
            setIsError(true);
            setErrorMessage('Environment or region is not set.');
            return;
        }

        return APIUtils.getCachedData<T>({
            method,
            url,
            headers,
            body,
            environment,
            region,
            forceFetch,
            fetchAllPages
        })

    }

    const fetchData = useCallback(async () => {

        setIsLoading(true);
        const response = await getDataFromApi();

        if (response) {
            if (response.isError) {
                setIsError(true);
                setErrorMessage(response.errorMessage || '');
                setIsLoading(false);
                setLastFetched(response.lastFetched);
            } else {
                setData(response.data);
                setIsLoading(false);
                setIsError(false);
                setLastFetched(response.lastFetched);
            }
        }

    }, [environment, region, url, memoizedBody, forceFetch]);

    useEffect(() => {
        const fetchFromServer = async () => {

            if (!configMode && (environment && region)) {
                await fetchData();
            }

            if (configMode) {
                await fetchData();
            }
        };
        fetchFromServer();
    }, [environment, region, fetchData]);


    return { data, isLoading, isError, errorMessage, lastFetched } as ApiResponseDataType<T>;
};