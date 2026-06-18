import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import { login as loginService, logoutFromServer, refreshAccessToken } from '@/services/auth';
import { AuthCredentials, AuthError, Driver } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh_token';
const DRIVER_KEY = 'auth_driver';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  isOffline: boolean;
  error: string | null;
  driver: Driver | null;

  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  refresh: () => Promise<boolean>;
  clearError: () => void;
}

async function saveSession(token: string, refreshToken: string, driver: Driver): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  await SecureStore.setItemAsync(DRIVER_KEY, JSON.stringify(driver));
}

async function loadSession(): Promise<{ token: string | null; refreshToken: string | null; driver: Driver | null }> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  const driverRaw = await SecureStore.getItemAsync(DRIVER_KEY);

  let driver: Driver | null = null;
  if (driverRaw) {
    try {
      driver = JSON.parse(driverRaw) as Driver;
    } catch {
      driver = null;
    }
  }

  return { token, refreshToken, driver };
}

async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(DRIVER_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  isOffline: false,
  error: null,
  driver: null,

  hydrate: async () => {
    const { token, driver } = await loadSession();
    set({
      isAuthenticated: Boolean(token && driver),
      isHydrated: true,
      isOffline: false,
      driver,
      error: null,
    });
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null, isOffline: false });

    try {
      const response = await loginService(credentials);
      await saveSession(response.token, response.refreshToken, response.driver);
      set({
        isAuthenticated: true,
        isLoading: false,
        isOffline: false,
        driver: response.driver,
        error: null,
      });
      return;
    } catch (error) {
      // AuthError = credenciales incorrectas → mostrar mensaje, no intentar offline
      if (error instanceof AuthError) {
        set({ isLoading: false, error: error.message });
        return;
      }

      // Cualquier otro error (TypeError de fetch, timeout, etc.) = sin conexión
      // Intentar fallback con la sesión guardada localmente
      const { token, driver } = await loadSession();
      if (token && driver && driver.email === credentials.email && credentials.password.length > 0) {
        set({
          isAuthenticated: true,
          isLoading: false,
          isOffline: true,
          driver,
          error: null,
        });
        return;
      }

      set({
        isLoading: false,
        error: 'No hay conexión. Conectate una vez para usar la app offline.',
      });
    }
  },

  logout: async () => {
    // Intentar invalidar el token en el servidor (no bloqueante)
    try {
      const { token } = await loadSession();
      if (token) {
        await logoutFromServer(token);
      }
    } catch {
      // Si falla, igual limpiamos local
    }

    await clearSession();
    set({
      isAuthenticated: false,
      isLoading: false,
      isOffline: false,
      driver: null,
      error: null,
    });
  },

  refresh: async () => {
    try {
      const { refreshToken } = await loadSession();
      if (!refreshToken) return false;

      const result = await refreshAccessToken(refreshToken);
      await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
      if (result.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
      }
      return true;
    } catch {
      // Refresh falló → sesión expirada
      await clearSession();
      set({ isAuthenticated: false, driver: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
