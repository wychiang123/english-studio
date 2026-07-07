# English Studio Lesson Format v1

## 1. Overview

English Studio's content pipeline is split into two separate roles:

- **ChatGPT is the lesson factory.** A user gives ChatGPT a raw English transcript. ChatGPT cleans it, segments it into sentences, translates it, and generates learning notes (vocabulary, phrases, grammar, native expressions). ChatGPT outputs a single **Lesson JSON** file that conforms to this specification.
- **English Studio is the lesson reader/practice app.** English Studio imports a Lesson JSON file and turns it into a `Library` → `Story` → `Sentence` structure. From there it handles reading, practice (user translations, reconstructions, notes), progress tracking, and local persistence (`localStorage`).

**Important product decision:** English Studio v1 does **not** call the OpenAI API directly and does not require any API key or network access to function. All AI generation happens externally, in a ChatGPT session, before the file ever reaches English Studio. This keeps English Studio a simple, local-only, no-backend app while still letting users benefit from AI-generated lesson content.

## 2. Design principles

- The user provides a raw English transcript (e.g. pasted from a Storyline Online `.txt` file) to ChatGPT, not to English Studio.
- ChatGPT generates all structured lesson content: sentence segmentation, Chinese translation, and learning notes.
- English Studio imports **only** a structured Lesson JSON file — it does not do transcript cleaning, sentence splitting, or translation itself in v1.
- English Studio should never require the user to manually copy/paste a translation sentence-by-sentence. If the Lesson JSON is well-formed, import is a single paste-and-go action.
- English Studio must preserve user-created fields (practice inputs, notes, completion state) across the lifetime of a story. Re-importing or updating a lesson must never silently destroy a user's own work (see [Section 7](#7-import-behavior)).
- Lesson JSON files committed to this repository live under `lessons/<Source>/<Title>.eslesson.json` (e.g. `lessons/Storyline Online/Being Frank.eslesson.json`). The exact filename and folder rules, and the rule that a committed lesson file is immutable once added, are documented in [Lesson File Naming Convention](./lesson-generation-specification-v1.md#lesson-file-naming-convention) and [Immutable Lesson Rule](./lesson-generation-specification-v1.md#immutable-lesson-rule) in the generation specification.

## 3. Top-level JSON schema

A Lesson JSON file is a single JSON object with the following shape:

```ts
interface LessonJson {
  // Required
  schemaVersion: "1.0";
  lessonType: "english-story";
  title: string;
  source: string;
  language: "en";
  createdAt: string; // ISO 8601 datetime, e.g. "2026-07-05T09:00:00Z"
  sentences: LessonSentence[];

  // Optional
  sourceUrl?: string;
  author?: string;
  narrator?: string;
  tags?: string[];
  description?: string;
}
```

Field notes:

| Field | Required | Description |
|---|---|---|
| `schemaVersion` | yes | Must be the literal string `"1.0"` for this spec version. |
| `lessonType` | yes | Must be `"english-story"` in v1. Reserved for future lesson types (e.g. dialogues, articles). |
| `title` | yes | Human-readable lesson title. |
| `source` | yes | Where the transcript came from, e.g. `"Storyline Online"`, a book title, or `"Imported"` if unknown. |
| `sourceUrl` | no | Direct URL to the original source, if any. |
| `author` | no | Original author of the text, if known. |
| `narrator` | no | Narrator/reader of the audio, if known (e.g. for Storyline Online videos). |
| `language` | yes | Must be `"en"` in v1 — the language of `englishOriginal`. Reserved for future non-English source lessons. |
| `createdAt` | yes | ISO datetime string marking when ChatGPT generated the lesson. |
| `sentences` | yes | Ordered array of `LessonSentence` objects (see [Section 4](#4-sentence-schema)). |
| `tags` | no | Free-form tags for organizing/filtering lessons, e.g. `["kids", "animals"]`. |
| `description` | no | Short human-readable summary of the lesson. |

## 4. Sentence schema

```ts
interface LessonSentence {
  id: string;
  order: number;
  englishOriginal: string;
  chineseTranslation: string;
  aiEnglishSuggestion?: string;
  vocabularyNotes: LearningNote[];
  phraseNotes: LearningNote[];
  grammarNotes: LearningNote[];
  nativeExpressionNotes: LearningNote[];
}
```

| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique identifier for the sentence within the lesson (e.g. `"s1"`, a UUID, or any stable string). |
| `order` | yes | Zero- or one-based sentence position, used to guarantee display order independent of array order. |
| `englishOriginal` | yes | The cleaned, segmented English sentence. |
| `chineseTranslation` | yes | ChatGPT's Chinese translation of the sentence. May be an empty string only if translation genuinely isn't available, but should not be omitted. |
| `aiEnglishSuggestion` | no | An optional alternate/model English phrasing (e.g. a more natural reconstruction), for use as a reference answer in the reconstruction exercise. |
| `vocabularyNotes` | yes | Array of `LearningNote`s about individual words in this sentence. May be an empty array. |
| `phraseNotes` | yes | Array of `LearningNote`s about multi-word phrases/collocations in this sentence. May be an empty array. |
| `grammarNotes` | yes | Array of `LearningNote`s about grammar points in this sentence. May be an empty array. |
| `nativeExpressionNotes` | yes | Array of `LearningNote`s about idiomatic/native-sounding expressions in this sentence. May be an empty array. |

## 5. LearningNote schema

```ts
interface LearningNote {
  id: string;
  title: string;
  explanation: string;
  examples: string[];
}
```

| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique identifier for the note within its sentence/section. |
| `title` | yes | Short heading for the note — should be **English** when possible (e.g. a vocabulary word, a phrase, a grammar pattern name). |
| `explanation` | yes | The explanation of the note — should be written in **Traditional Chinese**. |
| `examples` | yes | Example sentences illustrating the note. Should **preferably be English** examples. May be an empty array if no good example exists. |

**Rules for note quality:**

- `title` should be in English whenever the concept being explained is an English word, phrase, or grammar term.
- `explanation` should be in Traditional Chinese, since it exists to explain the English content to a Chinese-speaking learner.
- `examples` should preferably be English sentences that demonstrate the note's title/point in context.
- **Do not include empty or low-value notes just to fill out a section.** An empty `vocabularyNotes: []` array is correct and expected for a simple sentence with nothing worth annotating. Never pad sections with filler notes to make them look "complete."

## 6. English Studio internal fields

The Lesson JSON format intentionally does **not** include any of English Studio's user-practice fields. ChatGPT should never generate these, and they must not appear in a valid Lesson JSON file:

- `userChineseInput`
- `userEnglishInput`
- `userNote`
- `showEnglish`
- `showChineseTranslation`
- `showAiEnglishSuggestion`
- `completed`

These fields belong to English Studio's internal `Sentence` type only. English Studio adds them automatically during import, with default values (empty strings for text inputs, `false` for booleans/flags). This keeps the Lesson JSON format focused purely on lesson *content*, while all user *practice state* lives only inside English Studio's local data.

**Lesson files on disk — including every file under `lessons/`, per the naming convention above — must never contain any of these fields.** User progress is written only to the browser's `localStorage` (the `ett_progress` key) and must never be written back into a lesson file, whether that file was imported via the file picker or discovered from the repository.

Internally, English Studio models this same split as `SentenceContent` (lesson) and `SentenceProgress` (practice state), merged at runtime — see [`docs/progress-sync-v1.md`](./progress-sync-v1.md) for the architecture and how it prepares for a future progress-sync feature.

## 7. Import behavior

When English Studio imports a Lesson JSON file, it should:

1. **Validate `schemaVersion`.** Only `"1.0"` is supported by this spec version.
2. **Reject unsupported schema versions.** If `schemaVersion` is missing, unrecognized, or newer than what English Studio understands, the import must fail with a clear error rather than silently guessing at the structure.
3. **Convert Lesson JSON into the internal `Story`/`Sentence` structure.** Each `LessonSentence` becomes an internal `Sentence`; `title`/`source` become the internal `Story.title`/`Story.source`.
4. **Preserve all AI-generated lesson notes.** `vocabularyNotes`, `phraseNotes`, `grammarNotes`, and `nativeExpressionNotes` are copied over as-is (each note keeping its `id`, `title`, `explanation`, `examples`).
5. **Add user-editable practice fields** (`userChineseInput`, `userEnglishInput`, `userNote`, `showEnglish`, `showChineseTranslation`, `showAiEnglishSuggestion`, `completed`) with their default values, since the Lesson JSON never contains them (see [Section 6](#6-english-studio-internal-fields)).
6. **Save the imported lesson into `localStorage`** as part of the selected library, exactly like any other story.

Because English Studio never overwrites a `Sentence`'s user-practice fields from a Lesson JSON re-import (the format doesn't carry them), a lesson can safely be re-imported or updated without wiping the user's existing input, as long as import is treated as *adding a new story* rather than *mutating an existing one in place*.

## 8. Example Lesson JSON

```json
{
  "schemaVersion": "1.0",
  "lessonType": "english-story",
  "title": "The Kind Little Fox",
  "source": "Storyline Online",
  "sourceUrl": "https://storylineonline.net/example",
  "author": "Jane Author",
  "narrator": "A Famous Narrator",
  "language": "en",
  "createdAt": "2026-07-05T09:00:00Z",
  "tags": ["kids", "animals"],
  "description": "A short story about a fox who helps her forest friends.",
  "sentences": [
    {
      "id": "s1",
      "order": 1,
      "englishOriginal": "Once upon a time, a little fox lived at the edge of a quiet forest.",
      "chineseTranslation": "從前,有一隻小狐狸住在一座寧靜森林的邊緣。",
      "aiEnglishSuggestion": "Long ago, a small fox made her home at the border of a peaceful forest.",
      "vocabularyNotes": [
        {
          "id": "v1",
          "title": "edge",
          "explanation": "「edge」指某個區域的邊緣或外圍部分,這裡指森林的邊界地帶。",
          "examples": [
            "She stood at the edge of the cliff.",
            "The house is on the edge of town."
          ]
        }
      ],
      "phraseNotes": [
        {
          "id": "p1",
          "title": "once upon a time",
          "explanation": "這是英文故事開頭常見的固定用語,相當於中文的「從前」,用來開啟一個童話或故事。",
          "examples": [
            "Once upon a time, there was a princess who loved to read."
          ]
        }
      ],
      "grammarNotes": [],
      "nativeExpressionNotes": []
    },
    {
      "id": "s2",
      "order": 2,
      "englishOriginal": "Every morning, she would wake up early to help her friends find food.",
      "chineseTranslation": "每天早上,她都會早起幫助朋友們尋找食物。",
      "vocabularyNotes": [],
      "phraseNotes": [],
      "grammarNotes": [
        {
          "id": "g1",
          "title": "would + verb (habitual past)",
          "explanation": "「would」加原形動詞用來描述過去經常發生的習慣性動作,語感類似中文的「總是會」。",
          "examples": [
            "Every summer, we would visit our grandparents.",
            "He would always bring a book to read."
          ]
        }
      ],
      "nativeExpressionNotes": [
        {
          "id": "n1",
          "title": "wake up early",
          "explanation": "「wake up early」是道地的英文說法,表示早起,比逐字翻譯「起床得早」更自然、更常被母語者使用。",
          "examples": [
            "I need to wake up early tomorrow for the meeting."
          ]
        }
      ]
    }
  ]
}
```

## 9. Separation of responsibility

**ChatGPT is responsible for:**

- Cleaning the raw transcript (removing hard line-wraps, fixing obvious transcription artifacts).
- Sentence segmentation (splitting the cleaned transcript into individual sentences).
- Chinese translation of each sentence.
- Generating vocabulary notes.
- Generating phrase notes.
- Generating grammar notes.
- Generating native expression notes.
- Producing a single, valid Lesson JSON file conforming to this specification.

**English Studio is responsible for:**

- Importing a Lesson JSON file.
- Displaying lesson content (English original, Chinese translation, AI English suggestion, all learning notes).
- Playing English audio through the browser's built-in text-to-speech (`speechSynthesis`) — no external audio files or TTS service.
- Storing user practice inputs (Chinese translation attempts, English reconstructions, personal notes).
- Storing completion progress per sentence.
- Allowing user edits to notes and other practice fields, and persisting them locally.

English Studio never calls an AI API and never generates or edits lesson content itself — it only reads, displays, and layers user practice state on top of what ChatGPT produced.

## 10. Future extensions

The following fields are **not** part of Lesson Format v1, but are anticipated for future schema versions:

- `difficulty` — a simple difficulty rating (e.g. `"beginner"` / `"intermediate"` / `"advanced"`).
- `cefrLevel` — a CEFR level estimate (e.g. `"A2"`, `"B1"`).
- `audioUrl` — a link to narrated audio for the story, as an alternative/supplement to browser TTS.
- `sourceTranscript` — the original raw transcript, preserved alongside the cleaned/segmented lesson for reference or re-processing.
- `reviewStatus` — tracking whether a lesson has been reviewed/verified by a human.
- `spacedRepetition` — scheduling metadata for spaced-repetition review of sentences or notes.
- `aiReviewFeedback` — AI-generated feedback on a user's practice attempts (translation, reconstruction), for a future version where English Studio *does* call an AI API.

Any of these would require a `schemaVersion` bump (e.g. `"1.1"` or `"2.0"`) and corresponding updates to English Studio's import validation.
