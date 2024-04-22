import TopNavigation from "@cloudscape-design/components/top-navigation";
import logo from "../assets/aws.svg";
import { useContext, useState, useEffect } from "react";
import { Mode } from '@cloudscape-design/global-styles';
import { GlobalContextType, GlobalContext, Region } from "../context/GlobalContext";
import { Loading } from "./Loading";
import { useColorScheme } from "../hooks/use-color-scheme";
import { ThemeHelper } from "../utility/theme";

export const AppHeader = () => {
    const colorScheme = useColorScheme();
    const [theme, setTheme] = useState<Mode>(colorScheme);
    const { environments, environment, regions, region, setEnvironment, setRegion } = useContext(GlobalContext) as GlobalContextType;

    useEffect(() => {
        const fetchTheme = async () => {
            const cachedTheme = await ThemeHelper.getTheme(colorScheme);
            setTheme(await ThemeHelper.applyTheme(cachedTheme));
        };

        fetchTheme();
    }, [colorScheme]);


    const toggleTheme = async () => {
        if (theme === Mode.Dark) {
            setTheme(await ThemeHelper.applyTheme(Mode.Light));
        } else {
            setTheme(await ThemeHelper.applyTheme(Mode.Dark));
        }
    };

    const envSelections = environments?.map(env => {
        return { type: 'button', id: env, text: env }
    })

    const regionSelections = regions?.map((region: Region) => {
        return { type: 'button', id: region.code, text: region.name }
    })

    return <>
        {(!environments || !regions) && <Loading />}
        {environments && regions &&
            <TopNavigation
                identity={{
                    href: '/',
                    title: 'Local AWS',
                    logo: { src: logo, alt: 'AWS' },
                }}
                utilities={[
                    {
                        type: 'button',
                        iconName: theme === Mode.Dark ? 'star' : 'caret-down',
                        text: theme === Mode.Dark ? 'Light' : 'Dark',
                        title: theme === Mode.Dark ? 'Light' : 'Dark',
                        ariaLabel: theme === Mode.Dark ? 'Light' : 'Dark',
                        iconSvg: theme === Mode.Dark ? (
                            <svg width="512" height="512" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 18a6 6 0 1 1 0-12a6 6 0 0 1 0 12ZM11 1h2v3h-2V1Zm0 19h2v3h-2v-3ZM3.515 4.929l1.414-1.414L7.05 5.636L5.636 7.05L3.515 4.93ZM16.95 18.364l1.414-1.414l2.121 2.121l-1.414 1.414l-2.121-2.121Zm2.121-14.85l1.414 1.415l-2.121 2.121l-1.414-1.414l2.121-2.121ZM5.636 16.95l1.414 1.414l-2.121 2.121l-1.414-1.414l2.121-2.121ZM23 11v2h-3v-2h3ZM4 11v2H1v-2h3Z" />
                            </svg>
                        ) : <svg width="512" height="512" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M235.54 150.21a104.84 104.84 0 0 1-37 52.91A104 104 0 0 1 32 120a103.09 103.09 0 0 1 20.88-62.52a104.84 104.84 0 0 1 52.91-37a8 8 0 0 1 10 10a88.08 88.08 0 0 0 109.8 109.8a8 8 0 0 1 10 10Z" />
                        </svg>,
                        onClick: toggleTheme

                    },
                    {
                        type: 'menu-dropdown',
                        text: region ? region : 'Select Region',
                        description: 'select region',
                        items: regionSelections,
                        onItemClick: (item) => setRegion(item.detail.id)
                    },
                    {
                        type: 'menu-dropdown',
                        text: environment ? environment : 'Select Environment',
                        description: 'select environment',
                        items: envSelections,
                        onItemClick: (item) => setEnvironment(item.detail.id),
                    },
                    // { type: 'button', iconName: 'settings', title: 'Settings', ariaLabel: 'Settings' }
                ]}
            />
        }
    </>;
};