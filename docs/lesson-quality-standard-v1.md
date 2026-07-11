# English Studio Lesson Quality Standard v1

## 1. Purpose

This document defines the **quality standard** for every Lesson generated for English Studio: what makes a lesson educationally valuable and consistent.

It does not define JSON structure — see [Lesson Format v1](./lesson-format-v1.md).

It does not define the generation pipeline — see [Lesson Generation Specification v1](./lesson-generation-specification-v1.md).

It defines what "good" means for the content those documents structure and produce.

This standard follows the project-wide Specification Priority defined in [`docs/specification-priority.md`](./specification-priority.md), which ranks Educational Quality below Correctness, Completeness, and JSON Validity when those requirements compete during generation.

## 2. Core Principles

Every generated lesson should be:

- **Accurate** — faithful to the source transcript's wording and meaning.
- **Natural** — reads as language a native speaker would actually write or say, in both English and Chinese.
- **Educational** — every item teaches something a learner plausibly doesn't already know.
- **Consistent** — terminology, tone, and style stay uniform across the whole lesson.
- **Concise** — no more content than a learner can absorb without being overwhelmed.
- **High-value** — every item earns its place.

Never generate filler content.

Every generated learning item should justify its existence.

## 3. Chinese Translation Standard

**Goals:**

- Traditional Chinese only.
- Preserve tone.
- Preserve emotion.
- Preserve humor.
- Preserve dialogue.
- Preserve storytelling rhythm.

**Avoid:**

- Literal translation.
- Mechanical wording.
- AI-sounding Chinese.

**Examples:**

GOOD

"I couldn't agree more."

→ 我完全同意。

BAD

→ 我不能同意更多。

## 4. Example Sentence Standard

Every example inside a learning note is a bilingual pair, not a bare English string.

Each example must contain:

- One natural English example sentence.
- One accurate, natural Traditional Chinese translation of that exact sentence.

**Goals for the Chinese translation:**

- Preserve the English example's meaning and context exactly.
- Read as natural, fluent Traditional Chinese — not a mechanical, word-for-word rendering.
- Introduce no additional teaching information beyond what the English example says.

This standard applies uniformly to Vocabulary, Phrase, Grammar, and Native Expression examples below.

## 5. Vocabulary Standard

Vocabulary should only include words that are worth learning.

**Selection priority:**

1. High-frequency English.
2. Useful spoken English.
3. Story-specific vocabulary.
4. Words commonly misunderstood.

**Avoid:**

- Articles
- Prepositions
- Auxiliary verbs

...unless they have genuine learning value.

**Recommended amount:** 0–3 vocabulary notes per sentence.

Each vocabulary note should contain:

- English word
- Part of speech
- Traditional Chinese explanation
- One example, per the [Example Sentence Standard](#4-example-sentence-standard)

## 6. Phrase Standard

Only include genuine phrases.

**Examples:**

- take off
- go by
- after all
- be a dear
- look forward to

Do not include ordinary word combinations.

**Recommended amount:** 0–2 phrases per sentence.

## 7. Grammar Standard

Grammar explanations should help comprehension.

Explain only when educational value exists. Do not explain every tense.

**Recommended topics:**

- Passive Voice
- Relative Clause
- Present Perfect
- Past Perfect
- Conditional
- Gerund
- Infinitive
- Reported Speech

**Recommended amount:** 0–1 grammar point per sentence.

## 8. Native Expression Standard

Capture expressions that native speakers naturally use.

**Examples:**

- You bet.
- No worries.
- Take it easy.
- After all.
- Good for you.

**Include:**

- Idioms
- Conversational English
- Cultural references

Do not duplicate Vocabulary or Phrase notes.

## 9. Learning Density

Avoid overwhelming learners.

**Recommended maximum, per sentence:**

| Category | Max |
|---|---|
| Vocabulary | 3 |
| Phrase | 2 |
| Grammar | 1 |
| Native Expression | 2 |

## 10. Educational Value Rules

**Prefer:** Frequently reusable knowledge.

**Avoid:** Knowledge useful only in this single story.

## 11. Consistency Rules

All lessons should:

- Use Traditional Chinese.
- Use consistent terminology.
- Use consistent grammar terminology.
- Use consistent explanation style.
- Maintain the same teaching philosophy.

## 12. Lesson Review Checklist

Before exporting Lesson JSON verify:

- ✓ English sentence complete
- ✓ Chinese translation complete
- ✓ Vocabulary meaningful
- ✓ Phrase meaningful
- ✓ Grammar necessary
- ✓ Native Expression valuable
- ✓ Every example is a natural English/Traditional Chinese pair
- ✓ No duplicated notes
- ✓ No filler content
- ✓ Educational value maintained

## 13. Future Quality Metrics

Future versions may evaluate:

- Vocabulary richness
- Grammar coverage
- Speaking usefulness
- Conversation usefulness
- Reading difficulty
- CEFR estimation
- Lesson completeness

---

**Important**

This is a Quality Standard.

Do not describe implementation.

Do not describe JSON.

Do not describe application behavior.

Only define lesson quality.
