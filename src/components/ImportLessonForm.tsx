import { useState } from "react";
import { importLessonFile } from "../import/importLesson";
import type { Story } from "../types";

interface ImportLessonFormProps {
  onImport: (story: Story) => void;
  onCancel: () => void;
}

export function ImportLessonForm({
  onImport,
  onCancel,
}: ImportLessonFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setImporting(true);
    setError(null);
    const result = await importLessonFile(file);
    setImporting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.story);
  }

  return (
    <div className="add-story-overlay">
      <form className="add-story-form" onSubmit={handleSubmit}>
        <h2>Import Lesson</h2>

        <label>
          Choose ES Lesson (.json)
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
          />
        </label>

        {error && <p className="import-error">{error}</p>}

        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={!file || importing}>
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </form>
    </div>
  );
}
