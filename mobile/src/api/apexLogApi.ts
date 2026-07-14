import type { TelemetrySample } from '../types/telemetry';
import type { Motorcycle } from '../types/motorcycle';

// Túnel ngrok — expõe a API local à internet para uso em viagem (fora da rede local).
const API_BASE_URL = 'https://neomi-unhastened-gunner.ngrok-free.dev';

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Chamado depois de login/registo bem-sucedidos (e ao carregar um token guardado no arranque). */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Regista um callback a chamar sempre que o servidor responder 401 (token inválido/expirado). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export interface StartTripPayload {
  motorcycleId: string;
  startTime: string;
}

export interface FinishTripPayload {
  endTime: string;
  /** Se omitida, o backend calcula-a a partir da velocidade OBD2 integrada ao longo do tempo. */
  distanceKm?: number;
}

export interface CreateMotorcyclePayload {
  make: string;
  model: string;
  year: number;
  nickname: string;
}

export interface AuthResponse {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(init?.headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Falha na API (${response.status}) em ${path}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Cria uma conta no ApexLog. */
export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

/** Autentica e devolve o token JWT a usar nas restantes chamadas. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Devolve os dados da conta autenticada. */
export async function getMyProfile(): Promise<UserProfile> {
  return request<UserProfile>('/api/auth/me');
}

/** Altera a password da conta autenticada. */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await request('/api/auth/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/** Lista as motas registadas no backend, para o utilizador escolher qual está a usar antes de gravar. */
export async function fetchMotorcycles(): Promise<Motorcycle[]> {
  return request<Motorcycle[]>('/api/motorcycles');
}

/** Regista uma nova mota no backend. */
export async function createMotorcycle(payload: CreateMotorcyclePayload): Promise<Motorcycle> {
  return request<Motorcycle>('/api/motorcycles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Cria uma viagem em aberto no backend e devolve o seu Id para streaming de telemetria. */
export async function startTrip(payload: StartTripPayload): Promise<string> {
  const result = await request<{ tripId: string }>('/api/trips/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.tripId;
}

/** Envia um lote de pontos de telemetria já registados para uma viagem em curso (bulk insert). */
export async function uploadTelemetryBatch(tripId: string, points: TelemetrySample[]): Promise<void> {
  await request(`/api/trips/${tripId}/telemetry`, {
    method: 'POST',
    body: JSON.stringify({ points }),
  });
}

/** Fecha a viagem e despoleta o cálculo das métricas agregadas no backend. */
export async function finishTrip(tripId: string, payload: FinishTripPayload): Promise<void> {
  await request(`/api/trips/${tripId}/finish`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
