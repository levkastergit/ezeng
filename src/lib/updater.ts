import { useSyncExternalStore } from 'react';

export const RELEASES_URL = 'https://github.com/levkastergit/ezeng/releases/latest';

export type Unsupported = 'dev' | 'portable' | 'missing';

export type CheckResult =
  | { status: 'available'; version: string; current: string }
  | { status: 'manual'; version: string; current: string; reason: Unsupported }
  | { status: 'none'; current: string; latest: string; reason?: Unsupported }
  | { status: 'error'; message: string; current: string; logPath?: string }
  // kept for older main processes
  | { status: 'unsupported'; reason: Unsupported; current: string };

interface UpdateApi {
  check(): Promise<CheckResult>;
  download(): Promise<{ ok: boolean; message?: string }>;
  install(): Promise<boolean>;
  openReleases(): Promise<void>;
  openLog?(): Promise<void>;
  onAvailable(cb: (d: { version: string; manual?: boolean; reason?: Unsupported }) => void): () => void;
  onProgress(cb: (p: { percent: number; transferred: number; total: number }) => void): () => void;
  onDownloaded(cb: (d: { version: string }) => void): () => void;
  onError(cb: (e: { message: string }) => void): () => void;
}

interface Bridge {
  update?: UpdateApi;
}

function api(): UpdateApi | null {
  const w = window as unknown as { ezeng?: Bridge };
  return w.ezeng?.update ?? null;
}

export type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'none'; latest: string; reason?: Unsupported }
  | { phase: 'available'; version: string }
  | { phase: 'manual'; version: string; reason: Unsupported }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'unsupported'; reason: Unsupported | 'browser' }
  | { phase: 'error'; message: string; logPath?: string };

let state: UpdateState = { phase: 'idle' };
const listeners = new Set<() => void>();
let pendingVersion = '';

function setState(next: UpdateState) {
  state = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

export function useUpdateState(): UpdateState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

const a = api();
if (a) {
  a.onAvailable((d) => {
    pendingVersion = d.version;
    const cur = getSnapshot().phase;
    if (cur === 'idle' || cur === 'none') {
      setState(d.manual ? { phase: 'manual', version: d.version, reason: d.reason ?? 'portable' } : { phase: 'available', version: d.version });
    }
  });
  a.onProgress((p) => {
    const cur = getSnapshot().phase;
    if (cur === 'downloading' || cur === 'available') {
      setState({ phase: 'downloading', version: pendingVersion, percent: Math.max(0, Math.min(100, p.percent)) });
    }
  });
  a.onDownloaded((d) => setState({ phase: 'downloaded', version: d.version }));
  a.onError((e) => {
    const cur = getSnapshot().phase;
    if (cur === 'downloading' || cur === 'checking') setState({ phase: 'error', message: e.message });
  });
}

const CHECK_TIMEOUT_MS = 35_000;

export async function checkForUpdates(): Promise<void> {
  const u = api();
  if (!u) {
    setState({ phase: 'unsupported', reason: 'browser' });
    return;
  }
  setState({ phase: 'checking' });
  let r: CheckResult | undefined;
  try {
    r = await Promise.race<CheckResult | undefined>([
      u.check(),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), CHECK_TIMEOUT_MS)),
    ]);
  } catch (err) {
    setState({ phase: 'error', message: String((err as Error)?.message ?? err) });
    return;
  }
  if (!r || typeof r !== 'object') {
    setState({ phase: 'error', message: 'нет ответа от проверки обновлений (таймаут)' });
    return;
  }
  switch (r.status) {
    case 'available':
      pendingVersion = r.version;
      setState({ phase: 'available', version: r.version });
      break;
    case 'manual':
      setState({ phase: 'manual', version: r.version, reason: r.reason });
      break;
    case 'none':
      setState({ phase: 'none', latest: r.latest, reason: r.reason });
      break;
    case 'unsupported':
      setState({ phase: 'unsupported', reason: r.reason });
      break;
    case 'error':
      setState({ phase: 'error', message: r.message, logPath: r.logPath });
      break;
    default:
      setState({ phase: 'error', message: 'неизвестный ответ проверки обновлений' });
  }
}

export async function downloadUpdate(): Promise<void> {
  const u = api();
  if (!u || getSnapshot().phase !== 'available') return;
  const version = (getSnapshot() as { version: string }).version;
  pendingVersion = version;
  setState({ phase: 'downloading', version, percent: 0 });
  const r = await u.download();
  if (!r.ok && getSnapshot().phase === 'downloading') setState({ phase: 'error', message: r.message ?? 'download failed' });
}

export function installUpdate(): void {
  void api()?.install();
}

export function openReleasesPage(): void {
  const u = api();
  if (u) void u.openReleases();
  else window.open(RELEASES_URL, '_blank', 'noopener');
}

export function openUpdateLog(): void {
  void api()?.openLog?.();
}

export function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} ГБ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} МБ`;
  return `${Math.round(n / 1e3)} КБ`;
}
