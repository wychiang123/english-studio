# English Studio Specification Priority

## 1. Purpose

This document defines the **decision priority** used by all English Studio specifications whenever two or more requirements compete.

Competing requirements arise for several reasons: model limitations (e.g. context or token limits), implementation choices (e.g. how a large transcript is generated internally), and future extensions (e.g. a new specification introducing goals that pull in different directions from an existing one). In all of these cases, the higher-priority requirement always takes precedence over the lower-priority one.

This document applies to all current and future AI generation specifications in this project — not only lesson generation. Any specification that produces AI-generated content for English Studio is expected to resolve internal conflicts using the order defined here, rather than defining its own, potentially inconsistent, priority order.

## 2. Priority Order

When requirements conflict, they are resolved in the following order, highest priority first:

1. Correctness
2. Completeness
3. JSON Validity
4. Educational Quality
5. Performance

A requirement earlier in this list always outranks a requirement later in this list. See [Section 4, Decision Rules](#4-decision-rules) for how this order is applied in practice.

## 3. Principle Definitions

### Correctness

- Never fabricate information.
- Never alter the meaning of the source transcript.
- Never invent missing content.
- Preserve factual accuracy.

### Completeness

- Every sentence from the source transcript must appear exactly once.
- Partial lessons are never acceptable.
- If generation cannot finish, do not export an incomplete lesson.

### JSON Validity

- Every exported lesson must conform to the official Lesson JSON schema.
- JSON syntax must be valid.
- The file must be directly importable without manual editing.

### Educational Quality

- Generate natural Traditional Chinese.
- Produce useful learning notes.
- Avoid filler content.
- Maintain consistency throughout the lesson.

### Performance

- Performance is important but always has the lowest priority.
- It is acceptable to spend more processing time if it improves correctness and completeness.
- Internal strategies such as chunked generation are encouraged when necessary.

## 4. Decision Rules

Whenever trade-offs are required, higher-priority requirements always override lower-priority requirements.

**Example**

Incorrect:

> Export an incomplete lesson because the model reached its token limit.

Correct:

> Continue generation using chunked processing until a complete lesson can be exported.

*(Completeness outranks Performance.)*

**Example**

Incorrect:

> Remove difficult vocabulary notes simply to reduce generation time.

Correct:

> Keep educational quality unless doing so would violate a higher-priority rule.

*(Educational Quality outranks Performance.)*

**Example**

Incorrect:

> Export a lesson with slightly reworded sentences because the reworded version reads more naturally.

Correct:

> Preserve the source transcript's original wording exactly, even if a paraphrase would read more smoothly.

*(Correctness outranks Educational Quality.)*

**Example**

Incorrect:

> Export a lesson that is complete and educationally rich, but contains a JSON syntax error, because fixing it would take another generation pass.

Correct:

> Fix the JSON syntax error before export, even though the content itself was already correct and complete.

*(JSON Validity outranks Educational Quality, and is only outranked by Correctness and Completeness.)*

## 5. Scope

This document is intentionally independent from:

- [Lesson Format v1](./lesson-format-v1.md)
- [Lesson Generation Specification v1](./lesson-generation-specification-v1.md)
- [Lesson Quality Standard v1](./lesson-quality-standard-v1.md)

Those documents define specific requirements — what the JSON structure must look like, what process produces it, and what makes generated content educationally good. This document does not redefine or duplicate any of those requirements. It defines only how conflicts *between* requirements (including requirements drawn from those documents) should be resolved when they cannot all be satisfied at once.

## 6. Future Expansion

All future AI-related specifications should **reference** this document instead of redefining the priority order.

Examples of specifications this applies to, whether existing or anticipated:

- Lesson Generation Specification (current and future versions)
- Vocabulary Generator
- Conversation Generator
- Grammar Lesson Generator
- Speaking Lesson Generator
- AI Review

A new specification should state that it follows the priority order defined here, and should only introduce new principles within a priority level (e.g. a new Educational Quality rule specific to that specification) — not a new priority level, and not a reordering of the existing five.
