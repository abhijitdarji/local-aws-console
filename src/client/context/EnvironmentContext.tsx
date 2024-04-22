import { ReactNode, useContext, useEffect, useState, createContext } from 'react';
import { GlobalContext, GlobalContextType } from './GlobalContext';

export type EnvironmentContextType = {
  getFilter: (page: string) => string;
  saveFilter: (page: string, filter: string) => void;
}

export const EnvironmentContext = createContext<EnvironmentContextType>({
  getFilter: () => '',
  saveFilter: () => { },
});

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  const { environment, region } = useContext(GlobalContext) as GlobalContextType;
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  const saveFilter = (page: string, filter: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [page]: filter }));
  };

  const getFilter = (page: string) => filters[page];

  // Clear filters when environment or region changes
  useEffect(() => {
    setFilters({});
  }, [environment, region]);

  return (
    <EnvironmentContext.Provider value={{ saveFilter, getFilter }}>
      {children}
    </EnvironmentContext.Provider>
  );
};