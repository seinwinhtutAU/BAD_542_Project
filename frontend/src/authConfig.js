export const isAdConfigured = Boolean(
  import.meta.env.VITE_AZURE_AD_CLIENT_ID &&
  import.meta.env.VITE_AZURE_AD_TENANT_ID &&
  import.meta.env.VITE_AZURE_AD_CLIENT_ID !== ''
);

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_AD_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

/** Where a failed redirect sign-in leaves its reason for the login page. */
export const AD_ERROR_KEY = 'adSignInError';

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};
