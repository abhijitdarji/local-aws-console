import { Button, IconProps } from "@cloudscape-design/components"
import { useState } from "react";

export const FavoritesButton = () => {

    const [iconName, setIconName] = useState<IconProps.Name>('star');

    const addToFavorites = () => {
        setIconName(prevIconName => prevIconName === 'star' ? 'star-filled' : 'star');
    }

    return <Button iconName={iconName} onClick={addToFavorites}></Button>
}