import { useState, useEffect, useContext } from "react";
import { GlobalContext, GlobalContextType } from "../context/GlobalContext";

import { APIUtils, ApiRequestInput, ApiResponseDataType } from "../utility/api";


export function useLiveData<T>({ method, url, headers, body, fetchAllPages, forceFetch }: ApiRequestInput): ApiResponseDataType<T> {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [data, setData] = useState<T | null>(null);
    const { environment, region } = useContext(GlobalContext) as GlobalContextType;

    if (fetchAllPages) {
        url = `${url}?fetchAllPages=true`;
    }

    const getDataFromApi = async () => {
        if (!environment || !region) {
            setIsError(true);
            setErrorMessage('Environment or region is not set.');
            return;
        }

        return APIUtils.getData<T>({
            method,
            url,
            headers,
            body,
            environment,
            region
        });

    }

    useEffect(() => {
        const fetchFromServer = async () => {

            setIsLoading(true);
            const response = await getDataFromApi();

            if (response) {
                if (response.isError) {
                    setIsError(true);
                    setErrorMessage(response.errorMessage || '');
                    setIsLoading(false);
                } else {
                    setData(response.data);
                    setIsLoading(false);
                }
            }

        };
        fetchFromServer();
    }, [environment, region, url, forceFetch]);


    return { data, isLoading, isError, errorMessage } as ApiResponseDataType<T>;
};