import type { Sentence, Story } from "../types";
import { SentenceCard } from "./SentenceCard";

interface StoryViewProps {
  story: Story;
  onUpdateSentence: (
    storyId: string,
    sentenceId: string,
    updates: Partial<Sentence>,
  ) => void;
  onShowAllEnglish: (storyId: string, show: boolean) => void;
  onShowAllChinese: (storyId: string, show: boolean) => void;
}

export function StoryView({
  story,
  onUpdateSentence,
  onShowAllEnglish,
  onShowAllChinese,
}: StoryViewProps) {
  const total = story.sentences.length;
  const done = story.sentences.filter((s) => s.completed).length;

  return (
    <div className="story-view">
      <div className="story-view-header">
        <h1>{story.title}</h1>
        <span className="story-progress-main">
          {done}/{total} completed
        </span>
      </div>
      {story.source && <p className="story-source">Source: {story.source}</p>}

      <div className="global-controls">
        <button onClick={() => onShowAllEnglish(story.id, true)}>
          Show All English
        </button>
        <button onClick={() => onShowAllEnglish(story.id, false)}>
          Hide All English
        </button>
        <button onClick={() => onShowAllChinese(story.id, true)}>
          Show All Chinese
        </button>
        <button onClick={() => onShowAllChinese(story.id, false)}>
          Hide All Chinese
        </button>
      </div>

      <div className="sentence-list">
        {story.sentences.map((sentence, index) => (
          <SentenceCard
            key={sentence.id}
            sentence={sentence}
            index={index}
            onUpdate={(sentenceId, updates) =>
              onUpdateSentence(story.id, sentenceId, updates)
            }
          />
        ))}
        {story.sentences.length === 0 && (
          <p className="empty-hint">This story has no sentences.</p>
        )}
      </div>
    </div>
  );
}
