export interface DetectedMetadata {
  title: string;
  source?: string;
}

/**
 * Placeholder. Will be replaced with an AI call that infers a title
 * (and possibly a source) from the transcript's sentences.
 */
export async function detectMetadata(
  _sentences: string[],
): Promise<DetectedMetadata> {
  return {
    title: "Untitled Story",
    source: "Imported",
  };
}
