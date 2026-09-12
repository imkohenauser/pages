# Guidance for AI Agents Working in This Repo

## Scope

- Change only what the user asked for. Do not add unsolicited styles, states, refactors, or related cleanup.
- Keep generated QA reports, screenshots, logs, and local machine paths out of the repository; write working files only to ignored `temp/` unless the user explicitly asks to keep them.

## Repository naming and verification

- Name Astro components and layouts with `PascalCase.astro`, matching the established files under `src/components/` and `src/layouts/`.
- Use concise English lowercase ASCII kebab-case for new URL segments, content slugs, general-purpose directories, and asset basenames. Avoid ad hoc romanization of Japanese titles.
- Store writing at `src/content/writing/<slug>/index.md`.
- Store projects at `src/content/projects/<slug>/index.md`.
- Public article URLs are `/{slug}/` (plus `base` in production). Keep redirects from `/posts/{slug}/`.
- Do not use reserved writing or project slugs: `writing`, `posts`, `projects`.
- Treat existing routes and published writing slugs as public contracts. Do not rename them without checking consumers and providing an appropriate redirect or migration.
- Match Astro-required route filenames and dynamic-segment syntax exactly.
- After source or path changes, run `npm run check` and `npm run build`.

## Conditional frontend guidance

Read only the relevant sections of [`.agents/guides/frontend-conventions.md`](.agents/guides/frontend-conventions.md):

- For style changes, read **SCSS conventions** and **UI implementation constraints**.
- For interaction or state-management changes, read **TypeScript conventions** and **UI implementation constraints**.
- When changing a shared motion duration in CSS or TypeScript, also read **SCSS conventions** for the synchronization rule.
- When adding or editing comments, read **Comments**.

## Repository skills

Read the selected `.agents/skills/*/SKILL.md` before using a skill. Apply review skills only when review is the task; do not invoke them for ordinary implementation or use them to make fixes unless the user separately asks.

- Use `commit-ja` only when the user explicitly invokes `$commit-ja` or `/commit-ja`. It proposes Japanese Conventional Commit text from staged changes without changing files, the index, or Git history.
