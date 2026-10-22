import type { Lesson, Module } from "./types";
import m1 from "./m1";
import m2 from "./m2";
import m3 from "./m3";
import m4 from "./m4";
import m5 from "./m5";
import m6 from "./m6";
import m7 from "./m7";
import m8 from "./m8";
import m9 from "./m9";
import m10 from "./m10";
import m11 from "./m11";
import m12 from "./m12";
import m13 from "./m13";
import m14 from "./m14";
import m15 from "./m15";
import m16 from "./m16";
import m17 from "./m17";
import { extraLessons } from "./extra";

const baseModules: Module[] = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, m16, m17];

export const modules: Module[] = baseModules.map((m) =>
  extraLessons[m.id] ? { ...m, lessons: [...m.lessons, ...extraLessons[m.id]] } : m,
);

export const coreModules: Module[] = modules.filter((m) => m.kind !== "theme");
export const themeModules: Module[] = modules.filter((m) => m.kind === "theme");

export const allLessons: Lesson[] = modules.flatMap((m) => m.lessons);

const lessonIndex = new Map<string, { lesson: Lesson; module: Module; index: number }>();
allLessons.forEach((lesson, index) => {
  const module = modules.find((m) => m.lessons.includes(lesson))!;
  lessonIndex.set(lesson.id, { lesson, module, index });
});

export function findLesson(id: string) {
  return lessonIndex.get(id);
}

export function moduleOfLesson(id: string): Module | undefined {
  return lessonIndex.get(id)?.module;
}

export function wordKey(lessonId: string, en: string) {
  return `${lessonId}/${en}`;
}

export const totalWords = allLessons.reduce((n, l) => n + l.words.length, 0);
