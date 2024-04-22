import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import { applyDensity, Density } from '@cloudscape-design/global-styles';
import { AppRouter } from './Router';
import { GlobalStateProvider } from "./context/GlobalContext";
import { EnvironmentProvider } from "./context/EnvironmentContext";
import { I18nProvider, importMessages } from '@cloudscape-design/components/i18n';
import { LayoutProvider } from './context/LayoutContext';
// import enMessages from '@cloudscape-design/components/i18n/messages/all.en';

const locale = document.documentElement.lang;
const messages = await importMessages(locale);

applyDensity(Density.Compact);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider locale={locale} messages={messages}>
      <GlobalStateProvider>
        <EnvironmentProvider>
          <LayoutProvider>
            <AppRouter />
          </LayoutProvider>
        </EnvironmentProvider>
      </GlobalStateProvider>
    </I18nProvider>
  </React.StrictMode>,
)
