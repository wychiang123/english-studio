import { importLessonJson } from "../import/importLesson";
import { lessonCatalog } from "../lessons/catalog";
import type { LessonCatalogEntry } from "../lessons/catalog";
import { isObject } from "../normalize";
import type { Library, Story } from "../types";

interface BrowseLessonsFormProps {
  libraries: Library[];
  onImport: (story: Story) => void;
  onImportMany: (stories: Story[]) => void;
  onClose: () => void;
}

function groupBySource(
  entries: LessonCatalogEntry[],
): Map<string, LessonCatalogEntry[]> {
  const groups = new Map<string, LessonCatalogEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.source);
    if (group) {
      group.push(entry);
    } else {
      groups.set(entry.source, [entry]);
    }
  }
  return groups;
}

/**
 * Sentence counts for a lesson's progress summary. If the lesson has already
 * been imported, reads completion straight off its persisted sentences
 * (same `sentence.completed` field the sidebar/story view already use). If
 * it hasn't been imported yet, there is no practice data, so it's always
 * 0 completed out of the sentence count read from the raw catalog JSON.
 */
function getSentenceCounts(
  entry: LessonCatalogEntry,
  importedStory: Story | undefined,
): { completed: number; total: number } {
  if (importedStory) {
    return {
      completed: importedStory.sentences.filter((s) => s.completed).length,
      total: importedStory.sentences.length,
    };
  }
  const total =
    isObject(entry.raw) && Array.isArray(entry.raw.sentences)
      ? entry.raw.sentences.length
      : 0;
  return { completed: 0, total };
}

function progressStatus(completed: number, total: number): {
  icon: string;
  label: string;
} {
  const icon = completed <= 0 ? "⚪" : completed < total ? "🟡" : "🟢";
  const label =
    completed <= 0 ? "Not Started" : completed < total ? "In Progress" : "Completed";
  return { icon, label };
}

function progressCountLine(completed: number, total: number): string {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `${completed} / ${total} (${percent}%)`;
}

export function BrowseLessonsForm({
  libraries,
  onImport,
  onImportMany,
  onClose,
}: BrowseLessonsFormProps) {
  const importedPaths = new Set(
    libraries.flatMap((library) =>
      library.stories
        .map((story) => story.sourcePath)
        .filter((path): path is string => Boolean(path)),
    ),
  );

  const importedStoryByPath = new Map<string, Story>();
  for (const library of libraries) {
    for (const story of library.stories) {
      if (story.sourcePath) importedStoryByPath.set(story.sourcePath, story);
    }
  }

  const groups = groupBySource(lessonCatalog);
  const newEntries = lessonCatalog.filter(
    (entry) => !entry.error && !importedPaths.has(entry.path),
  );

  function handleImportOne(entry: LessonCatalogEntry) {
    const result = importLessonJson(entry.raw, { sourcePath: entry.path });
    if (result.ok) onImport(result.story);
  }

  function handleImportAllNew() {
    const stories: Story[] = [];
    for (const entry of newEntries) {
      const result = importLessonJson(entry.raw, { sourcePath: entry.path });
      if (result.ok) stories.push(result.story);
    }
    if (stories.length > 0) onImportMany(stories);
  }

  return (
    <div className="add-story-overlay">
      <div className="add-story-form browse-lessons-form">
        <h2>Browse Lessons</h2>

        {lessonCatalog.length === 0 && (
          <p className="empty-hint">
            No lesson files found under <code>lessons/</code>.
          </p>
        )}

        {[...groups.entries()].map(([source, entries]) => (
          <div key={source} className="browse-lessons-group">
            <h3 className="browse-lessons-group-title">{source}</h3>
            <ul className="browse-lessons-list">
              {entries.map((entry) => {
                const imported = importedPaths.has(entry.path);
                const { completed, total } = getSentenceCounts(
                  entry,
                  importedStoryByPath.get(entry.path),
                );
                const { icon, label } = progressStatus(completed, total);
                return (
                  <li key={entry.path} className="browse-lessons-item">
                    <div className="browse-lessons-title-group">
                      <span className="browse-lessons-title">{entry.title}</span>
                      {!entry.error && (
                        <div className="browse-lessons-progress">
                          <div className="browse-lessons-progress-status">
                            {icon} {label}
                          </div>
                          <div className="browse-lessons-progress-count">
                            {progressCountLine(completed, total)}
                          </div>
                        </div>
                      )}
                    </div>
                    {entry.error ? (
                      <span
                        className="browse-lessons-status browse-lessons-error"
                        title={entry.error}
                      >
                        Invalid
                      </span>
                    ) : imported ? (
                      <span className="browse-lessons-status browse-lessons-imported">
                        Imported
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImportOne(entry)}
                      >
                        Import
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            onClick={handleImportAllNew}
            disabled={newEntries.length === 0}
          >
            {newEntries.length > 0
              ? `Import All New (${newEntries.length})`
              : "Import All New"}
          </button>
        </div>
      </div>
    </div>
  );
}
