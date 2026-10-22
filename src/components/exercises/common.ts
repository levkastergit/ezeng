import type { CheckResult } from '../../lib/exercises';
import type { Settings } from '../../lib/storage';

export interface ExerciseState {
  ready: boolean;
  check: () => CheckResult;
}

export interface ExProps<T> {
  ex: T;
  /** True once the answer has been checked; the exercise must stop accepting input. */
  disabled: boolean;
  /** null until checked, then whether the answer was correct. */
  result: boolean | null;
  onState: (s: ExerciseState) => void;
  settings: Settings;
}
