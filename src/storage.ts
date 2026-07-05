import { createId } from "./id";
import { asString, isObject, normalizeSentence } from "./normalize";
import type { Library, Story } from "./types";

const STORAGE_KEY = "ett_libraries";
const OLD_STORAGE_KEY = "ett_stories";
const DEFAULT_LIBRARY_NAME = "My Library";

function normalizeStory(raw: unknown): Story | null {
  if (!isObject(raw)) return null;
  const sentences = Array.isArray(raw.sentences)
    ? raw.sentences
        .map(normalizeSentence)
        .filter((s): s is NonNullable<typeof s> => s !== null)
    : [];
  const source = typeof raw.source === "string" ? raw.source : undefined;
  return {
    id: asString(raw.id) || createId(),
    title: asString(raw.title, "Untitled Story"),
    source,
    sentences,
  };
}

function normalizeLibrary(raw: unknown): Library | null {
  if (!isObject(raw)) return null;
  const stories = Array.isArray(raw.stories)
    ? raw.stories.map(normalizeStory).filter((s): s is Story => s !== null)
    : [];
  return {
    id: asString(raw.id) || createId(),
    name: asString(raw.name, "Untitled Library"),
    stories,
  };
}

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migrateFromOldStories(): Library[] {
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return [];

  const parsedOld = tryParse(oldRaw);
  if (!Array.isArray(parsedOld) || parsedOld.length === 0) return [];

  const stories = parsedOld
    .map(normalizeStory)
    .filter((s): s is Story => s !== null);
  if (stories.length === 0) return [];

  return [
    {
      id: createId(),
      name: DEFAULT_LIBRARY_NAME,
      stories,
    },
  ];
}

export function loadLibraries(): Library[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = tryParse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map(normalizeLibrary)
        .filter((l): l is Library => l !== null);
    }
    return [];
  }

  return migrateFromOldStories();
}

export function saveLibraries(libraries: Library[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libraries));
}
