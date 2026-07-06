import { createId } from "./id";
import {
  asString,
  isObject,
  normalizeSentence,
  normalizeSentenceContent,
  normalizeSentenceProgress,
} from "./normalize";
import { mergeLibrary, splitLibrary } from "./progress";
import type {
  Library,
  LibraryContent,
  LibraryProgress,
  Sentence,
  SentenceContent,
  SentenceProgress,
  Story,
  StoryContent,
  StoryProgress,
} from "./types";

// Lesson content (read-only) and user progress (editable) are persisted
// under separate keys and merged at runtime. See docs/progress-sync-v1.md
// for the full architecture and future GitHub-sync design.
const CONTENT_KEY = "ett_libraries";
const PROGRESS_KEY = "ett_progress";
const OLD_STORAGE_KEY = "ett_stories";
const DEFAULT_LIBRARY_NAME = "My Library";

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Legacy loading path: reconstructs a fully-merged Library (lesson content
// and progress inline on each sentence, as English Studio stored things
// before the content/progress split) from either pre-split `ett_libraries`
// data or the very old `ett_stories` format. Only used when `ett_progress`
// hasn't been written yet; the very next save splits everything into the
// new format (see `saveLibraries` below).
// ---------------------------------------------------------------------

function normalizeLegacyStory(raw: unknown): Story | null {
  if (!isObject(raw)) return null;
  const sentences = Array.isArray(raw.sentences)
    ? raw.sentences
        .map(normalizeSentence)
        .filter((s): s is Sentence => s !== null)
    : [];
  const source = typeof raw.source === "string" ? raw.source : undefined;
  return {
    id: asString(raw.id) || createId(),
    title: asString(raw.title, "Untitled Story"),
    source,
    sentences,
  };
}

function normalizeLegacyLibrary(raw: unknown): Library | null {
  if (!isObject(raw)) return null;
  const stories = Array.isArray(raw.stories)
    ? raw.stories.map(normalizeLegacyStory).filter((s): s is Story => s !== null)
    : [];
  return {
    id: asString(raw.id) || createId(),
    name: asString(raw.name, "Untitled Library"),
    stories,
  };
}

function migrateFromOldStories(): Library[] {
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return [];

  const parsedOld = tryParse(oldRaw);
  if (!Array.isArray(parsedOld) || parsedOld.length === 0) return [];

  const stories = parsedOld
    .map(normalizeLegacyStory)
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

function loadLegacyLibraries(): Library[] {
  const raw = localStorage.getItem(CONTENT_KEY);
  if (raw) {
    const parsed = tryParse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map(normalizeLegacyLibrary)
        .filter((l): l is Library => l !== null);
    }
    return [];
  }
  return migrateFromOldStories();
}

// ---------------------------------------------------------------------
// Split storage path: lesson content and user progress are read from their
// own keys and merged into the runtime `Library` shape.
// ---------------------------------------------------------------------

function normalizeStoryContent(raw: unknown): StoryContent | null {
  if (!isObject(raw)) return null;
  const sentences = Array.isArray(raw.sentences)
    ? raw.sentences
        .map(normalizeSentenceContent)
        .filter((s): s is SentenceContent => s !== null)
    : [];
  const source = typeof raw.source === "string" ? raw.source : undefined;
  return {
    id: asString(raw.id) || createId(),
    title: asString(raw.title, "Untitled Story"),
    source,
    sentences,
  };
}

function normalizeLibraryContent(raw: unknown): LibraryContent | null {
  if (!isObject(raw)) return null;
  const stories = Array.isArray(raw.stories)
    ? raw.stories
        .map(normalizeStoryContent)
        .filter((s): s is StoryContent => s !== null)
    : [];
  return {
    id: asString(raw.id) || createId(),
    name: asString(raw.name, "Untitled Library"),
    stories,
  };
}

function normalizeStoredStoryProgress(raw: unknown): StoryProgress {
  const sentences: Record<string, SentenceProgress> = {};
  if (isObject(raw) && isObject(raw.sentences)) {
    for (const [id, rawProgress] of Object.entries(raw.sentences)) {
      sentences[id] = normalizeSentenceProgress(rawProgress);
    }
  }
  return { sentences };
}

function normalizeStoredLibraryProgress(raw: unknown): LibraryProgress {
  const stories: Record<string, StoryProgress> = {};
  if (isObject(raw) && isObject(raw.stories)) {
    for (const [id, rawStoryProgress] of Object.entries(raw.stories)) {
      stories[id] = normalizeStoredStoryProgress(rawStoryProgress);
    }
  }
  return { stories };
}

function loadSplitLibraries(): Library[] {
  const contentRaw = localStorage.getItem(CONTENT_KEY);
  const parsedContent = contentRaw ? tryParse(contentRaw) : null;
  const content = Array.isArray(parsedContent)
    ? parsedContent
        .map(normalizeLibraryContent)
        .filter((l): l is LibraryContent => l !== null)
    : [];

  const progressRaw = localStorage.getItem(PROGRESS_KEY);
  const parsedProgress = progressRaw ? tryParse(progressRaw) : null;
  const progressByLibrary: Record<string, LibraryProgress> = {};
  if (isObject(parsedProgress)) {
    for (const [id, rawLibraryProgress] of Object.entries(parsedProgress)) {
      progressByLibrary[id] = normalizeStoredLibraryProgress(rawLibraryProgress);
    }
  }

  return content.map((library) =>
    mergeLibrary(library, progressByLibrary[library.id]),
  );
}

/**
 * Loads the current library state, merging read-only lesson content with
 * the user's personal progress into the runtime `Library` shape the UI
 * consumes. If this is the first load since upgrading from a version of
 * English Studio that stored progress inline (no `ett_progress` key yet),
 * data is read via the legacy combined-format path instead; the very next
 * `saveLibraries` call splits it into the new format automatically.
 */
export function loadLibraries(): Library[] {
  const hasSplitProgress = localStorage.getItem(PROGRESS_KEY) !== null;
  return hasSplitProgress ? loadSplitLibraries() : loadLegacyLibraries();
}

/**
 * Persists the runtime `Library` state by splitting each library back into
 * its read-only lesson content and its editable user progress, saving each
 * independently under its own key. Keeping them separate is what allows a
 * future feature to sync progress (e.g. via GitHub) without touching lesson
 * content. See docs/progress-sync-v1.md.
 */
export function saveLibraries(libraries: Library[]): void {
  const content: LibraryContent[] = [];
  const progress: Record<string, LibraryProgress> = {};
  for (const library of libraries) {
    const split = splitLibrary(library);
    content.push(split.content);
    progress[library.id] = split.progress;
  }
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
