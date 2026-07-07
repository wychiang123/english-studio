import { importLessonJson } from "../import/importLesson";
import { lessonCatalog } from "../lessons/catalog";
import type { LessonCatalogEntry } from "../lessons/catalog";
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
                return (
                  <li key={entry.path} className="browse-lessons-item">
                    <span className="browse-lessons-title">{entry.title}</span>
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
