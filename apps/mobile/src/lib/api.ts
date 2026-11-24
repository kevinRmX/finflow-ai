import { useSession, type SessionUser } from './session';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Rota el refresh token una sola vez aunque varias llamadas fallen a la vez. */
async function refreshTokens(): Promise<boolean> {
  const { tokens, setTokens, signOut } = useSession.getState();
  if (!tokens) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/token/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) {
        await signOut();
        return false;
      }
      const next = (await res.json()) as { accessToken: string; refreshToken: string };
      await setTokens({ accessToken: next.accessToken, refreshToken: next.refreshToken });
      return true;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const { tokens } = useSession.getState();
  const headers: Record<string, string> = { accept: 'application/json' };
  if (init.json !== undefined) headers['content-type'] = 'application/json';
  if (tokens) headers.authorization = `Bearer ${tokens.accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (res.status === 401 && tokens && retry && (await refreshTokens())) {
    return api<T>(path, init, false);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[]; code?: string };
    const message = Array.isArray(body.message) ? body.message.join('\n') : (body.message ?? 'Algo salió mal');
    throw new ApiError(res.status, message, body.code);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export async function signIn(email: string, password: string) {
  const r = await api<AuthResponse>('/auth/token', { method: 'POST', json: { email, password } });
  await useSession.getState().signIn(r.user, r);
}

export async function register(name: string, email: string, password: string) {
  const r = await api<AuthResponse>('/auth/register', { method: 'POST', json: { name, email, password } });
  await useSession.getState().signIn(r.user, r);
}

export async function signOut() {
  const { tokens, signOut: clear } = useSession.getState();
  if (tokens) {
    await api('/auth/token/revoke', { method: 'POST', json: { refreshToken: tokens.refreshToken } }).catch(() => undefined);
  }
  await clear();
}
