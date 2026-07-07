import type {
  Library,
  LibraryContent,
  LibraryProgress,
  Sentence,
  SentenceContent,
  SentenceProgress,
  Story,
  StoryContent,
  StoryProgress,
} from "./types";

/**
 * Merging and splitting between read-only lesson content and editable user
 * progress. This is the boundary a future GitHub-sync feature would sit
 * behind: lesson content and progress can be loaded/saved from anywhere as
 * long as they're combined into the runtime shape via `mergeLibrary` and
 * separated back out via `splitLibrary`. See docs/progress-sync-v1.md.
 */

export function defaultSentenceProgress(): SentenceProgress {
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

export function mergeSentence(
  content: SentenceContent,
  progress: SentenceProgress | undefined,
): Sentence {
  return { ...content, ...(progress ?? defaultSentenceProgress()) };
}

export function splitSentence(sentence: Sentence): {
  content: SentenceContent;
  progress: SentenceProgress;
} {
  const {
    userChineseInput,
    userEnglishInput,
    userNote,
    showEnglish,
    showChineseTranslation,
    showAiEnglishSuggestion,
    completed,
    ...content
  } = sentence;
  return {
    content,
    progress: {
      userChineseInput,
      userEnglishInput,
      userNote,
      showEnglish,
      showChineseTranslation,
      showAiEnglishSuggestion,
      completed,
    },
  };
}

export function mergeStory(
  content: StoryContent,
  progress: StoryProgress | undefined,
): Story {
  return {
    id: content.id,
    title: content.title,
    source: content.source,
    sourcePath: content.sourcePath,
    sentences: content.sentences.map((sentence) =>
      mergeSentence(sentence, progress?.sentences[sentence.id]),
    ),
  };
}

export function splitStory(story: Story): {
  content: StoryContent;
  progress: StoryProgress;
} {
  const sentenceProgress: Record<string, SentenceProgress> = {};
  const sentenceContents: SentenceContent[] = story.sentences.map(
    (sentence) => {
      const split = splitSentence(sentence);
      sentenceProgress[sentence.id] = split.progress;
      return split.content;
    },
  );
  return {
    content: {
      id: story.id,
      title: story.title,
      source: story.source,
      sourcePath: story.sourcePath,
      sentences: sentenceContents,
    },
    progress: { sentences: sentenceProgress },
  };
}

export function mergeLibrary(
  content: LibraryContent,
  progress: LibraryProgress | undefined,
): Library {
  return {
    id: content.id,
    name: content.name,
    stories: content.stories.map((story) =>
      mergeStory(story, progress?.stories[story.id]),
    ),
  };
}

export function splitLibrary(library: Library): {
  content: LibraryContent;
  progress: LibraryProgress;
} {
  const storyProgress: Record<string, StoryProgress> = {};
  const storyContents: StoryContent[] = library.stories.map((story) => {
    const split = splitStory(story);
    storyProgress[story.id] = split.progress;
    return split.content;
  });
  return {
    content: { id: library.id, name: library.name, stories: storyContents },
    progress: { stories: storyProgress },
  };
}
