import React, { useState } from 'react';
import { Button, Text, makeStyles, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components';

// IMPORTANT: This component requires Azure AD app registration.
// The client's IT dept must provide: clientId and tenantId
// Until those are provided, App.tsx still uses LoginPanel (email+password)

const MSAL_CONFIG = {
  clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '', // Set by client IT dept
  tenantId: process.env.REACT_APP_AZURE_TENANT_ID || 'common',
};

// TODO: Run `npm install @azure/msal-browser` when enabling this

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#F8FAFC'
  },
  logo: {
    fontSize: '48px',
    marginBottom: '16px'
  }
});

export function MsalLoginPanel({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const styles = useStyles();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!MSAL_CONFIG.clientId) {
      setError('Microsoft SSO not configured. Please contact your IT department.');
      return;
    }

    try {
      // 1. Initialize PublicClientApplication from @azure/msal-browser
      // const msalInstance = new PublicClientApplication({ auth: { clientId: MSAL_CONFIG.clientId, authority: `https://login.microsoftonline.com/${MSAL_CONFIG.tenantId}` } });
      // await msalInstance.initialize();
      
      // 2. 'Sign in with Microsoft' button triggers loginPopup()
      // const loginResponse = await msalInstance.loginPopup({ scopes: ['User.Read'] });
      // const accessToken = loginResponse.accessToken;

      // 3. On success: extract accessToken from result
      // 4. Call POST /api/v1/auth/msal-login with { ms_token: accessToken } to exchange for app JWT
      //    (Note: this backend endpoint does not exist yet)
      // const res = await fetch('/api/v1/auth/msal-login', { method: 'POST', body: JSON.stringify({ ms_token: accessToken }), headers: { 'Content-Type': 'application/json' } });
      // const data = await res.json();
      
      // 5. Store JWT in OfficeRuntime.storage
      // OfficeRuntime.storage.setItem('jwtToken', data.token);

      // 6. Call onLoginSuccess(jwt)
      // onLoginSuccess(data.token);

      setError('SSO is not fully implemented yet.');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16l3-4 3 3 3-5 2 3"/><circle cx="19" cy="5" r="2" fill="#10B981" stroke="none"/>
        </svg>
      </div>
      <Text size={600} weight="semibold">Data Insight</Text>
      <Text size={300}>Sign in to access AI analytics</Text>
      
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <Button appearance="primary" size="large" onClick={handleLogin}>
        Sign in with Microsoft
      </Button>
    </div>
  );
}
