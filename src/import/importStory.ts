import { cleanTranscript } from "./cleanTranscript";
import { splitSentences } from "./splitSentences";
import { detectMetadata } from "./detectMetadata";
import { translateSentences } from "./translate";
import { buildStory } from "./buildStory";
import type { Story } from "../types";

/**
 * Import pipeline:
 *   Raw Transcript -> Clean Transcript -> Split Sentences
 *     -> Detect Metadata -> Translate -> Build Story
 *
 * detectMetadata and translateSentences are placeholders today and are
 * expected to be swapped for AI-backed implementations later; both are
 * already async to keep that swap a drop-in change.
 */
export async function importStory(rawTranscript: string): Promise<Story> {
  const cleanedTranscript = cleanTranscript(rawTranscript);
  const englishSentences = splitSentences(cleanedTranscript);

  const metadata = await detectMetadata(englishSentences);
  const chineseTranslations = await translateSentences(englishSentences);

  const sentenceInputs = englishSentences.map((englishOriginal, index) => ({
    englishOriginal,
    chineseTranslation: chineseTranslations[index] ?? "",
  }));

  return buildStory(metadata.title, metadata.source, sentenceInputs);
}
