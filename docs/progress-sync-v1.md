# Lesson/Progress Architecture & Future Sync (v1)

## 1. Why this split exists

English Studio currently stores everything in `localStorage`. The long-term
goal is to sync a user's **study progress** across devices/browsers (e.g. via
a private GitHub repo or gist), while **lesson content** stays something you
import once (from a Lesson JSON file, per
[`lesson-format-v1.md`](./lesson-format-v1.md)) and treat as read-only.

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
