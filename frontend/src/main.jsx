import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import apiClient from './services/apiClient';
import { msalConfig, AD_ERROR_KEY } from './authConfig';
import './index.css';

/**
 * We sign in with a full-page redirect rather than a popup.
 *
 * The popup flow reads the "#code=..." fragment by polling the popup's URL, and
 * that proved unreliable here — MSAL kept reporting hash_empty_error on the
 * deployed site. The redirect flow hands the fragment to MSAL through
 * handleRedirectPromise() instead, which is why it is called below *before*
 * anything renders: React Router would otherwise navigate away from "/" and
 * discard the fragment first. It also sidesteps popup blockers, which the
 * README already warned about.
 */
async function completeAdSignIn(msalInstance) {
  const result = await msalInstance.handleRedirectPromise();
  if (!result?.idToken) return;

  try {
    const { data } = await apiClient.post('/api/auth/login/ad', { adToken: result.idToken });
    localStorage.setItem('token', data.token);
  } catch (err) {
    // The backend refuses accounts outside the allowed domains. Without this
    // the redirect just dumps the person back on the login page with no idea
    // why, because there is no popup left to report into.
    sessionStorage.setItem(
      AD_ERROR_KEY,
      err.response?.data?.error || 'Microsoft sign-in could not be completed.',
    );
  }
}

async function bootstrap() {
  let msalInstance = null;
  try {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    await completeAdSignIn(msalInstance);
  } catch (err) {
    console.error('Microsoft sign-in could not be completed:', err);
    sessionStorage.setItem(AD_ERROR_KEY, err.message || 'Microsoft sign-in could not be completed.');
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
