import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://virtualpet-backend-399557255968.us-central1.run.app';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Evita llamadas simultáneas al refresh
let isRefreshing = false;

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync('auth_refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const newToken = data.accessToken ?? data.access_token;
    const newRefresh = data.refreshToken ?? data.refresh_token;

    if (newToken) {
      await SecureStore.setItemAsync('auth_token', newToken);
      if (newRefresh) {
        await SecureStore.setItemAsync('auth_refresh_token', newRefresh);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Interceptor de 401: intentar renovar el token y reintentar (solo una vez, y no en endpoints de auth)
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await tryRefreshToken();
      isRefreshing = false;

      if (refreshed) {
        // Reintentar la request original con el nuevo token
        return apiClient<T>(endpoint, options);
      }
    }
    throw new ApiError('Sesión expirada. Por favor ingresá de nuevo.', 401);
  }

  if (!response.ok) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Cannot parse JSON error
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
