/* global OfficeRuntime, localStorage */

const BACKEND_URL = 'http://localhost:8000';
const TOKEN_KEY = 'di_jwt_token';

// Fallback storage for browser testing
const storage = {
  setItem: async (key: string, value: string) => {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      await OfficeRuntime.storage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  getItem: async (key: string) => {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      return await OfficeRuntime.storage.getItem(key);
    } else {
      return localStorage.getItem(key);
    }
  },
  removeItem: async (key: string) => {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      await OfficeRuntime.storage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }
};

export async function login(email: string, password: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    if (data.access_token) {
      await storage.setItem(TOKEN_KEY, data.access_token);
    } else {
      throw new Error('No token returned from server');
    }
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

export async function logout(): Promise<void> {
  await storage.removeItem(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  try {
    const token = await storage.getItem(TOKEN_KEY);
    console.log('[Auth] getToken returned:', token ? 'Token exists' : 'Null token');
    return token;
  } catch (err) {
    console.error('[Auth] getToken error:', err);
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}
