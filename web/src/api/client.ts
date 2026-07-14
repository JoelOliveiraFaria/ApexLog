const API_BASE_URL = 'http://192.168.50.167:5084';

const TOKEN_STORAGE_KEY = 'apexlog_token';

let unauthorizedHandler: (() => void) | null = null;

/** Regista um callback a chamar sempre que o servidor responder 401 (token inválido/expirado). */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Wrapper de fetch que trata do prefixo da API, do header de autenticação e de sessões expiradas. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    clearToken();
    unauthorizedHandler?.();
  }

  return response;
}

export interface AuthResponse {
  userId: string;
  name: string;
  email: string;
  token: string;
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return body?.error ?? fallback;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Falha no login (${response.status})`));
  }

  return response.json();
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Falha no registo (${response.status})`));
  }

  return response.json();
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const response = await apiFetch('/api/auth/me');
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Falha ao carregar perfil (${response.status})`));
  }
  return response.json();
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await apiFetch('/api/auth/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Falha ao alterar password (${response.status})`));
  }
}
