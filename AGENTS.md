# Agents

## Repository naming and verification

- Name Astro components and layouts with `PascalCase.astro`, matching the established files under `src/components/` and `src/layouts/`.
- Use concise English lowercase ASCII kebab-case for new URL segments, content slugs, general-purpose directories, and asset basenames. Avoid ad hoc romanization of Japanese titles.
- Store posts at `src/content/posts/<slug>/index.md`.
- Treat existing routes and published post slugs as public contracts. Do not rename them without checking consumers and providing an appropriate redirect or migration.
- Match Astro-required route filenames and dynamic-segment syntax exactly.
- After source or path changes, run `npm run check` and `npm run build`.
