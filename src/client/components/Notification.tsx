import { Flashbar } from "@cloudscape-design/components"
import { useContext } from "react"
import { NotificationContext, NotificationContextValue } from "../context/NotificationsContext"


export const Notification = () => {

    const { notifications } = useContext(NotificationContext) as NotificationContextValue;

    return <>
        <Flashbar items={notifications} stackItems={notifications.length > 1} />
    </>
}