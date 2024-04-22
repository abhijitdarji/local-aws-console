import { Breadcrumbs } from "./components/Breadcrumbs";
import { LeftMenu } from "./components/LeftMenu";
import { AppHeader } from "./components/AppHeader";
import '@cloudscape-design/global-styles/dark-mode-utils.css';
// import { applyDensity, Density } from '@cloudscape-design/global-styles';
import './App.scss'
import { Outlet } from "react-router-dom";
import * as awsui from '@cloudscape-design/design-tokens';
import { NotificationProvider } from "./context/NotificationsContext";
import { Notification } from "./components/Notification";
import { LayoutContext, LayoutContextValue } from "./context/LayoutContext";
import { useContext } from "react";
import { AppLayout } from "@cloudscape-design/components";

export const App = () => {

  const { drawers, activeDrawerId, setActiveDrawerId } = useContext<LayoutContextValue>(LayoutContext);

  //applyDensity(Density.Compact);
  //applyMode(Mode.Dark);

  return (
    <>

      <div id="pagebody">
        <div id="header">
          <AppHeader />
        </div>

        <NotificationProvider>
          <AppLayout
            breadcrumbs={<Breadcrumbs />}
            content={<Outlet />}
            navigation={<LeftMenu />}

            notifications={<Notification />}
            stickyNotifications={true}

            contentType="table"
            // tools={tools}
            // toolsHide={false}

            activeDrawerId={activeDrawerId}
            onDrawerChange={({detail}) => {
              setActiveDrawerId(detail.activeDrawerId);
            }}
            drawers={drawers}

            // {...splitPanel ? {
            //   splitPanel: <SplitPanel header="Queries">{splitPanel}</SplitPanel>,
            // } : {}}
            // splitPanelPreferences={{
            //   position: 'side'
            // }}

            headerSelector="#header"
            footerSelector="#footer"
          ></AppLayout>
        </NotificationProvider>


        <footer id="footer" style={{
          fontFamily: awsui.fontFamilyBase,
          fontSize: awsui.fontSizeBodyS,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingRight: "20px",
          backgroundColor: awsui.colorBackgroundHomeHeader,
          color: awsui.colorTextHomeHeaderSecondary
        }}>
          <div>- by Abhijit Darji</div>
        </footer>
      </div>

    </>
  )
}