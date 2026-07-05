export interface LearningNote {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
}

export interface Sentence {
  id: string;
  englishOriginal: string;
  chineseTranslation: string;
  userChineseInput: string;
  userEnglishInput: string;
  aiEnglishSuggestion?: string;
  userNote: string;
  vocabularyNotes: LearningNote[];
  phraseNotes: LearningNote[];
  grammarNotes: LearningNote[];
  nativeExpressionNotes: LearningNote[];
  showEnglish: boolean;
  showChineseTranslation: boolean;
  showAiEnglishSuggestion: boolean;
  completed: boolean;
}

export interface Story {
  id: string;
  title: string;
  source?: string;
  sentences: Sentence[];
}

export interface Library {
  id: string;
  name: string;
  stories: Story[];
}
