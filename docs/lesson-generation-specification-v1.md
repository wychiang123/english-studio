# English Studio Lesson Generation Specification v1

## 1. Purpose

This document defines **how ChatGPT generates a Lesson JSON file from a raw English transcript**. It is the companion specification to [`docs/lesson-format-v1.md`](./lesson-format-v1.md), which defines *what* the output must look like. This document defines *the process* that produces that output: the ordered pipeline of stages ChatGPT works through, what each stage is responsible for, and the rules and validation checks that keep the result trustworthy.

This is a **formal specification**, not a prompt and not implementation code. It exists so that:

- Anyone generating lessons (a ChatGPT session, or any future tool) can follow a consistent, repeatable process.
- The resulting Lesson JSON reliably satisfies the schema and quality bar English Studio depends on.
- The boundary between "lesson generation" (ChatGPT's job) and "lesson reading/practice" (English Studio's job) stays clear, matching the separation of responsibility already established in [Lesson Format v1, Section 9](./lesson-format-v1.md#9-separation-of-responsibility).

This specification follows the project-wide Specification Priority defined in [`docs/specification-priority.md`](./specification-priority.md). Where this document's stages or rules require a trade-off — for example between finishing generation quickly and generating a complete lesson — that priority order, not local judgment, decides which requirement wins.

## 2. Design Philosophy

- **One raw transcript in, one valid Lesson JSON out.** The generation process takes a single raw English transcript as input and always presents a single Lesson JSON file as its final output — no intermediate files, no chunk files, and no partial exports are ever presented as the result.
- **Internal generation strategy is invisible at the deliverable boundary.** The generation process may use any internal strategy necessary — including dividing a very large transcript into chunks (see [Section 4, Large Transcript Generation Strategy](#4-large-transcript-generation-strategy)) — to work within the model's context or token limits. However, those internal implementation details must be completely transparent to English Studio. Regardless of how generation is performed internally, the only valid final deliverable is one complete, validated, directly importable `.eslesson.json` file.
- **Every stage has one job.** Each stage in the pipeline performs one clearly-scoped transformation and hands its output to the next stage. A stage should not reach ahead into a later stage's responsibility (e.g. Sentence Segmentation should not attempt translation).
- **Fidelity to the source text is non-negotiable.** Normalization and segmentation may reformat the transcript, but must never change its wording, meaning, or add invented content.
- **The lesson must be complete — partial generation is prohibited.** The generated lesson must include every sentence from the normalized transcript. If the AI cannot finish generating a lesson — for any reason, including the limits described in [Section 4](#4-large-transcript-generation-strategy) — it must stop before [Lesson Export](#511-lesson-export) and report the incomplete state (see [Section 8, Failure Recovery Rules](#8-failure-recovery-rules)) instead of exporting a partial lesson.
- **Educational value over completeness-for-its-own-sake.** A lesson is not "more complete" for having more notes. Every note must earn its place (see [Section 6, Avoid filler content](#avoid-filler-content)).
- **Validate before export.** A lesson is only ever exported after it has been checked against the Lesson Format v1 schema and this specification's validation rules, including [Complete Lesson Verification](#complete-lesson-verification) confirming that every sentence — and, where chunked generation was used, every chunk — is fully accounted for. An invalid, incomplete, or partially merged lesson must not be exported.
- **Generation and consumption stay separate.** This specification governs generation only. It has no bearing on how English Studio imports, displays, or stores a lesson — that behavior is governed entirely by [Lesson Format v1, Section 7](./lesson-format-v1.md#7-import-behavior).

## 3. Generation Pipeline

```
Raw Transcript
    ↓
Transcript Normalization
    ↓
Sentence Segmentation
    ↓
Metadata Detection
    ↓
Chinese Translation
    ↓
Vocabulary Analysis
    ↓
Phrase Analysis
    ↓
Grammar Analysis
    ↓
Native Expression Analysis
    ↓
Lesson Validation
    ↓
Lesson Export
```

Each stage consumes the output of the previous stage (plus, where noted, earlier artifacts still needed for context) and produces a well-defined output for the next stage. Stages run in this order; a later stage must not run before an earlier stage has produced valid output.

For very large transcripts, the stages after Sentence Segmentation may need to run multiple times, once per chunk, rather than once over the whole transcript. This does not change the pipeline itself or its ordering — it changes how many times, and over what scope, the later stages run. See [Section 4, Large Transcript Generation Strategy](#4-large-transcript-generation-strategy) for exactly how and where this applies, and [Section 5, Detailed Stage Definitions](#5-detailed-stage-definitions) for what each stage does.

## 4. Large Transcript Generation Strategy

### 4.1 Why chunking exists

Very large transcripts (e.g. long chapter books, multi-part narrations) can exceed the model's context or output token limits, making it impossible to process every sentence in a single generation pass. To handle these transcripts reliably, the generation process may divide the work into multiple chunks.

**Chunking is an internal generation strategy only.** It exists to help the AI produce a complete lesson despite model limits. It is never part of the final deliverable, is never surfaced to English Studio, and must never be presented to the user as a finished result — see [Section 4.7, Final Merge Requirement](#47-final-merge-requirement).

### 4.2 When chunking applies

- Chunking is optional and is only used when a transcript is large enough that single-pass generation is not reliable.
- Short and medium transcripts continue to be generated in a single pass, exactly as described in [Section 3, Generation Pipeline](#3-generation-pipeline). Everything in this section applies equally to that case — a single-pass lesson is simply the special case of one chunk covering the whole transcript.

### 4.3 Where chunking occurs in the pipeline

Chunking, when needed, is inserted after [Stage 5.3, Sentence Segmentation](#53-sentence-segmentation) and before [Stage 5.4, Metadata Detection](#54-metadata-detection):

```
Raw Transcript
    ↓
Transcript Normalization
    ↓
Sentence Segmentation
    ↓
[ Chunk division, if needed ]
    ↓
Metadata Detection
    ↓
Chinese Translation        ⎫
    ↓                      ⎬  runs per chunk
Vocabulary Analysis        │
    ↓                      │
Phrase Analysis            │
    ↓                      │
Grammar Analysis           │
    ↓                      │
Native Expression Analysis ⎭
    ↓
Chunk Merge
    ↓
Lesson Validation
    ↓
Lesson Export
```

Metadata Detection runs once, against the complete transcript and the full segmented sentence list — never per chunk — since it characterizes the transcript as a whole (title, source, etc.), not any one part of it.

### 4.4 Chunk boundary rules

- The already-segmented sentence list (the output of [Stage 5.3, Sentence Segmentation](#53-sentence-segmentation)) is divided into contiguous, ordered groups of sentences.
- A chunk boundary must fall between two sentences. **A chunk boundary must never split a sentence.**
- Chunks are contiguous and non-overlapping: every sentence belongs to exactly one chunk.
- Chunks preserve the original sentence order; concatenating all chunks' sentences in order reproduces the full segmented sentence list exactly.
- Chunk size is an implementation detail chosen to stay comfortably within model limits; this specification does not mandate a fixed chunk size or count.

### 4.5 Per-chunk processing

For each chunk, the following stages run exactly as defined in [Section 5, Detailed Stage Definitions](#5-detailed-stage-definitions), scoped to that chunk's sentences only:

- [Chinese Translation](#55-chinese-translation)
- [Vocabulary Analysis](#56-vocabulary-analysis)
- [Phrase Analysis](#57-phrase-analysis)
- [Grammar Analysis](#58-grammar-analysis)
- [Native Expression Analysis](#59-native-expression-analysis)

Each chunk is processed independently, but must apply the same rules, quality bar, and consistency standards ([Section 6, Quality Principles](#6-quality-principles)) as single-pass generation. A sentence's treatment must not depend on which chunk it happened to land in, and sentence order within and across chunks must always remain identical to the original transcript.

### 4.6 Chunk Merge

**Purpose:** Combine every completed chunk's output back into one ordered sentence list before validation and export.

**Rules:**

- Every chunk must have completed all five per-chunk stages listed in [Section 4.5](#45-per-chunk-processing) before it is merged.
- Chunks are concatenated in their original order — the same order established during [Sentence Segmentation](#53-sentence-segmentation) and preserved by the [chunk boundary rules](#44-chunk-boundary-rules).
- The merged sentence list must contain every sentence from the segmented transcript exactly once — no duplicates, no omissions.
- Merging is purely structural (reassembling chunk outputs into one list); it must not alter sentence content, translations, or notes produced during per-chunk processing.

Merging is not optional and is not deferred to English Studio or the user — it is a generation-side responsibility that must complete before [Lesson Validation](#510-lesson-validation).

### 4.7 Final Merge Requirement

Regardless of how many chunks were generated, **the AI must merge every completed chunk into one final Lesson JSON before presenting the result.** This is the single most important rule in this section: chunking is permitted as an internal strategy, but a chunked lesson is not "done" until it has been merged into one file.

The final output must satisfy all of the following:

- Exactly one `.eslesson.json` file.
- Contains every sentence from the source transcript.
- Preserves sentence order, matching the order established in [Sentence Segmentation](#53-sentence-segmentation).
- Contains no duplicated sentences.
- Contains no omitted sentences.
- Is valid Lesson JSON, per [Lesson Format v1](./lesson-format-v1.md).
- Is directly importable into English Studio without manual editing.

**The following must never be presented as the final deliverable, under any circumstances:**

- Partial JSON files.
- Chunk JSON files (a JSON file representing only one chunk's sentences).
- Intermediate outputs of any kind.
- Partially completed lessons (a lesson missing sentences, notes, or metadata because generation was cut short).

If the AI cannot complete and merge every chunk, it must not export a lesson at all — see [Section 8, Failure Recovery Rules](#8-failure-recovery-rules).

## 5. Detailed Stage Definitions

### 5.1 Raw Transcript

**Purpose:** The starting artifact — unprocessed English text supplied by the user, typically pasted from a transcript source (e.g. a Storyline Online `.txt` file, video captions, or a book excerpt).

**Inputs:** A raw text blob provided directly by the user. May contain hard line-wraps, inconsistent whitespace, blank lines, and non-content artifacts (page numbers, timestamps, speaker labels) depending on the source.

**Outputs:** The unmodified raw transcript text, carried forward as the basis for all later stages.

**Rules:**
- ChatGPT must not fabricate or supplement transcript content; it may only work with the text actually supplied.
- If the supplied text is empty, or is clearly not English narrative text, generation must not proceed to later stages.

**Validation:**
- The transcript is non-empty.
- The transcript is predominantly English text.

### 5.2 Transcript Normalization

**Purpose:** Convert the raw transcript into clean, continuous prose so that sentence boundaries can be reliably detected later.

**Inputs:** Raw transcript text (5.1).

**Outputs:** A normalized transcript: hard line-wraps within a paragraph joined into continuous text; genuine paragraph breaks preserved; extraneous whitespace collapsed; non-content artifacts removed.

**Rules:**
- A single line break within a paragraph is a soft wrap, not a sentence or paragraph boundary, and must be joined into continuous text.
- A blank line is a real paragraph boundary and must be preserved.
- Non-narrative artifacts unrelated to the story content (e.g. `"[Page 3]"`, timestamps, credits boilerplate) should be removed.
- Normalization must not alter the wording, meaning, or spelling of the original English text.

**Validation:**
- The normalized text contains no orphaned mid-sentence line breaks.
- The normalized text preserves the original wording in full (only whitespace and non-content artifacts may be removed).

### 5.3 Sentence Segmentation

**Purpose:** Split the normalized transcript into individual, complete sentences — the values that become each `englishOriginal` field.

**Inputs:** Normalized transcript text (5.2).

**Outputs:** An ordered list of sentence strings, preserving original wording and punctuation. For very large transcripts, this ordered list is the artifact that [Section 4, Large Transcript Generation Strategy](#4-large-transcript-generation-strategy) subsequently divides into chunks.

**Rules:**
- Segmentation follows real sentence boundaries (terminal punctuation: `.`, `!`, `?`), never line breaks.
- Common abbreviations (e.g. "Mr.", "Dr.", "etc.") must not be treated as sentence boundaries.
- Dialogue and quotations stay attached to the sentence they belong to (e.g. `"What could this be?" she wondered.` is one sentence, not two).
- Each output sentence must be a complete, grammatical unit; fragments must not be produced.
- Sentence order is preserved and maps directly to the `order` field in [Lesson Format v1, Section 4](./lesson-format-v1.md#4-sentence-schema).

**Validation:**
- Every sentence ends with terminal punctuation, except possibly the final sentence of the transcript.
- No sentence is empty or contains only whitespace/punctuation.
- Concatenating all sentences reproduces the normalized transcript's wording (allowing for whitespace differences).

### 5.4 Metadata Detection

**Purpose:** Infer the lesson-level metadata fields defined in [Lesson Format v1, Section 3](./lesson-format-v1.md#3-top-level-json-schema).

**Inputs:** Normalized transcript text (5.2); segmented sentence list (5.3); any contextual information the user supplied alongside the transcript (e.g. a source name or URL).

**Outputs:** Values for `title` and `source`, and, when determinable, `sourceUrl`, `author`, `narrator`, `tags`, `description`.

**Rules:**
- `title` is inferred from the transcript content (e.g. a title line at the top) or reasonably summarized from the story if no explicit title is present.
- `source` reflects what the user told ChatGPT about the transcript's origin; if unknown, use a neutral placeholder such as `"Imported"`.
- Optional fields (`sourceUrl`, `author`, `narrator`, `tags`, `description`) are populated only when real information supports them.
- ChatGPT must never fabricate an author, narrator, or source URL that was not provided or clearly present in the transcript.

**Validation:**
- `title` and `source` are present and non-empty.
- No optional field contains a fabricated value.

### 5.5 Chinese Translation

**Purpose:** Produce the `chineseTranslation` field for every sentence.

**Inputs:** Segmented sentence list (5.3), or the current chunk's sentences when generation is chunked (see [Section 4](#4-large-transcript-generation-strategy)).

**Outputs:** A Traditional Chinese translation for each English sentence, in the same order.

**Rules:**
- Translation is Traditional Chinese, not Simplified.
- Translation is natural and fluent, not a rigid word-for-word rendering.
- Translation preserves the meaning, tone, and register of the original sentence (a children's story should read like natural Chinese children's-story prose).
- Every sentence receives a translation; none are skipped.

**Validation:**
- Every sentence has a non-empty `chineseTranslation`.
- Translations use Traditional Chinese characters throughout.
- The number and order of translations matches the number and order of English sentences.

### 5.6 Vocabulary Analysis

**Purpose:** Identify individual words within each sentence worth explaining to a learner, producing `vocabularyNotes`.

**Inputs:** Each English sentence (5.3); its Chinese translation (5.5), for context.

**Outputs:** Zero or more `LearningNote` objects per sentence, assigned to `vocabularyNotes`.

**Rules:**
- Only genuinely useful vocabulary is noted — common, basic words a learner already knows do not generate a note.
- `title` is the English word (or its base form).
- `explanation` is written in Traditional Chinese.
- `examples` are English sentences demonstrating the word in a different context than the source sentence, and each English example must have a corresponding Traditional Chinese translation in the same `LearningExample`, forming a one-to-one English/Chinese pairing.
- Each example's Chinese translation must be natural Traditional Chinese, not a literal, mechanical rendering of the English.
- A sentence with no noteworthy vocabulary produces an empty `vocabularyNotes` array — this is expected and correct (see [Section 6, Avoid filler content](#avoid-filler-content)).

**Validation:**
- Every note has a non-empty `title` and `explanation`.
- Every example has both a non-empty `english` sentence and a non-empty, natural Traditional Chinese `chinese` translation.
- No note exists solely to fill the array.

### 5.7 Phrase Analysis

**Purpose:** Identify multi-word phrases, collocations, or fixed expressions within each sentence, producing `phraseNotes`.

**Inputs:** Each English sentence (5.3); its Chinese translation (5.5).

**Outputs:** Zero or more `LearningNote` objects per sentence, assigned to `phraseNotes`.

**Rules:**
- A phrase note covers a group of words that function or are learned together (e.g. "once upon a time", "in front of", "make sure").
- `title` is the phrase itself, in English.
- `explanation` is in Traditional Chinese, describing meaning and usage.
- `examples` are English sentences showing the phrase reused in a different sentence, and each English example must have a corresponding Traditional Chinese translation in the same `LearningExample`, forming a one-to-one English/Chinese pairing.
- Each example's Chinese translation must be natural Traditional Chinese, not a literal, mechanical rendering of the English.
- A phrase note must not duplicate a point already fully covered by a vocabulary note for the same sentence.

**Validation:**
- Every note has a non-empty `title` and `explanation`.
- Every example has both a non-empty `english` sentence and a non-empty, natural Traditional Chinese `chinese` translation.
- `title` genuinely consists of more than one word.

### 5.8 Grammar Analysis

**Purpose:** Identify grammar structures or patterns within each sentence worth explaining, producing `grammarNotes`.

**Inputs:** Each English sentence (5.3); its Chinese translation (5.5).

**Outputs:** Zero or more `LearningNote` objects per sentence, assigned to `grammarNotes`.

**Rules:**
- A grammar note explains a structural pattern (e.g. verb tense, conditional form, relative clause) — not a vocabulary or phrase meaning.
- `title` names the pattern in English (e.g. "would + verb (habitual past)").
- `explanation` is in Traditional Chinese, describing how and why the pattern is used.
- `examples` are English sentences using the same pattern in a different context, and each English example must have a corresponding Traditional Chinese translation in the same `LearningExample`, forming a one-to-one English/Chinese pairing.
- Each example's Chinese translation must be natural Traditional Chinese, not a literal, mechanical rendering of the English.
- Only sentences with a grammar point genuinely worth teaching receive a note; simple sentences with no notable structure produce an empty array.

**Validation:**
- Every note has a non-empty `title` and `explanation`.
- Every example has both a non-empty `english` sentence and a non-empty, natural Traditional Chinese `chinese` translation.
- `explanation` describes a structural/grammatical pattern, not a single word's meaning.

### 5.9 Native Expression Analysis

**Purpose:** Identify idiomatic or particularly natural-sounding phrasing within each sentence — the kind of expression that sounds native but that a learner might translate awkwardly — producing `nativeExpressionNotes`.

**Inputs:** Each English sentence (5.3); its Chinese translation (5.5).

**Outputs:** Zero or more `LearningNote` objects per sentence, assigned to `nativeExpressionNotes`.

**Rules:**
- A native expression note highlights phrasing where a direct, literal translation would sound unnatural, and explains the idiomatic native alternative.
- `title` is the natural English expression.
- `explanation` is in Traditional Chinese, contrasting the natural phrasing with a more literal/awkward alternative when helpful.
- `examples` are English sentences, and each English example must have a corresponding Traditional Chinese translation in the same `LearningExample`, forming a one-to-one English/Chinese pairing.
- Each example's Chinese translation must be natural Traditional Chinese, not a literal, mechanical rendering of the English.
- This category is used sparingly — reserved for expressions that meaningfully teach natural usage, not applied to every sentence.

**Validation:**
- Every note has a non-empty `title` and `explanation`.
- Every example has both a non-empty `english` sentence and a non-empty, natural Traditional Chinese `chinese` translation.
- Notes in this category are not duplicates of notes already captured under `phraseNotes` or `grammarNotes` for the same sentence.

### 5.10 Lesson Validation

**Purpose:** Verify that the fully assembled lesson satisfies the Lesson Format v1 schema and this specification's rules before export.

**Inputs:** The complete, assembled lesson (metadata from 5.4, sentences from 5.3/5.5, and all notes from 5.6–5.9). When generation used the [Large Transcript Generation Strategy](#4-large-transcript-generation-strategy), this is the single sentence list produced by [Chunk Merge](#46-chunk-merge) — validation always runs against one complete, merged lesson, never against individual chunks.

**Outputs:** A pass/fail validation result. On failure, the lesson must not be exported, and the responsible stage(s) must be revisited.

**Rules:**
- All required top-level fields are present and correctly typed, per [Lesson Format v1, Section 3](./lesson-format-v1.md#3-top-level-json-schema).
- Every sentence satisfies the sentence schema, per [Lesson Format v1, Section 4](./lesson-format-v1.md#4-sentence-schema).
- Every `LearningNote` satisfies the note schema and quality rules, per [Lesson Format v1, Section 5](./lesson-format-v1.md#5-learningnote-schema).
- The complete rule set in [Section 7, Validation Rules](#7-validation-rules) of this document is applied, including [Complete Lesson Verification](#complete-lesson-verification).

**Validation:**
- See [Section 7, Validation Rules](#7-validation-rules) for the full checklist.

### 5.11 Lesson Export

**Purpose:** Emit the final, validated lesson as a single Lesson JSON object, ready for import into English Studio.

**Inputs:** The validated lesson (5.10).

**Outputs:** A JSON object conforming exactly to [Lesson Format v1](./lesson-format-v1.md), containing none of the English-Studio-internal fields listed in [Lesson Format v1, Section 6](./lesson-format-v1.md#6-english-studio-internal-fields).

**Rules:**
- Output is syntactically valid JSON — no trailing commas, comments, or non-JSON annotations.
- Output contains only fields defined in Lesson Format v1; no extra, undocumented fields are added.
- `schemaVersion` is set to `"1.0"`.
- `createdAt` reflects the actual generation time as an ISO 8601 datetime string.
- Every `LearningNote.examples` entry is emitted as a `{ "english": ..., "chinese": ... }` object, per [Lesson Format v1, Section 5](./lesson-format-v1.md#5-learningnote-schema) — never as a bare string.
- Exactly one `.eslesson.json` file is produced. Per the [Final Merge Requirement](#47-final-merge-requirement), chunk files, partial outputs, and intermediate artifacts are never exported, presented, or left as the final result — whether or not chunked generation was used internally.

**Validation:**
- Output parses as valid JSON with no errors.
- Output matches the Lesson Format v1 schema exactly: no missing required fields, no disallowed fields.
- Every example object in every note has both `english` and `chinese` fields.

## 6. Quality Principles

#### Accuracy

The generated lesson must faithfully represent the source transcript. Sentence wording, translation meaning, and note content must all be accurate to the original English text — generation is not an opportunity to paraphrase, embellish, or correct the source story.

#### Educational value

Every piece of generated content should help a learner. A note is worth including only if it teaches something a learner plausibly doesn't already know or would benefit from seeing explained explicitly.

#### Natural Traditional Chinese

All Chinese content (`chineseTranslation`, and every note's `explanation`) must read as natural, fluent Traditional Chinese — the way a native speaker would actually write it — not a mechanical, literal transformation of the English sentence structure.

#### Natural English

Where English is generated beyond the source transcript itself (`aiEnglishSuggestion`, note `title`s, note `examples`), it must be natural, idiomatic English that a native speaker would actually write or say — not stilted or overly formal phrasing chosen just to sound "correct."

#### Consistency

Terminology, tone, and formatting should be consistent across the whole lesson. The same word appearing in multiple sentences should be explained consistently (or not re-explained if already covered); note title casing and phrasing style should be consistent within and across the four note categories. This applies across chunk boundaries exactly as it does within a single sentence range — see [Section 4.5, Per-chunk processing](#45-per-chunk-processing).

#### Avoid filler content

Notes exist to teach, not to make a sentence "look complete." An empty note array is a correct, expected outcome for a simple sentence with nothing worth teaching. Generating a note just because a section is empty — or restating something already obvious from the translation — actively harms lesson quality and must be avoided.

## 7. Validation Rules

A generated lesson must satisfy all of the following before it may be exported:

- **Every sentence must have English.** Each `LessonSentence.englishOriginal` is present and non-empty.
- **Every sentence must have Chinese.** Each `LessonSentence.chineseTranslation` is present and non-empty.
- **Every `LearningNote` must contain meaningful content.** `title` and `explanation` are both non-empty and substantive — not placeholder text, not a restatement of the sentence itself, and not generated merely to fill a section.
- **Every example must be a bilingual pair.** Each item in a note's `examples` array is a `LearningExample` object with both a non-empty `english` sentence and its corresponding non-empty, natural Traditional Chinese `chinese` translation — never a bare string.
- **Reject incomplete lessons.** A lesson missing required top-level fields (per [Lesson Format v1, Section 3](./lesson-format-v1.md#3-top-level-json-schema)), missing a `sentences` array, or whose sentences don't collectively account for the full source transcript, must not be exported.
- **Reject malformed Lesson JSON.** A lesson that fails to parse as valid JSON, or that does not conform to the Lesson Format v1 schema (wrong types, wrong `schemaVersion`, disallowed fields, etc.), must not be exported.
- **Validate JSON syntax before saving into `lessons/`.** See [Required JSON Validation Step](#required-json-validation-step) — this is a separate, mandatory check from schema validation above.
- **Validate again before `git commit`/`push`.** A file that was valid when first saved can still be hand-edited afterward; re-check syntax immediately before committing.

### Complete Lesson Verification

For every lesson — and especially one generated using the [Large Transcript Generation Strategy](#4-large-transcript-generation-strategy) — before [Lesson Export](#511-lesson-export) the AI must verify:

- Every chunk has completed all per-chunk processing ([Section 4.5](#45-per-chunk-processing)).
- Every chunk has been merged into the final sentence list ([Chunk Merge, Section 4.6](#46-chunk-merge)).
- Every sentence from the transcript appears exactly once in the merged lesson — no duplicates, no omissions.
- The merged sentence count matches the sentence count produced by [Sentence Segmentation](#53-sentence-segmentation).
- The final output consists of one Lesson JSON file only, per the [Final Merge Requirement](#47-final-merge-requirement).

**If any of these checks fails, Lesson Export MUST NOT occur.** This check applies even when no chunking was used — a single-pass lesson trivially satisfies it (one chunk covering the whole transcript), so the same verification is a no-op for small transcripts and a hard gate for large ones.

Failing any of these checks — including Complete Lesson Verification — means the lesson generation process stops at [Stage 5.10, Lesson Validation](#510-lesson-validation); it does not proceed to [Lesson Export](#511-lesson-export).

## 8. Failure Recovery Rules

Generation of a large, chunked transcript can be interrupted before every chunk is complete — for example because of token limits, context limits, model interruption, or output truncation. This section defines what must happen when that occurs.

**When generation is interrupted:**

- The AI must not export a partial lesson. An interrupted generation run never produces a `.eslesson.json` file, complete or not.
- The AI must report which chunk (or chunks) remain unfinished, so generation can pick up in the right place.
- Generation resumes by completing the unfinished chunk(s) — following the same per-chunk processing defined in [Section 4.5](#45-per-chunk-processing) — not by restarting the whole transcript from the beginning.
- [Lesson Export](#511-lesson-export) may only occur after every chunk has been completed and merged into one complete Lesson JSON, per the [Final Merge Requirement](#47-final-merge-requirement) and [Complete Lesson Verification](#complete-lesson-verification).

**This applies regardless of cause.** Whether the interruption comes from the model's context window, an output length limit, an unexpected stop, or any other source, the recovery behavior is the same: no partial export, report the gap, resume the unfinished work, then merge and validate before export.

## 9. Future Extensions

The following capabilities are **not** part of this generation specification's v1, but are anticipated for future versions:

- **CEFR** — estimating a CEFR level (e.g. `"A2"`, `"B1"`) for the lesson or individual sentences.
- **Difficulty** — a simpler difficulty rating (e.g. beginner/intermediate/advanced) as an alternative or complement to CEFR.
- **Pronunciation** — generating pronunciation guidance (e.g. phonetic transcription, stress patterns) for vocabulary and phrase notes.
- **Shadowing** — generating shadowing-practice guidance, timing, or segmented audio cues for read-aloud practice.
- **Writing Practice** — generating writing prompts or exercises derived from the lesson's vocabulary and grammar points.
- **Speaking Practice** — generating speaking prompts or conversational exercises based on lesson content.
- **Review Scheduling** — generating metadata to support scheduling when a lesson or its notes should next be reviewed.
- **Spaced Repetition** — generating spaced-repetition scheduling data for individual notes or sentences.
- **AI Review** — generating feedback on a learner's practice attempts, for a future version where English Studio calls an AI API directly.
- **Learning Statistics** — generating baseline metrics or tags that support future learning-analytics features.

Any of these would extend both this generation specification and [Lesson Format v1](./lesson-format-v1.md), and would require a coordinated `schemaVersion` bump across both documents.

## Required JSON Validation Step

**AI output is not trusted until it has been validated.** [Stage 5.10, Lesson Validation](#510-lesson-validation) and [Section 7, Validation Rules](#7-validation-rules) check that the lesson's *content* is complete and conforms to the schema — but that is not the same thing as checking that the file is syntactically valid JSON, and both checks are required.

- Even when the content looks correct — the sentences read fine, the translations look right, the notes look reasonable — the file may still contain invalid JSON syntax, such as a missing comma between two fields. A human or AI reviewing the *rendered* content will not catch this; only a JSON parser will.
- Before placing a lesson file under `lessons/`, run a JSON validation step (e.g. `python -m json.tool some-file.eslesson.json`, `jq . some-file.eslesson.json`, or your editor's built-in JSON validation) and confirm it reports no errors.
- If validation fails, fix the JSON syntax first. Do not copy the file into `lessons/` or commit it while it fails to parse.
- If an invalid `.eslesson.json` file is committed under `lessons/` anyway, the app may fail to start, or Vite may throw a JSON parsing error — because [Browse Lessons](./progress-sync-v1.md#lesson-storage-model) loads every file under `lessons/` via `import.meta.glob` at build/dev time, a single malformed file can break the whole app, not just that one lesson.

### Example from today

A missing comma between `chineseTranslation` and `aiEnglishSuggestion` caused:

```
expected `,` or `}`
```

Incorrect (missing comma after `chineseTranslation`):

```json
{
  "chineseTranslation": "才發現他一直都在扮演一個更帥氣的角色。"
  "aiEnglishSuggestion": "only to realize he'd been playing a cooler character the whole time."
}
```

Corrected:

```json
{
  "chineseTranslation": "才發現他一直都在扮演一個更帥氣的角色。",
  "aiEnglishSuggestion": "only to realize he'd been playing a cooler character the whole time."
}
```

## Lesson File Naming Convention

All lesson files must follow the naming convention below.

### File Extension

.eslesson.json

### File Name

Use the original English lesson title.

Examples:

Being Frank.eslesson.json
Catching the Moon.eslesson.json
Brave Irene.eslesson.json

### Rules

- Preserve spaces in filenames.
- Do not replace spaces with `%20`.
- Do not replace spaces with hyphens (`-`) unless the original title contains a hyphen.
- Do not use underscores.
- Use UTF-8 encoding.
- One lesson per JSON file. This holds regardless of transcript size or how many internal chunks were used to generate it — see [Final Merge Requirement](#47-final-merge-requirement).

### Folder Organization

lessons/
    Storyline Online/
    VOA/
    BBC/
    YouTube/
    Personal/

Each lesson should be stored in the folder that matches its source.

These files are part of the Git repository, not browser storage — see [Lesson Storage Model](./progress-sync-v1.md#lesson-storage-model) for exactly what is version-controlled (lesson files) versus what lives only in the browser's `localStorage` (imported libraries, practice progress, user translations/notes).

## Immutable Lesson Rule

Once a lesson has been committed to the repository:

- The filename should remain stable.
- Do not rename files unless correcting an obvious mistake.
- User progress must never be stored inside lesson files.
- Lesson files represent immutable course content.

## Final Output Requirement

The AI must internally validate that the generated file is valid JSON and conforms to the English Studio lesson schema before presenting it.

The output must be directly usable without manual editing.

This requirement holds no matter how the lesson was generated internally. Even when a large transcript required chunked generation, the AI must complete [Chunk Merge](#46-chunk-merge) and [Complete Lesson Verification](#complete-lesson-verification) first — the only thing ever presented to the user is one finished, valid, directly importable `.eslesson.json` file, never a chunk or partial result (see [Section 4.7, Final Merge Requirement](#47-final-merge-requirement)).
