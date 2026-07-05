import { createId } from "../id";
import type { Sentence, Story } from "../types";

interface SentenceInput {
  englishOriginal: string;
  chineseTranslation: string;
}

export function buildStory(
  title: string,
  source: string | undefined,
  sentenceInputs: SentenceInput[],
): Story {
  const sentences: Sentence[] = sentenceInputs.map((input) => ({
    id: createId(),
    englishOriginal: input.englishOriginal,
    chineseTranslation: input.chineseTranslation,
    userChineseInput: "",
    userEnglishInput: "",
    aiEnglishSuggestion: undefined,
    userNote: "",
    vocabularyNotes: [],
    phraseNotes: [],
    grammarNotes: [],
    nativeExpressionNotes: [],
    showEnglish: false,
    showChineseTranslation: false,
    showAiEnglishSuggestion: false,
    completed: false,
  }));

  return {
    id: createId(),
    title: title.trim(),
    source,
    sentences,
  };
}
