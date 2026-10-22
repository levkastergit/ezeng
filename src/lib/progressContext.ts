import { createContext, useContext } from 'react';
import type { Progress } from './storage';

export interface ProgressCtx {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
}

export const ProgressContext = createContext<ProgressCtx | null>(null);

export function useProgress(): ProgressCtx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('ProgressContext missing');
  return ctx;
}
