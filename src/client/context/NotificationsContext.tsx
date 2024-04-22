import { createContext, useState, ReactNode } from 'react';
import { FlashbarProps } from '@cloudscape-design/components/flashbar';


export interface NotificationContextValue {
    notifications: FlashbarProps.MessageDefinition[];
    notify: (notification: FlashbarProps.MessageDefinition) => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);


export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<FlashbarProps.MessageDefinition[]>([]);

    const notify = (notification: FlashbarProps.MessageDefinition) => {
        setNotifications((prevNotifications) => {
            const id = prevNotifications.length ? (prevNotifications.length + 1).toString() : "1";
            notification = {
                ...notification,
                dismissible: true,
                id: id,
                onDismiss: () => {
                    // remove the notification from the list
                    setNotifications((prevNotifications) => prevNotifications.filter((n) => n.id !== id));
                }
            }
            return [...prevNotifications, notification];
        });
    };

    return (
        <NotificationContext.Provider value={{ notify, notifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
