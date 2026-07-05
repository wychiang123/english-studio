# English Studio

A simple personal web app for practicing English-to-Chinese (and back) translation using your own stories/text. Everything is stored locally in your browser via `localStorage` — there is no backend, no login, and no database.

## Features

- Organize stories into libraries. Add a library, then import a story into it.
- Import a story by pasting only an English transcript — everything else (title, source, sentence splitting, Chinese translation) is generated automatically by an import pipeline. Title/source and translation are currently placeholders (see below); sentences are split on sentence-ending punctuation, not line breaks, so hard-wrapped transcripts (e.g. Storyline Online .txt files) import correctly.
- Each sentence card lets you:
  - Show/hide the English original
  - Write your own Chinese translation attempt
  - Show/hide the AI Chinese translation
  - Write your own English reconstruction (translating back from Chinese)
  - Show/hide an AI English suggestion (placeholder for now)
  - Add free-form notes, plus vocabulary/phrase/grammar/native-expression notes
  - Mark the sentence as completed
- Global show/hide controls for all English originals / all Chinese translations in a story.
- All libraries, stories, and your inputs are saved automatically to `localStorage`, so your progress persists across browser sessions on the same machine/browser.

## Import pipeline

Pasting a transcript runs it through `src/import/importStory.ts`, a pipeline of small, independently replaceable steps:

```
Raw Transcript
    -> cleanTranscript()      join hard-wrapped lines into paragraphs, keep blank-line paragraph breaks
    -> splitSentences()       split each paragraph on sentence-ending punctuation (., !, ?)
    -> detectMetadata()       placeholder: title = "Untitled Story", source = "Imported"
    -> translateSentences()   placeholder: returns "" for every sentence
    -> buildStory()           assembles the final Story/Sentence objects
```

`detectMetadata` and `translateSentences` are placeholders today. They're already `async` and isolated in their own modules so they can be swapped for real AI API calls later without touching the rest of the app.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (includes `npm`)

## Running the app locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the URL printed in the terminal (usually `http://localhost:5173`) in your browser.

## Building for production

```bash
npm run build
```

This produces a static build in the `dist/` folder, which you can preview with:

```bash
npm run preview
```

## Usage notes

- Data is stored per-browser using `localStorage` under the key `ett_libraries`. Clearing your browser's site data (or using a different browser/device) will not carry over your libraries/stories.
- When importing a story, paste the transcript as-is (hard-wrapped lines are fine); sentences are detected by punctuation, not line breaks. A blank line is treated as a paragraph break.
