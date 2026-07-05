import { useState } from "react";

interface ImportStoryFormProps {
  onSubmit: (transcript: string) => void;
  onCancel: () => void;
}

export function ImportStoryForm({ onSubmit, onCancel }: ImportStoryFormProps) {
  const [transcript, setTranscript] = useState("");

  const canSubmit = transcript.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(transcript);
  }

  return (
    <div className="add-story-overlay">
      <form className="add-story-form" onSubmit={handleSubmit}>
        <h2>Import Story</h2>

        <label>
          Paste English Transcript (.txt)
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the English transcript here..."
            rows={16}
            autoFocus
          />
        </label>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit}>
            Import
          </button>
        </div>
      </form>
    </div>
  );
}
