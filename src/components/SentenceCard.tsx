import type { LearningNote, Sentence } from "../types";
import { LearningNoteList } from "./LearningNoteList";
import { SpeakButton } from "./SpeakButton";

interface SentenceCardProps {
  sentence: Sentence;
  index: number;
  onUpdate: (id: string, updates: Partial<Sentence>) => void;
}

export function SentenceCard({ sentence, index, onUpdate }: SentenceCardProps) {
  function updateNotes(
    field:
      | "vocabularyNotes"
      | "phraseNotes"
      | "grammarNotes"
      | "nativeExpressionNotes",
    notes: LearningNote[],
  ) {
    onUpdate(sentence.id, { [field]: notes });
  }

  return (
    <div className={"sentence-card" + (sentence.completed ? " completed" : "")}>
      <div className="sentence-card-header">
        <span className="sentence-number">#{index + 1}</span>
      </div>

      <div className="field-row field-tint-english">
        <div className="field-label-row">
          <span className="field-label">English Original</span>
          <div className="field-label-actions">
            <SpeakButton text={sentence.englishOriginal} />
            <button
              className="toggle-btn"
              onClick={() =>
                onUpdate(sentence.id, { showEnglish: !sentence.showEnglish })
              }
            >
              {sentence.showEnglish ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {sentence.showEnglish && (
          <p className="readonly-text">{sentence.englishOriginal}</p>
        )}
      </div>

      <div className="field-row field-tint-input">
        <label className="field-label">My Chinese Translation</label>
        <textarea
          value={sentence.userChineseInput}
          onChange={(e) =>
            onUpdate(sentence.id, { userChineseInput: e.target.value })
          }
          rows={2}
          placeholder="Type your Chinese translation attempt..."
        />
      </div>

      <div className="field-row field-tint-ai">
        <div className="field-label-row">
          <span className="field-label">AI Chinese Translation</span>
          <button
            className="toggle-btn"
            onClick={() =>
              onUpdate(sentence.id, {
                showChineseTranslation: !sentence.showChineseTranslation,
              })
            }
          >
            {sentence.showChineseTranslation ? "Hide" : "Show"}
          </button>
        </div>
        {sentence.showChineseTranslation && (
          <p className="readonly-text">{sentence.chineseTranslation}</p>
        )}
      </div>

      <div className="field-row field-tint-input">
        <label className="field-label">My English Reconstruction</label>
        <textarea
          value={sentence.userEnglishInput}
          onChange={(e) =>
            onUpdate(sentence.id, { userEnglishInput: e.target.value })
          }
          rows={2}
          placeholder="Try to reconstruct the English sentence..."
        />
      </div>

      <div className="field-row">
        <div className="field-label-row">
          <span className="field-label">AI English Suggestion</span>
          <div className="field-label-actions">
            {sentence.aiEnglishSuggestion && (
              <SpeakButton text={sentence.aiEnglishSuggestion} />
            )}
            <button
              className="toggle-btn"
              onClick={() =>
                onUpdate(sentence.id, {
                  showAiEnglishSuggestion: !sentence.showAiEnglishSuggestion,
                })
              }
            >
              {sentence.showAiEnglishSuggestion ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {sentence.showAiEnglishSuggestion && (
          <p className="readonly-text placeholder-text">
            {sentence.aiEnglishSuggestion || "No AI suggestion yet."}
          </p>
        )}
      </div>

      <div className="field-row field-tint-input">
        <label className="field-label">My Notes</label>
        <textarea
          value={sentence.userNote}
          onChange={(e) => onUpdate(sentence.id, { userNote: e.target.value })}
          rows={2}
          placeholder="Any general notes about this sentence..."
        />
      </div>

      <LearningNoteList
        label="Vocabulary"
        notes={sentence.vocabularyNotes}
        onChange={(notes) => updateNotes("vocabularyNotes", notes)}
      />

      <LearningNoteList
        label="Phrases"
        notes={sentence.phraseNotes}
        onChange={(notes) => updateNotes("phraseNotes", notes)}
      />

      <LearningNoteList
        label="Grammar"
        notes={sentence.grammarNotes}
        onChange={(notes) => updateNotes("grammarNotes", notes)}
      />

      <LearningNoteList
        label="Native Expressions"
        notes={sentence.nativeExpressionNotes}
        onChange={(notes) => updateNotes("nativeExpressionNotes", notes)}
      />

      <div className="field-row completed-row">
        <label>
          <input
            type="checkbox"
            checked={sentence.completed}
            onChange={(e) =>
              onUpdate(sentence.id, { completed: e.target.checked })
            }
          />
          Completed
        </label>
      </div>
    </div>
  );
}
