import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalConfig } from './authConfig';
import './index.css';

/**
 * Microsoft returns the sign-in result as a URL hash (#code=...) on the popup's
 * redirect page. Our redirect URI is the app root, so React Router would boot,
 * find no route for "/", and immediately Navigate to /login — replacing the URL
 * and discarding that hash before MSAL can read it. MSAL then reports
 * "hash_empty_error".
 *
 * When the hash is an auth response, render nothing and leave the URL alone.
 * The window that opened this popup reads the hash from it and closes it.
 */
function isAuthResponseWindow() {
  return /[#&](code|error|id_token|access_token|state)=/.test(window.location.hash);
}

async function bootstrap() {
  if (isAuthResponseWindow()) {
    return;
  }

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
