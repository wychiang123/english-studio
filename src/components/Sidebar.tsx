import type { Library } from "../types";

interface SidebarProps {
  libraries: Library[];
  selectedLibraryId: string | null;
  selectedStoryId: string | null;
  onSelectLibrary: (id: string) => void;
  onSelectStory: (id: string) => void;
  onAddLibraryClick: () => void;
  onImportLessonClick: () => void;
  onDeleteStory: (storyId: string) => void;
}

export function Sidebar({
  libraries,
  selectedLibraryId,
  selectedStoryId,
  onSelectLibrary,
  onSelectStory,
  onAddLibraryClick,
  onImportLessonClick,
  onDeleteStory,
}: SidebarProps) {
  const selectedLibrary =
    libraries.find((lib) => lib.id === selectedLibraryId) ?? null;

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h2 className="sidebar-heading">Libraries</h2>
          <button className="add-btn" onClick={onAddLibraryClick}>
            + Add Library
          </button>
        </div>
        <ul className="library-list">
          {libraries.map((library) => (
            <li
              key={library.id}
              className={
                "library-list-item" +
                (library.id === selectedLibraryId ? " selected" : "")
              }
            >
              <button
                className="library-list-item-btn"
                onClick={() => onSelectLibrary(library.id)}
              >
                <span className="library-name">{library.name}</span>
                <span className="library-count">
                  {library.stories.length}
                </span>
              </button>
            </li>
          ))}
          {libraries.length === 0 && (
            <li className="empty-hint">No libraries yet.</li>
          )}
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h2 className="sidebar-heading">Stories</h2>
          <button className="add-btn" onClick={onImportLessonClick}>
            + Import Lesson
          </button>
        </div>

        {!selectedLibrary && (
          <p className="empty-hint">Select a library to see its stories.</p>
        )}

        {selectedLibrary && (
          <ul className="story-list">
            {selectedLibrary.stories.map((story) => {
              const total = story.sentences.length;
              const done = story.sentences.filter((s) => s.completed).length;
              return (
                <li
                  key={story.id}
                  className={
                    "story-list-item" +
                    (story.id === selectedStoryId ? " selected" : "")
                  }
                >
                  <button
                    className="story-list-item-btn"
                    onClick={() => onSelectStory(story.id)}
                  >
                    <span className="story-title">{story.title}</span>
                    <span className="story-progress">
                      {done}/{total}
                    </span>
                  </button>
                  <button
                    className="delete-story-btn"
                    title="Delete story"
                    onClick={() => onDeleteStory(story.id)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
            {selectedLibrary.stories.length === 0 && (
              <li className="empty-hint">No stories yet.</li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
