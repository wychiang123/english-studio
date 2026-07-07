export interface LearningNote {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
}

/**
 * Read-only lesson content for a single sentence, as it comes from an
 * imported Lesson JSON file. Never mutated by practice activity.
 */
export interface SentenceContent {
  id: string;
  englishOriginal: string;
  chineseTranslation: string;
  aiEnglishSuggestion?: string;
  vocabularyNotes: LearningNote[];
  phraseNotes: LearningNote[];
  grammarNotes: LearningNote[];
  nativeExpressionNotes: LearningNote[];
}

/**
 * A user's personal, editable study progress for a single sentence. Kept
 * independent of lesson content so it can eventually be synced (e.g. via
 * GitHub) without touching the lesson itself. See docs/progress-sync-v1.md.
 */
export interface SentenceProgress {
  userChineseInput: string;
  userEnglishInput: string;
  userNote: string;
  showEnglish: boolean;
  showChineseTranslation: boolean;
  showAiEnglishSuggestion: boolean;
  completed: boolean;
}

/** Runtime view of a sentence: lesson content merged with the user's progress. */
export interface Sentence extends SentenceContent, SentenceProgress {}

/** Read-only lesson content for a story (a single imported lesson). */
export interface StoryContent {
  id: string;
  title: string;
  source?: string;
  /**
   * Root-relative path of the `lessons/` file this story was imported from
   * (e.g. `/lessons/BBC/Some Title.eslesson.json`), if it came from the
   * repository's lesson catalog rather than the manual file picker. Used to
   * detect that a repo lesson has already been imported.
   */
  sourcePath?: string;
  sentences: SentenceContent[];
}

/** Progress for every sentence in one story, keyed by sentence id. */
export interface StoryProgress {
  sentences: Record<string, SentenceProgress>;
}

/** Runtime view of a story: lesson content merged with the user's progress. */
export interface Story {
  id: string;
  title: string;
  source?: string;
  sourcePath?: string;
  sentences: Sentence[];
}

/** Read-only lesson content for a library (a collection of stories). */
export interface LibraryContent {
  id: string;
  name: string;
  stories: StoryContent[];
}

/** Progress for every story in one library, keyed by story id. */
export interface LibraryProgress {
  stories: Record<string, StoryProgress>;
}

/** Runtime view of a library: lesson content merged with the user's progress. */
export interface Library {
  id: string;
  name: string;
  stories: Story[];
}
