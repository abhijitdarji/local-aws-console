import { Button, SpaceBetween } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { DateUtils } from "../utility/dates";

interface RefreshButtonProps {
    lastFetched?: number,
    onClick: () => void;
}

export const RefreshButton = (props: RefreshButtonProps) => {

    const [lastFetched, setLastFetched] = useState<string>('');

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (props.lastFetched) {
            setLastFetched(DateUtils.formatDateAgo(props.lastFetched) || '');
            intervalId = setInterval(() => {
                const timeAgo = DateUtils.formatDateAgo(props.lastFetched!);
                setLastFetched(timeAgo || '');
            }, 60000); // update every minute
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId); // cleanup on unmount
            }
        };
    }, [props.lastFetched]);

    return <SpaceBetween size="s" direction="horizontal">
        {(props.lastFetched || 0) > 0 &&
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                marginTop: '-5px'
            }}>
                <small>Last fetched</small>
                <small>{lastFetched}</small>
            </div>
        }
        <Button
            iconAlign="left"
            iconName="refresh"
            onClick={props.onClick}
        ></Button>
    </SpaceBetween>;
}