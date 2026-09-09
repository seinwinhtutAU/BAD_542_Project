import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalConfig } from './authConfig';
import './index.css';

async function bootstrap() {
  let msalInstance = null;
  try {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  } catch (err) {
    console.warn('MSAL initialization warning:', err);
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));

  if (msalInstance) {
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>,
    );
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

bootstrap();
