import { createContext, useContext } from 'react';
import type { ApiUser } from './api';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface AuthCtx {
  user: ApiUser | null;
  sync: SyncStatus;
  /** Shows the login/register screen. */
  openLogin: () => void;
  logout: () => Promise<void>;
  /** Forces a push of the current progress to the server. */
  syncNow: () => Promise<void>;
}

export const AuthContext = createContext<AuthCtx>({
  user: null,
  sync: 'idle',
  openLogin: () => undefined,
  logout: async () => undefined,
  syncNow: async () => undefined,
});

export function useAuth(): AuthCtx {
  return useContext(AuthContext);
}
