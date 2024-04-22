import axios, { AxiosHeaders } from "axios";
import { Constants } from "./constants";
import { SaveCacheDataType, CacheHelper } from "../utility/cache";

export type ApiResponseDataType<T> = {
    data: T;
    isLoading: boolean;
    isError: boolean;
    errorMessage: string;
    lastFetched: number;
};

export type ApiRequestInput = {
    method: string;
    url: string;
    headers?: any;
    body?: any;
    environment?: string;
    region?: string;
    forceFetch?: boolean | number;
    fetchAllPages?: boolean;
    configMode?: boolean;
};

export abstract class APIUtils {
    static async getData<T>(_options: ApiRequestInput): Promise<ApiResponseDataType<T>> {
        return axios({
            method: _options.method,
            url: `${Constants.API_URL}${_options.url}`,
            data: _options.method !== 'GET' ? JSON.stringify(_options.body) : undefined,
            headers: {
                'Content-Type': 'application/json',
                'x-api-environment': _options.environment,
                'x-api-region': _options.region,
                ..._options.headers ? _options.headers : {}
            }
        })
            .then(response => {
                return {
                    data: response.data as T,
                    isLoading: false,
                    isError: false,
                    errorMessage: '',
                    lastFetched: Date.now()
                };
            })
            .catch(e => {
                return {
                    data: {} as T,
                    isLoading: false,
                    isError: true,
                    errorMessage: e.response?.data?.error || e.message,
                    lastFetched: Date.now()
                };
            });
    }

    static async getCachedData<T>({ method, url, headers, body, environment, region, forceFetch, fetchAllPages }: ApiRequestInput): Promise<ApiResponseDataType<T>> {
        const apiUrl = `${Constants.API_URL}${url}?fetchAllPages=${fetchAllPages}`;

        const newHeaders = new AxiosHeaders();
        newHeaders.set('Content-Type', 'application/json');
        newHeaders.set('x-api-environment', environment);
        newHeaders.set('x-api-region', region);

        if (headers) {
            Object.keys(headers).forEach(key => {
                newHeaders.set(key, headers[key]);
            });
        }

        const bodyHash = btoa(JSON.stringify(body || {}));

        const cacheKey = btoa(`${apiUrl}-${environment}-${region}-${bodyHash}`);

        const getDataFromApi = async () => {
            return axios({
                method: method,
                url: apiUrl,
                data: method !== 'GET' ? JSON.stringify(body) : undefined,
                headers: newHeaders
            })
                .then(response => {
                    const cacheValue: SaveCacheDataType<any> = { data: response.data, time: Date.now() };
                    CacheHelper.setCachedItem(cacheKey, cacheValue);
                    return {
                        data: response.data as T,
                        isLoading: false,
                        isError: false,
                        errorMessage: '',
                        lastFetched: Date.now()
                    };
                })
                .catch(e => {
                    return {
                        data: {} as T,
                        isLoading: false,
                        isError: true,
                        errorMessage: e.response?.data?.error || e.message,
                        lastFetched: Date.now()
                    };
                });
        }

        if (forceFetch) {
            console.log('Fetching data - Forced')
            return await getDataFromApi();
        } else {
            // Try to get data from cache
            return CacheHelper.getCachedItem<T>(cacheKey)
                .then(cachedData => {
                    if (cachedData && Date.now() - cachedData.time < Constants.API_CACHE_DURATION) {
                        console.log('Using cached data')
                        // If data is in cache and is less than 30 minutes old, use it
                        return {
                            data: cachedData.data as T,
                            isLoading: false,
                            isError: false,
                            errorMessage: '',
                            lastFetched: cachedData.time
                        };
                    } else {
                        console.log('Fetching data - Not in cache or old')
                        return getDataFromApi();
                    }
                })
                .catch(e => {
                    return {
                        data: {} as T,
                        isLoading: false,
                        isError: true,
                        errorMessage: e.message,
                        lastFetched: Date.now()
                    };
                });
        }
    }
}