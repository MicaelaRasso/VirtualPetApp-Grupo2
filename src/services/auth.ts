import { AuthCredentials, AuthResponse, AuthError, Driver } from '@/types/auth';
import { apiClient, ApiError } from '@/services/apiClient';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  // Fallback por si el backend usa snake_case
  access_token?: string;
  refresh_token?: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  if (!credentials.email || !credentials.password) {
    throw new AuthError('Ingresá tu email y contraseña');
  }

  try {
    const data = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    const token = data.accessToken ?? data.access_token;
    if (!token) {
      throw new AuthError('Respuesta del servidor inválida');
    }

    const driver: Driver = {
      id: 'drv-' + credentials.email.split('@')[0],
      email: credentials.email,
      fullName: credentials.email.split('@')[0],
    };

    return { token, refreshToken: data.refreshToken ?? data.refresh_token ?? '', driver };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        throw new AuthError('Email o contraseña incorrectos');
      }
      throw new AuthError(error.message);
    }
    throw error;
  }
}

export async function logoutFromServer(token: string): Promise<void> {
  try {
    await apiClient<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Si falla el logout en el servidor, igual limpiamos local
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const data = await apiClient<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const newAccess = data.accessToken ?? data.access_token ?? '';
  const newRefresh = data.refreshToken ?? data.refresh_token ?? refreshToken;
  return { accessToken: newAccess, refreshToken: newRefresh };
}
