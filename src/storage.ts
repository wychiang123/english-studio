import { createId } from "./id";
import type { Library, LearningNote, Sentence, Story } from "./types";

const STORAGE_KEY = "ett_libraries";
const OLD_STORAGE_KEY = "ett_stories";
const DEFAULT_LIBRARY_NAME = "My Library";

type Unknown = Record<string, unknown>;

function isObject(value: unknown): value is Unknown {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeLearningNote(raw: unknown): LearningNote | null {
  if (!isObject(raw)) return null;
  const examples = Array.isArray(raw.examples)
    ? raw.examples.filter((e): e is string => typeof e === "string")
    : [];
  return {
    id: asString(raw.id) || createId(),
    title: asString(raw.title),
    explanation: asString(raw.explanation),
    examples,
  };
}

function normalizeLearningNotes(raw: unknown): LearningNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeLearningNote)
    .filter((n): n is LearningNote => n !== null);
}

function normalizeSentence(raw: unknown): Sentence | null {
  if (!isObject(raw)) return null;
  const aiEnglishSuggestion =
    typeof raw.aiEnglishSuggestion === "string"
      ? raw.aiEnglishSuggestion
      : undefined;
  return {
    id: asString(raw.id) || createId(),
    englishOriginal: asString(raw.englishOriginal),
    chineseTranslation: asString(raw.chineseTranslation),
    userChineseInput: asString(raw.userChineseInput),
    userEnglishInput: asString(raw.userEnglishInput),
    aiEnglishSuggestion,
    userNote: asString(raw.userNote),
    vocabularyNotes: normalizeLearningNotes(raw.vocabularyNotes),
    phraseNotes: normalizeLearningNotes(raw.phraseNotes),
    grammarNotes: normalizeLearningNotes(raw.grammarNotes),
    nativeExpressionNotes: normalizeLearningNotes(raw.nativeExpressionNotes),
    showEnglish: asBoolean(raw.showEnglish),
    showChineseTranslation: asBoolean(raw.showChineseTranslation),
    showAiEnglishSuggestion: asBoolean(raw.showAiEnglishSuggestion),
    completed: asBoolean(raw.completed),
  };
}

function normalizeStory(raw: unknown): Story | null {
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
