import { useState } from "react";

interface AddLibraryFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function AddLibraryForm({ onSubmit, onCancel }: AddLibraryFormProps) {
  const [name, setName] = useState("");

  const canSubmit = name.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(name);
  }

  return (
    <div className="add-story-overlay">
      <form className="add-story-form" onSubmit={handleSubmit}>
        <h2>Add Library</h2>

        <label>
          Library Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Graded Readers"
            autoFocus
          />
        </label>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit}>
            Create Library
          </button>
        </div>
      </form>
    </div>
  );
}
