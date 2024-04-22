import { createContext, useState, ReactNode, useEffect } from "react";
import { useCachedData } from "../hooks/use-cached-data";
import localForage from "localforage";
import { APIUtils } from "../utility/api";

type Environments = {
    sso: string[];
    key: string[];
};

export type Region = {
    code: string;
    name: string;
}

export type GlobalContextType = {
    environments: string[];
    environment: string;
    accountId: string;
    regions: Region[];
    region: string;
    setEnvironment: (value: string) => void;
    setRegion: (value: string) => void;
}

export const GlobalContext = createContext<GlobalContextType>({
    environments: [],
    environment: '',
    accountId: '',
    regions: [],
    region: '',
    setEnvironment: () => { },
    setRegion: () => { }
});

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
    const [environments, setEnvironments] = useState<string[]>([]);
    const [environment, setEnvironment] = useState<string>('');
    const [regions, setRegions] = useState<Region[]>([]);
    const [region, setRegion] = useState<string>('');
    const [accountId, setAccountId] = useState<string>('');

    const { data } = useCachedData<Environments>({
        method: 'GET',
        url: '/app/settings/environments',
        forceFetch: false,
        configMode: true
    });

    useEffect(() => {
        setEnvironments(data ? data.sso.concat(data.key) : []);
    }, [data]);

    const { data: regdata } = useCachedData<Region[]>({
        method: 'GET',
        url: '/app/settings/regions',
        forceFetch: false,
        configMode: true
    });

    useEffect(() => {
        setRegions(regdata ?? []);
    }, [regdata]);

    useEffect(() => {
        const fetchSavedData = async () => {
            const savedEnvironment = await localForage.getItem<string>('environment');
            const savedRegion = await localForage.getItem<string>('region');
            const savedAccountId = await localForage.getItem<string>('accountId');
            setEnvironment(savedEnvironment ?? '');
            setRegion(savedRegion ?? '');
            setAccountId(savedAccountId ?? '');
        };

        fetchSavedData();
    }, []);


    const handleEnvironmentChange = (value: string) => {
        setEnvironment(value);
        localForage.setItem('environment', value);
    };

    const handleAccountIdChange = (value: string) => {
        setAccountId(value);
        localForage.setItem('accountId', value);
    }

    useEffect(() => {

        if (!environment) return;

        const fetchAccountId = async () => {
            const response = await APIUtils.getCachedData<any>({
                method: 'GET',
                url: `/app/settings/environments/${environment}/validate`,
                forceFetch: false,
                configMode: true
            });

            if (response?.isError) {
                console.error(response.errorMessage);
                return;
            }

            if(response?.data?.Account){
                handleAccountIdChange(response.data.Account);
            }
        };

        fetchAccountId();

    }, [environment]);


    const handleRegionChange = (value: string) => {
        setRegion(value);
        localForage.setItem('region', value);
    };

    const contextValue = {
        environments,
        environment,
        accountId,
        regions,
        region,
        setEnvironment: handleEnvironmentChange,
        setRegion: handleRegionChange,
    };

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    );
};

