import type { Lesson } from "../types";
import { coreExtras } from "./core";
import { themeExtras } from "./theme";

/** Additional lessons appended to the base modules (module id → lessons). */
export const extraLessons: Record<string, Lesson[]> = {
  ...coreExtras,
  ...themeExtras,
};
