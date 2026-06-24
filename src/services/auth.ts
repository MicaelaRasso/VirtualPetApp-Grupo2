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

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

// Decodifica base64url sin depender de `atob` (que no existe en todos los runtimes de RN).
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of padded) {
    if (ch === '=') break;
    const idx = chars.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/**
 * Extrae el payload del JWT. El `sub` es el id real del usuario en el backend,
 * que es el mismo que se guarda como `riderId` en los envíos. Es imprescindible
 * usarlo (y no un id inventado) para que "Mis pedidos" filtre correctamente.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(base64UrlDecode(part)) as JwtPayload;
  } catch {
    return null;
  }
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

    // El id del repartidor debe ser el id real del usuario (claim `sub` del JWT),
    // porque el backend asigna los envíos con ese mismo id. Si inventáramos un id
    // a partir del email, "Mis pedidos" nunca encontraría coincidencias locales.
    const claims = decodeJwt(token);
    if (!claims?.sub) {
      throw new AuthError('Respuesta del servidor inválida');
    }

    const driver: Driver = {
      id: claims.sub,
      email: claims.email ?? credentials.email,
      fullName: (claims.email ?? credentials.email).split('@')[0],
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
