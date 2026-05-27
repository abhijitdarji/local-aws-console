'use client';

import { AppLayout } from '@cloudscape-design/components';
import * as awsui from '@cloudscape-design/design-tokens';
import { type ReactNode, Suspense } from 'react';
import { useLayoutStore } from '@/app/lib/client/store/layout-store';
import { AppHeader } from './app-header';
import { Breadcrumbs } from './breadcrumbs';
import { LeftMenu } from './left-menu';
import { Notification } from './notification';

export function AppShell({ children }: { children: ReactNode }) {
  const { drawers, activeDrawerId, setActiveDrawerId } = useLayoutStore();

  return (
    <>
      <div id="header">
        <AppHeader />
      </div>

      <AppLayout
        breadcrumbs={
          <Suspense fallback={null}>
            <Breadcrumbs />
          </Suspense>
        }
        content={children}
        navigation={
          <Suspense fallback={null}>
            <LeftMenu />
          </Suspense>
        }
        notifications={<Notification />}
        stickyNotifications
        contentType="table"
        activeDrawerId={activeDrawerId}
        onDrawerChange={({ detail }) => setActiveDrawerId(detail.activeDrawerId)}
        drawers={drawers}
        headerSelector="#header"
        footerSelector="#footer"
      />

      <footer
        id="footer"
        style={{
          fontFamily: awsui.fontFamilyBase,
          fontSize: awsui.fontSizeBodyS,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingRight: '20px',
          backgroundColor: awsui.colorBackgroundHomeHeader,
          color: awsui.colorTextHomeHeaderSecondary,
        }}
      >
        <div>- by Abhijit Darji</div>
      </footer>
    </>
  );
}
