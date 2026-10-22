/** Client for the EzEng account/progress API. All HTTP goes through the main process (pinned TLS certificate). */
import type { Progress } from './storage';

export interface ApiUser {
  id: string;
  login: string;
  createdAt: number;
  showInLeaderboard: boolean;
}

export interface LeaderboardRow {
  rank: number;
  login: string;
  xp: number;
  words: number;
  lessons: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

interface RawResponse {
  status: number;
  json: unknown;
  error?: string;
}

interface Bridge {
  api?: {
    request(req: { method: string; path: string; body?: unknown; token?: string }): Promise<RawResponse>;
    getAuth(): Promise<{ token: string; user: ApiUser } | null>;
    setAuth(data: { token: string; user: ApiUser }): Promise<void>;
    clearAuth(): Promise<void>;
  };
}

function bridge() {
  return (window as unknown as { ezeng?: Bridge }).ezeng?.api ?? null;
}

export function apiAvailable(): boolean {
  return bridge() !== null;
}

let token = '';
export function setToken(t: string) {
  token = t;
}

const ERRORS: Record<string, string> = {
  'login already taken': 'Такой логин уже занят',
  'wrong login or password': 'Неверный логин или пароль',
  'too many attempts, try later': 'Слишком много попыток, попробуйте позже',
  'login must be 3–24 latin letters, digits, _ . -': 'Логин: 3–24 латинских буквы, цифры, _ . -',
  'password must be 6–100 characters': 'Пароль: от 6 до 100 символов',
  'wrong current password': 'Неверный текущий пароль',
  unauthorized: 'Нужно войти заново',
};

async function call<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const b = bridge();
  if (!b) return { ok: false, status: 0, error: 'Сервер доступен только в приложении' };
  const r = await b.request({ method, path: `/api/v1${path}`, body, token: token || undefined });
  if (r.status === 0) return { ok: false, status: 0, error: 'Нет связи с сервером' };
  if (r.status >= 200 && r.status < 300) return { ok: true, data: r.json as T };
  const raw = (r.json as { error?: string } | null)?.error ?? r.error ?? `HTTP ${r.status}`;
  return { ok: false, status: r.status, error: ERRORS[raw] ?? raw };
}

export const api = {
  health: () => call<{ ok: boolean }>('GET', '/health'),
  register: (login: string, password: string) => call<{ token: string; user: ApiUser; progressUpdatedAt?: number }>('POST', '/register', { login, password }),
  login: (login: string, password: string) =>
    call<{ token: string; user: ApiUser; progressUpdatedAt: number }>('POST', '/login', { login, password }),
  me: () => call<{ user: ApiUser; progressUpdatedAt: number }>('GET', '/me'),
  getProgress: () => call<{ progress: Progress | null; updatedAt: number }>('GET', '/progress'),
  putProgress: (progress: Progress, updatedAt: number) =>
    call<{ stored: boolean; updatedAt: number; progress?: Progress }>('PUT', '/progress', { progress, updatedAt }),
  changePassword: (oldPassword: string, newPassword: string) => call<{ ok: boolean; token: string }>('POST', '/password', { oldPassword, newPassword }),
  setLeaderboardVisibility: (show: boolean) => call<{ ok: boolean; showInLeaderboard: boolean }>('POST', '/leaderboard-visibility', { show }),
  leaderboard: () => call<{ rows: LeaderboardRow[]; total: number }>('GET', '/leaderboard'),
  getAuth: () => bridge()?.getAuth() ?? Promise.resolve(null),
  setAuth: (data: { token: string; user: ApiUser }) => bridge()?.setAuth(data) ?? Promise.resolve(),
  clearAuth: () => bridge()?.clearAuth() ?? Promise.resolve(),
};
