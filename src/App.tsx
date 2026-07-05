import { useEffect, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { AddLibraryForm } from "./components/AddLibraryForm";
import { ImportStoryForm } from "./components/ImportStoryForm";
import { StoryView } from "./components/StoryView";
import { loadLibraries, saveLibraries } from "./storage";
import { createLibrary } from "./factories";
import { importStory } from "./import/importStory";
import type { Library, Sentence, Story } from "./types";

function App() {
  const [libraries, setLibraries] = useState<Library[]>(() =>
    loadLibraries(),
  );
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    () => loadLibraries()[0]?.id ?? null,
  );
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showAddLibraryForm, setShowAddLibraryForm] = useState(false);
  const [showImportStoryForm, setShowImportStoryForm] = useState(false);

  useEffect(() => {
    saveLibraries(libraries);
  }, [libraries]);

  function handleAddLibrary(name: string) {
    const library = createLibrary(name);
    setLibraries((prev) => [...prev, library]);
    setSelectedLibraryId(library.id);
    setSelectedStoryId(null);
    setShowAddLibraryForm(false);
  }

  function handleSelectLibrary(id: string) {
    setSelectedLibraryId(id);
    setSelectedStoryId(null);
  }

  async function handleImportStory(transcript: string) {
    if (!selectedLibraryId) return;
    const story = await importStory(transcript);
    setLibraries((prev) =>
      prev.map((library) =>
        library.id === selectedLibraryId
          ? { ...library, stories: [...library.stories, story] }
          : library,
      ),
    );
    setSelectedStoryId(story.id);
    setShowImportStoryForm(false);
  }

  function handleDeleteStory(storyId: string) {
    if (!selectedLibraryId) return;
    setLibraries((prev) =>
      prev.map((library) =>
        library.id === selectedLibraryId
          ? {
              ...library,
              stories: library.stories.filter((s) => s.id !== storyId),
            }
          : library,
      ),
    );
    setSelectedStoryId((current) => (current === storyId ? null : current));
  }

  function updateStory(storyId: string, updater: (story: Story) => Story) {
    if (!selectedLibraryId) return;
    setLibraries((prev) =>
      prev.map((library) => {
        if (library.id !== selectedLibraryId) return library;
        return {
          ...library,
          stories: library.stories.map((story) =>
            story.id === storyId ? updater(story) : story,
          ),
        };
      }),
    );
  }

  function handleUpdateSentence(
    storyId: string,
    sentenceId: string,
    updates: Partial<Sentence>,
  ) {
    updateStory(storyId, (story) => ({
      ...story,
      sentences: story.sentences.map((sentence) =>
        sentence.id === sentenceId ? { ...sentence, ...updates } : sentence,
      ),
    }));
  }

  function handleShowAllEnglish(storyId: string, show: boolean) {
    updateStory(storyId, (story) => ({
      ...story,
      sentences: story.sentences.map((sentence) => ({
        ...sentence,
        showEnglish: show,
      })),
    }));
  }

  function handleShowAllChinese(storyId: string, show: boolean) {
    updateStory(storyId, (story) => ({
      ...story,
      sentences: story.sentences.map((sentence) => ({
        ...sentence,
        showChineseTranslation: show,
      })),
    }));
  }

  const selectedLibrary =
    libraries.find((l) => l.id === selectedLibraryId) ?? null;
  const selectedStory =
    selectedLibrary?.stories.find((s) => s.id === selectedStoryId) ?? null;

  return (
    <div className="app">
      <Sidebar
        libraries={libraries}
        selectedLibraryId={selectedLibraryId}
        selectedStoryId={selectedStoryId}
        onSelectLibrary={handleSelectLibrary}
        onSelectStory={setSelectedStoryId}
        onAddLibraryClick={() => setShowAddLibraryForm(true)}
        onImportStoryClick={() => setShowImportStoryForm(true)}
        onDeleteStory={handleDeleteStory}
      />

      <main className="main-area">
        {selectedStory ? (
          <StoryView
            story={selectedStory}
            onUpdateSentence={handleUpdateSentence}
            onShowAllEnglish={handleShowAllEnglish}
            onShowAllChinese={handleShowAllChinese}
          />
        ) : (
          <div className="no-story-selected">
            <p>
              {selectedLibrary
                ? "Select a story from the sidebar, or import a new one."
                : "Select or add a library to get started."}
            </p>
          </div>
        )}
      </main>

      {showAddLibraryForm && (
        <AddLibraryForm
          onSubmit={handleAddLibrary}
          onCancel={() => setShowAddLibraryForm(false)}
        />
      )}

      {showImportStoryForm && (
        <ImportStoryForm
          onSubmit={handleImportStory}
          onCancel={() => setShowImportStoryForm(false)}
        />
      )}
    </div>
  );
}

export default App;
