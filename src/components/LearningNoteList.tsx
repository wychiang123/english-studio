import { createId } from "../id";
import { isEnglishText } from "../textLanguage";
import type { LearningExample, LearningNote } from "../types";
import { SpeakButton } from "./SpeakButton";

interface LearningNoteListProps {
  label: string;
  notes: LearningNote[];
  onChange: (notes: LearningNote[]) => void;
}

export function LearningNoteList({
  label,
  notes,
  onChange,
}: LearningNoteListProps) {
  function updateNote(id: string, updates: Partial<LearningNote>) {
    onChange(
      notes.map((note) => (note.id === id ? { ...note, ...updates } : note)),
    );
  }

  function addNote() {
    const newNote: LearningNote = {
      id: createId(),
      title: "",
      explanation: "",
      examples: [],
    };
    onChange([...notes, newNote]);
  }

  function removeNote(id: string) {
    onChange(notes.filter((note) => note.id !== id));
  }

  function addExample(note: LearningNote) {
    updateNote(note.id, {
      examples: [...note.examples, { english: "", chinese: "" }],
    });
  }

  function updateExample(
    note: LearningNote,
    index: number,
    updates: Partial<LearningExample>,
  ) {
    updateNote(note.id, {
      examples: note.examples.map((example, i) =>
        i === index ? { ...example, ...updates } : example,
      ),
    });
  }

  function removeExample(note: LearningNote, index: number) {
    updateNote(note.id, {
      examples: note.examples.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="learning-note-section">
      <div className="field-label-row">
        <span className="field-label">{label}</span>
        <button type="button" className="toggle-btn" onClick={addNote}>
          + Add
        </button>
      </div>

      {notes.length === 0 && (
        <p className="empty-hint">No {label.toLowerCase()} yet.</p>
      )}

      {notes.map((note) => (
        <div key={note.id} className="learning-note-item">
          <div className="learning-note-item-row">
            <input
              type="text"
              className="learning-note-title"
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              placeholder="Title"
            />
            {isEnglishText(note.title) && <SpeakButton text={note.title} />}
            <button
              type="button"
              className="delete-note-btn"
              title="Delete note"
              onClick={() => removeNote(note.id)}
            >
              ×
            </button>
          </div>
          <textarea
            value={note.explanation}
            onChange={(e) =>
              updateNote(note.id, { explanation: e.target.value })
            }
            rows={2}
            placeholder="Explanation"
          />

          <div className="example-list">
            {note.examples.map((example, index) => (
              <div key={index} className="example-item">
                <div className="example-row">
                  <input
                    type="text"
                    value={example.english}
                    onChange={(e) =>
                      updateExample(note, index, { english: e.target.value })
                    }
                    placeholder="Example (English)"
                  />
                  {isEnglishText(example.english) && (
                    <SpeakButton text={example.english} />
                  )}
                  <button
                    type="button"
                    className="delete-note-btn"
                    title="Delete example"
                    onClick={() => removeExample(note, index)}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  className="example-chinese"
                  value={example.chinese}
                  onChange={(e) =>
                    updateExample(note, index, { chinese: e.target.value })
                  }
                  placeholder="Example (Traditional Chinese)"
                />
              </div>
            ))}
            <button
              type="button"
              className="toggle-btn"
              onClick={() => addExample(note)}
            >
              + Add example
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
