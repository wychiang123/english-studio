/**
 * Normalizes a raw transcript into paragraphs of continuous text.
 *
 * Source transcripts (e.g. Storyline Online .txt files) are hard-wrapped
 * at an arbitrary column, so a single line break does NOT mean a sentence
 * or paragraph boundary — it's often just where the original text wrapped.
 * A blank line, however, does mark a real paragraph break.
 *
 * This joins soft-wrapped lines within a paragraph into one continuous
 * line (separated by a single space), and preserves paragraph breaks as
 * blank lines, so downstream steps can split on sentence punctuation
 * instead of line breaks.
 */
export function cleanTranscript(rawTranscript: string): string {
  const normalizedLineEndings = rawTranscript.replace(/\r\n/g, "\n");

  const paragraphs = normalizedLineEndings
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((paragraph) => paragraph.length > 0);

  return paragraphs.join("\n\n");
}
