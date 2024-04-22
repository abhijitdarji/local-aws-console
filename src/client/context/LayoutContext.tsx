import { AppLayoutProps } from '@cloudscape-design/components';
import { Dispatch, ReactNode, SetStateAction, createContext, useState } from 'react';

export interface LayoutContextValue {
    tools: ReactNode;
    setTools: Dispatch<SetStateAction<ReactNode>>;
    toolsHide: boolean;
    setToolsHide: Dispatch<SetStateAction<boolean>>;
    splitPanel: ReactNode;
    setSplitPanel: Dispatch<SetStateAction<ReactNode>>;
    drawers: AppLayoutProps.Drawer[];
    setDrawers: Dispatch<SetStateAction<AppLayoutProps.Drawer[]>>;
    activeDrawerId: string | null;
    setActiveDrawerId: Dispatch<SetStateAction<string | null>>;
}

export const LayoutContext = createContext<LayoutContextValue>({
    tools: null,
    setTools: () => { },
    toolsHide: true,
    setToolsHide: () => { },
    splitPanel: null,
    setSplitPanel: () => { },
    drawers: [],
    setDrawers: () => { },
    activeDrawerId: '',
    setActiveDrawerId: () => { },
});

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [tools, setTools] = useState<ReactNode>(null);
    const [toolsHide, setToolsHide] = useState<boolean>(true);
    const [splitPanel, setSplitPanel] = useState<ReactNode>(null);
    const [drawers, setDrawers] = useState<AppLayoutProps.Drawer[]>([]);
    const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null);

    return (
        <LayoutContext.Provider value={{ tools, setTools, toolsHide, setToolsHide, splitPanel, setSplitPanel, drawers, setDrawers, activeDrawerId, setActiveDrawerId }}>
            {children}
        </LayoutContext.Provider>
    );
};