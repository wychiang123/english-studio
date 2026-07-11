import { useEffect, useRef, useState } from "react";
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

  const sentenceNodes = useRef<Record<string, HTMLDivElement | null>>({});
  const [resumeHighlightId, setResumeHighlightId] = useState<string | null>(
    null,
  );

  // Resume-scroll runs once per opened/switched story (keyed on story.id
  // only), so later completed/uncompleted toggles never trigger another jump.
  useEffect(() => {
    if (story.sentences.length === 0) return;

    const firstIncomplete = story.sentences.find((s) => !s.completed);
    // No incomplete sentence left: jump straight (no animation) to sentence
    // #1 instead of inheriting whatever scroll position the previous story
    // was left at.
    const targetId = firstIncomplete ? firstIncomplete.id : story.sentences[0].id;
    const node = sentenceNodes.current[targetId];
    node?.scrollIntoView({
      behavior: firstIncomplete ? "smooth" : "auto",
      block: "start",
    });

    if (!firstIncomplete) return;
    setResumeHighlightId(firstIncomplete.id);
    const timer = setTimeout(() => setResumeHighlightId(null), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

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
            ref={(node) => {
              sentenceNodes.current[sentence.id] = node;
            }}
            sentence={sentence}
            index={index}
            highlighted={sentence.id === resumeHighlightId}
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
