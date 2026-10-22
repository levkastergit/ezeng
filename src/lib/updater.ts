import { useSyncExternalStore } from 'react';

export const RELEASES_URL = 'https://github.com/levkastergit/ezeng/releases/latest';

export type CheckResult =
  | { status: 'unsupported'; reason: 'dev' | 'portable' | 'missing'; current: string }
  | { status: 'available'; version: string; current: string }
  | { status: 'none'; current: string; latest: string }
  | { status: 'error'; message: string; current: string };

interface UpdateApi {
  check(): Promise<CheckResult>;
  download(): Promise<{ ok: boolean; message?: string }>;
  install(): Promise<boolean>;
  openReleases(): Promise<void>;
  onAvailable(cb: (d: { version: string }) => void): () => void;
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
  | { phase: 'none'; latest: string }
  | { phase: 'available'; version: string }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'unsupported'; reason: 'dev' | 'portable' | 'missing' | 'browser' }
  | { phase: 'error'; message: string };

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
    if (state.phase === 'idle' || state.phase === 'none') setState({ phase: 'available', version: d.version });
  });
  a.onProgress((p) => {
    if (state.phase === 'downloading' || state.phase === 'available') {
      setState({ phase: 'downloading', version: pendingVersion, percent: Math.max(0, Math.min(100, p.percent)) });
    }
  });
  a.onDownloaded((d) => setState({ phase: 'downloaded', version: d.version }));
  a.onError((e) => {
    if (state.phase === 'downloading' || state.phase === 'checking') setState({ phase: 'error', message: e.message });
  });
}

export async function checkForUpdates(): Promise<void> {
  const u = api();
  if (!u) {
    setState({ phase: 'unsupported', reason: 'browser' });
    return;
  }
  setState({ phase: 'checking' });
  const r = await u.check();
  switch (r.status) {
    case 'available':
      pendingVersion = r.version;
      setState({ phase: 'available', version: r.version });
      break;
    case 'none':
      setState({ phase: 'none', latest: r.latest });
      break;
    case 'unsupported':
      setState({ phase: 'unsupported', reason: r.reason });
      break;
    case 'error':
      setState({ phase: 'error', message: r.message });
      break;
  }
}

export async function downloadUpdate(): Promise<void> {
  const u = api();
  if (!u || state.phase !== 'available') return;
  const version = state.version;
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

export function formatBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} ГБ`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} МБ`;
  return `${Math.round(n / 1e3)} КБ`;
}
