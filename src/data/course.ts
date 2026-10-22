import type { Lesson, Module } from "./types";
import m1 from "./m1";
import m2 from "./m2";
import m3 from "./m3";
import m4 from "./m4";
import m5 from "./m5";
import m6 from "./m6";

export const modules: Module[] = [m1, m2, m3, m4, m5, m6];

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
