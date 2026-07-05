/**
 * Splits sentence-ending punctuation from the start of the next sentence.
 * Requires the next sentence to start with something that plausibly opens
 * a new sentence (capital letter, digit, or opening quote/paren), which
 * avoids splitting on things like "3.14" or ellipses mid-sentence.
 */
const SENTENCE_BOUNDARY = /(?<=[.!?])\s+(?=[A-Z0-9"'“‘(])/;

export function splitSentences(cleanedTranscript: string): string[] {
  return cleanedTranscript
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 0)
    .flatMap((paragraph) => paragraph.split(SENTENCE_BOUNDARY))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
