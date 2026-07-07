# Lesson/Progress Architecture & Future Sync (v1)

## Lesson Storage Model

English Studio separates **lesson content**, which is version-controlled in
this Git repository, from **personal practice data**, which lives only in
the browser. Any AI or developer reading this project's documentation should
treat these as two entirely separate storage layers — nothing in this repo
should be read as "all lesson data lives only in `localStorage`."

### Repository lesson content

- Canonical lesson files are stored under `lessons/<Source>/<Title>.eslesson.json`
  (e.g. `lessons/Storyline Online/Being Frank.eslesson.json`), per the
  [Lesson File Naming Convention](./lesson-generation-specification-v1.md#lesson-file-naming-convention).
- These lesson files are committed to the Git repository, exactly like source code.
- After `git commit` and `git push`, they are available on any other machine
  as soon as it runs `git pull` — no export/import step, no server, no account.
- **Browse Lessons** (`src/lessons/catalog.ts`) automatically discovers every
  `.eslesson.json` file under `lessons/` at build/dev time via Vite's
  `import.meta.glob`, and lists them in the app for one-click import.
- Per the [Immutable Lesson Rule](./lesson-generation-specification-v1.md#immutable-lesson-rule),
  a lesson file is treated as fixed course content once committed — it is not edited in place.

### Local browser data

**Only** the following are ever written to the browser's `localStorage`, and
only on the machine/browser where the user is practicing:

- The imported lesson library (the runtime copy created the moment a lesson
  is imported, via Browse Lessons or the manual file picker)
- Practice progress (per-sentence completion state)
- User Chinese translations
- User English reconstructions
- User notes
- Review/display state (show/hide toggles for English, Chinese, AI suggestions)

None of this is committed to Git, none of it is discoverable from another
machine, and none of it should be assumed to exist when an AI is reasoning
about or generating lesson content.

Note that "the imported lesson library" is itself a **copy** of lesson
content, snapshotted into `localStorage` at import time — importing never
modifies the canonical file under `lessons/`, and each machine's copy (and
its progress) stays independent unless a lesson is explicitly re-imported.
(Vocabulary/phrase/grammar/native-expression notes are a partial exception —
see [Section 6](#6-known-limitation) below.)

### Comparison

| Data | Git Repository | localStorage |
|------|----------------|--------------|
| Lesson JSON | ✓ | |
| Browse Lessons catalog | ✓ | |
| Imported Library | | ✓ |
| Practice Progress | | ✓ |
| User Translation | | ✓ |
| User Notes | | ✓ |

### Workflow example

```
Transcript
    ↓
AI generates .eslesson.json
    ↓
Save into lessons/<Source>/
    ↓
git commit
    ↓
git push
    ↓
Another computer
    ↓
git pull
    ↓
Browse Lessons
    ↓
Import
    ↓
Lesson becomes part of local library
```

"Lesson becomes part of local library" means a *copy* of the lesson content
is written into that machine's `localStorage` (`ett_libraries`); the
canonical file under `lessons/` is never modified, and that machine's
practice progress (`ett_progress`) is never synced anywhere.

## 1. Why this split exists

The rest of this document describes a second, independent split that exists
entirely *within* the browser-local layer above: separating a story's
**lesson content** (title, sentences, notes) from a user's **study
progress** (translations, notes, completion state), so a future feature can
sync progress across devices/browsers (e.g. via a private GitHub repo or
gist) without touching lesson content.

To make that possible later without a rewrite, the internal data model
already separates the two concerns today, even though both still live in
`localStorage` and there is no network sync yet.

## 2. The two concepts

**Lesson content** (read-only) — `SentenceContent`, `StoryContent`,
`LibraryContent` in [`src/types.ts`](../src/types.ts):

- `englishOriginal`, `chineseTranslation`, `aiEnglishSuggestion`
- `vocabularyNotes`, `phraseNotes`, `grammarNotes`, `nativeExpressionNotes`
- story `title`/`source`, library `name`

This is what an imported Lesson JSON file provides. It changes only when a
lesson is imported (or its notes are edited in-app).

**User progress** (editable) — `SentenceProgress`, `StoryProgress`,
`LibraryProgress`:

- `userChineseInput`, `userEnglishInput`, `userNote`
- `completed`
- `showEnglish`, `showChineseTranslation`, `showAiEnglishSuggestion` (per-sentence display state)

This is personal study state. It's what a future sync feature would
upload/download — small, user-specific, and independent of lesson content.

## 3. Runtime shape vs. storage shape

Every UI component (`SentenceCard`, `StoryView`, `App`, etc.) still works with
the familiar merged `Sentence` / `Story` / `Library` types — nothing changed
there. The merge happens at the storage boundary:

```
LibraryContent (lesson)  ─┐
                          ├─▶ mergeLibrary() ─▶ Library (runtime, used by UI)
LibraryProgress (progress)┘
```

and the reverse when saving:

```
Library (runtime) ─▶ splitLibrary() ─┬─▶ LibraryContent  (saved to ett_libraries)
                                      └─▶ LibraryProgress (saved to ett_progress)
```

These merge/split functions live in [`src/progress.ts`](../src/progress.ts).
`src/storage.ts` is the only place that knows about `localStorage`; it calls
`mergeLibrary`/`splitLibrary` on load/save so the rest of the app never has to
think about the two-key split.

## 4. Storage keys today

- `ett_libraries` — lesson content only (`LibraryContent[]`).
- `ett_progress` — user progress only, keyed by library id then story id
  then sentence id (`Record<libraryId, LibraryProgress>`).

Data saved by versions of English Studio before this split (progress fields
stored inline on each sentence, all under `ett_libraries`) is still readable:
`storage.ts` detects the missing `ett_progress` key, parses the old combined
shape, and the very next save (which happens automatically after any edit)
splits it into the new two-key format. No manual migration step is needed.

## 5. What a future GitHub-sync feature would need

This refactor deliberately stops short of adding any sync. When it's built,
the shape above suggests the natural approach:

1. Keep lesson content local-only (or fetch read-only Lesson JSON files from
   a repo) — it rarely changes and re-importing is already supported.
2. Serialize `LibraryProgress` (or per-story `StoryProgress`) to JSON and
   push/pull it from a private GitHub repo or gist, keyed by story id so it
   lines up with whatever lesson content is currently imported locally.
3. Reuse `mergeLibrary`/`splitLibrary` unchanged: after pulling progress from
   GitHub, merge it with local lesson content exactly as `loadLibraries()`
   does with `localStorage` today.
4. Decide a conflict-resolution rule (e.g. last-write-wins by timestamp) for
   the case where progress was edited on two devices before syncing.

None of this is implemented yet — there is no GitHub API call, no
authentication, and no network access anywhere in the app.

## 6. Known limitation

Vocabulary/phrase/grammar/native-expression notes are currently classified
as lesson content (they're generated at import time), but the UI still lets
a user add/edit/delete them locally (`LearningNoteList`). Those edits are
saved into the local `ett_libraries` content store, same as before this
refactor. If lesson content is ever sourced from a read-only GitHub-hosted
Lesson JSON in the future, locally-edited notes would need their own
reconciliation story — that's a follow-up problem, not solved here.
