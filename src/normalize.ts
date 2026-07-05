import { createId } from "./id";
import type { LearningNote, Sentence } from "./types";

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

export function normalizeLearningNote(raw: unknown): LearningNote | null {
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

export function normalizeLearningNotes(raw: unknown): LearningNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeLearningNote)
    .filter((n): n is LearningNote => n !== null);
}

/**
 * Converts a raw, untrusted sentence-shaped object into a fully-formed
 * internal Sentence, filling in defaults for any missing user-practice
 * fields. Used both when loading persisted libraries from localStorage and
 * when building a Story from an imported Lesson JSON.
 */
export function normalizeSentence(raw: unknown): Sentence | null {
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
    showEnglish: asBoolean(raw.showEnglish, true),
    showChineseTranslation: asBoolean(raw.showChineseTranslation, true),
    showAiEnglishSuggestion: asBoolean(raw.showAiEnglishSuggestion),
    completed: asBoolean(raw.completed),
  };
}
