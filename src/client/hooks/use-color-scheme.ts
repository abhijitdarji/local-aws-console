import { useEffect, useState } from 'react';
import { Mode } from '@cloudscape-design/global-styles';

export const useColorScheme = () => {
    const [mode, setMode] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? Mode.Dark : Mode.Light
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const changeHandler = () => setMode(mediaQuery.matches ? Mode.Dark : Mode.Light);

        mediaQuery.addEventListener('change', changeHandler);
        return () => mediaQuery.removeEventListener('change', changeHandler);
    }, []);

    return mode;
};