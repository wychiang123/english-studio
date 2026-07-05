import { createId } from "../id";
import { isObject, normalizeSentence } from "../normalize";
import type { Sentence, Story } from "../types";
import { validateLessonJson } from "./lessonSchema";

export type ImportLessonResult =
  | { ok: true; story: Story }
  | { ok: false; error: string };

/**
 * Validates a parsed Lesson JSON document and converts it into an internal
 * Story, per docs/lesson-format-v1.md Section 7 (Import behavior). Sentences
 * are ordered by their `order` field; user-practice fields are initialized
 * to their defaults since the Lesson JSON never carries them.
 */
export function importLessonJson(raw: unknown): ImportLessonResult {
  const error = validateLessonJson(raw);
  if (error) return { ok: false, error };

  const lesson = raw as Record<string, unknown>;
  const rawSentences = (lesson.sentences as unknown[])
    .filter(isObject)
    .slice()
    .sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : 0;
      const orderB = typeof b.order === "number" ? b.order : 0;
      return orderA - orderB;
    });

  const sentences = rawSentences
    .map(normalizeSentence)
    .filter((s): s is Sentence => s !== null);

  return {
    ok: true,
    story: {
      id: createId(),
      title: (lesson.title as string).trim(),
      source: lesson.source as string,
      sentences,
    },
  };
}

/**
 * Reads a File selected by the user, parses it as JSON, and imports it as a
 * Lesson. Returns a friendly error for unreadable files, invalid JSON, or a
 * document that fails Lesson JSON validation.
 */
export async function importLessonFile(
  file: File,
): Promise<ImportLessonResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "Could not read the selected file." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "This file is not valid JSON. Please choose an ES Lesson JSON file.",
    };
  }

  return importLessonJson(parsed);
}
