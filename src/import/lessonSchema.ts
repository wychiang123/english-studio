import { isObject } from "../normalize";

/**
 * Structural validation for an ES Lesson JSON file, per
 * docs/lesson-format-v1.md. Returns a friendly error message describing the
 * first problem found, or null if the document is valid enough to import.
 */
export function validateLessonJson(raw: unknown): string | null {
  if (!isObject(raw)) {
    return "This file doesn't contain a valid Lesson JSON object.";
  }

  if (raw.schemaVersion !== "1.0") {
    return `Unsupported schemaVersion "${String(raw.schemaVersion)}". This version of English Studio only supports schemaVersion "1.0".`;
  }

  if (raw.lessonType !== "english-story") {
    return `Unsupported lessonType "${String(raw.lessonType)}". Expected "english-story".`;
  }

  if (typeof raw.title !== "string" || raw.title.trim().length === 0) {
    return "The lesson is missing a title.";
  }

  if (typeof raw.source !== "string" || raw.source.trim().length === 0) {
    return "The lesson is missing a source.";
  }

  if (raw.language !== "en") {
    return `Unsupported language "${String(raw.language)}". Expected "en".`;
  }

  if (typeof raw.createdAt !== "string" || raw.createdAt.trim().length === 0) {
    return "The lesson is missing a createdAt date.";
  }

  if (!Array.isArray(raw.sentences) || raw.sentences.length === 0) {
    return "The lesson has no sentences.";
  }

  for (let i = 0; i < raw.sentences.length; i++) {
    const sentence = raw.sentences[i];
    if (!isObject(sentence)) {
      return `Sentence ${i + 1} is not a valid object.`;
    }
    if (
      typeof sentence.id !== "string" ||
      sentence.id.trim().length === 0
    ) {
      return `Sentence ${i + 1} is missing an id.`;
    }
    if (typeof sentence.order !== "number") {
      return `Sentence ${i + 1} is missing its order.`;
    }
    if (
      typeof sentence.englishOriginal !== "string" ||
      sentence.englishOriginal.trim().length === 0
    ) {
      return `Sentence ${i + 1} is missing its English text.`;
    }
    if (typeof sentence.chineseTranslation !== "string") {
      return `Sentence ${i + 1} is missing its Chinese translation.`;
    }
    if (!Array.isArray(sentence.vocabularyNotes)) {
      return `Sentence ${i + 1} is missing vocabularyNotes.`;
    }
    if (!Array.isArray(sentence.phraseNotes)) {
      return `Sentence ${i + 1} is missing phraseNotes.`;
    }
    if (!Array.isArray(sentence.grammarNotes)) {
      return `Sentence ${i + 1} is missing grammarNotes.`;
    }
    if (!Array.isArray(sentence.nativeExpressionNotes)) {
      return `Sentence ${i + 1} is missing nativeExpressionNotes.`;
    }

    const noteFields = [
      "vocabularyNotes",
      "phraseNotes",
      "grammarNotes",
      "nativeExpressionNotes",
    ] as const;
    for (const field of noteFields) {
      const notes = sentence[field] as unknown[];
      for (let j = 0; j < notes.length; j++) {
        const note = notes[j];
        if (!isObject(note)) {
          return `Sentence ${i + 1}, ${field} item ${j + 1} is not a valid object.`;
        }
        if (!Array.isArray(note.examples)) {
          return `Sentence ${i + 1}, ${field} item ${j + 1} is missing an examples array.`;
        }
        for (let k = 0; k < note.examples.length; k++) {
          const example = note.examples[k];
          if (!isObject(example)) {
            return `Sentence ${i + 1}, ${field} item ${j + 1}, example ${k + 1} must be an object with "english" and "chinese" fields.`;
          }
          if (
            typeof example.english !== "string" ||
            example.english.trim().length === 0
          ) {
            return `Sentence ${i + 1}, ${field} item ${j + 1}, example ${k + 1} is missing its English text.`;
          }
          if (
            typeof example.chinese !== "string" ||
            example.chinese.trim().length === 0
          ) {
            return `Sentence ${i + 1}, ${field} item ${j + 1}, example ${k + 1} is missing its Chinese translation.`;
          }
        }
      }
    }
  }

  return null;
}
