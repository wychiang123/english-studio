import { createId } from "./id";
import { mergeSentence } from "./progress";
import type {
  LearningExample,
  LearningNote,
  Sentence,
  SentenceContent,
  SentenceProgress,
} from "./types";

export type Unknown = Record<string, unknown>;

export function isObject(value: unknown): value is Unknown {
  return typeof value === "object" && value !== null;
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeLearningExample(raw: unknown): LearningExample | null {
  if (!isObject(raw)) return null;
  return {
    english: asString(raw.english),
    chinese: asString(raw.chinese),
  };
}

export function normalizeLearningExamples(raw: unknown): LearningExample[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeLearningExample)
    .filter((e): e is LearningExample => e !== null);
}

export function normalizeLearningNote(raw: unknown): LearningNote | null {
  if (!isObject(raw)) return null;
  return {
    id: asString(raw.id) || createId(),
    title: asString(raw.title),
    explanation: asString(raw.explanation),
    examples: normalizeLearningExamples(raw.examples),
  };
}

export function normalizeLearningNotes(raw: unknown): LearningNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeLearningNote)
    .filter((n): n is LearningNote => n !== null);
}

/**
 * Extracts only the read-only lesson-content fields from a sentence-shaped
 * object, ignoring any user-progress fields it might also carry.
 */
export function normalizeSentenceContent(raw: unknown): SentenceContent | null {
  if (!isObject(raw)) return null;
  const aiEnglishSuggestion =
    typeof raw.aiEnglishSuggestion === "string"
      ? raw.aiEnglishSuggestion
      : undefined;
  return {
    id: asString(raw.id) || createId(),
    englishOriginal: asString(raw.englishOriginal),
    chineseTranslation: asString(raw.chineseTranslation),
    aiEnglishSuggestion,
    vocabularyNotes: normalizeLearningNotes(raw.vocabularyNotes),
    phraseNotes: normalizeLearningNotes(raw.phraseNotes),
    grammarNotes: normalizeLearningNotes(raw.grammarNotes),
    nativeExpressionNotes: normalizeLearningNotes(raw.nativeExpressionNotes),
  };
}

/**
 * Extracts the editable user-progress fields from a sentence-shaped object,
 * defaulting any that are missing (e.g. because `raw` is a freshly imported
 * Lesson JSON sentence, which never carries progress fields).
 */
export function normalizeSentenceProgress(raw: unknown): SentenceProgress {
  if (!isObject(raw)) {
    return {
      userChineseInput: "",
      userEnglishInput: "",
      userNote: "",
      showEnglish: true,
      showChineseTranslation: true,
      showAiEnglishSuggestion: false,
      completed: false,
    };
  }
  return {
    userChineseInput: asString(raw.userChineseInput),
    userEnglishInput: asString(raw.userEnglishInput),
    userNote: asString(raw.userNote),
    showEnglish: asBoolean(raw.showEnglish, true),
    showChineseTranslation: asBoolean(raw.showChineseTranslation, true),
    showAiEnglishSuggestion: asBoolean(raw.showAiEnglishSuggestion),
    completed: asBoolean(raw.completed),
  };
}

/**
 * Converts a raw, untrusted sentence-shaped object into a fully-formed
 * internal Sentence (lesson content merged with progress), filling in
 * defaults for any missing user-practice fields. Used for loading legacy
 * combined-format data and for importing a Lesson JSON, which never
 * carries progress fields.
 */
export function normalizeSentence(raw: unknown): Sentence | null {
  const content = normalizeSentenceContent(raw);
  if (!content) return null;
  return mergeSentence(content, normalizeSentenceProgress(raw));
}
