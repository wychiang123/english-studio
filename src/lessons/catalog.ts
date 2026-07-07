import { isObject } from "../normalize";
import { validateLessonJson } from "../import/lessonSchema";

/**
 * One `.eslesson.json` file discovered under `lessons/`, per the Lesson
 * File Naming Convention in docs/lesson-generation-specification-v1.md.
 */
export interface LessonCatalogEntry {
  /**
   * Root-relative path, e.g. "/lessons/BBC/Some Title.eslesson.json". Stable
   * across sessions as long as the committed file isn't renamed (see the
   * Immutable Lesson Rule) — used as the provenance key for de-duplication.
   */
  path: string;
  /** Source folder name under lessons/, e.g. "BBC". */
  source: string;
  /** Lesson title, read from the file when valid, else derived from the filename. */
  title: string;
  /** The parsed JSON document, not yet validated. */
  raw: unknown;
  /** Validation error from `validateLessonJson`, or null if the file is a valid Lesson JSON. */
  error: string | null;
}

// Vite bundles every matching file under lessons/ at build/dev time — the
// closest a static, no-backend SPA can get to scanning a folder at runtime.
// `lessons/` sits at the project root alongside `src/`, so the pattern is
// rooted with a leading slash (resolved relative to the project root).
const lessonModules = import.meta.glob("/lessons/**/*.eslesson.json", {
  eager: true,
}) as Record<string, { default: unknown }>;

function folderName(path: string): string {
  const match = /^\/lessons\/([^/]+)\//.exec(path);
  return match ? match[1] : "Other";
}

function fileTitle(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  return fileName.replace(/\.eslesson\.json$/, "");
}

function toCatalogEntry(path: string, mod: { default: unknown }): LessonCatalogEntry {
  const raw = mod.default;
  const error = validateLessonJson(raw);
  const title =
    isObject(raw) && typeof raw.title === "string" && raw.title.trim()
      ? raw.title
      : fileTitle(path);
  return { path, source: folderName(path), title, raw, error };
}

/** Every `.eslesson.json` file found under `lessons/`, sorted by path. */
export const lessonCatalog: LessonCatalogEntry[] = Object.entries(lessonModules)
  .map(([path, mod]) => toCatalogEntry(path, mod))
  .sort((a, b) => a.path.localeCompare(b.path));
