# Guidance for AI Agents Working in This Repo

## Scope

- Change only what the user asked for. Do not add unsolicited styles, states, refactors, or related cleanup.

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

## SCSS and TypeScript conventions

- Use SCSS. Keep tokens, reset, base rules, and shared utilities in partials under `src/styles/`, composed by `src/styles.scss`; keep component layout and appearance in scoped Astro `<style lang="scss">` blocks.
- Keep design tokens as CSS custom properties so they remain available at runtime. Use Sass features for organization and authoring rather than duplicating runtime tokens.
- Use semantic kebab-case blocks, `block__element`, and `block--modifier`. Do not add `l-`, `p-`, or `c-` prefixes.
- Nest `@media` inside the selector it overrides so base and breakpoint rules stay together. Keep BEM elements and modifiers as top-level selectors.
- Reserve classes for styling. TypeScript must not query or toggle presentation classes.
- Prefer native elements and state attributes such as `hidden`, `open`, `disabled`, and `aria-expanded`; use `id` for explicit element relationships.
- Use component-prefixed `data-*` attributes only for behavior without a native equivalent, and query targets from the component root rather than `document` where possible.
- Keep one source of truth for state. Style native or custom state attributes directly instead of duplicating them with classes.
- Narrow queried elements with `instanceof` checks; do not rely on unchecked casts or non-null assertions.
- Use a custom element when an interaction is reusable, stateful, or owns multiple internal targets.

## Comments

Write comments in English. Prefer why over what. Keep them concise and factual. Use complete sentences for behavior, reasoning, constraints, or workarounds. Do not comment self-explanatory code. Update or remove comments when the related code changes. Place comments immediately above the code they describe. Avoid decorative separators. Prefer descriptive names over comments.

- CSS / Sass: use `/* ... */` for comments that should remain in compiled CSS. Use `//` only for Sass-specific notes that should not appear in the output. Short section labels are fine. Explain non-obvious values, workarounds, layout constraints, and intentional overrides.
- TypeScript: use `//` for implementation notes. Use JSDoc (`/** ... */`) for exported APIs only when it adds information beyond the name and types.
- Astro: use `//` in frontmatter and `<script>`, `<!-- ... -->` for markup notes, and `/* ... */` in `<style>`. Do not leave implementation notes in rendered HTML.

## UI implementation constraints

- Preserve visible `:focus-visible` treatment and complete keyboard operation for every pointer interaction.
- Use the `hover-fine` mixin for hover-only motion so taps do not leave a false hover state. Use `hover` for non-motion hover styling that should apply to any hover-capable pointer.
- Use the `motion-safe` mixin to opt in to spatial motion when the user has not requested reduced motion, while retaining a static cue for the state change.
- Name transition properties explicitly; do not use `transition: all`.
- Prefer `transform` and `opacity` over layout properties when they provide an equivalent animation.

## Repository skills

Read the selected `.agents/skills/*/SKILL.md` before using a skill. Apply review skills only when review is the task; do not invoke them for ordinary implementation or use them to make fixes unless the user separately asks.

- Use `review-accessibility` only when the user explicitly asks for a dedicated accessibility or WCAG review or audit of existing interface code, a diff, or a rendered flow. Do not invoke it for implementation that merely involves forms, semantics, keyboard access, focus, media, or motion.
- Use `review-animations` only when the user explicitly asks for a dedicated review of existing animation or motion code. Its automatic invocation is disabled; it reports findings and a `Block` or `Approve` verdict without implementing changes.
- Use `web-naming-conventions` when choosing, reviewing, or changing names is the primary task. Do not invoke it for ordinary implementation that merely introduces names; repository-specific path rules above take precedence.
- Use `commit-ja` only when the user explicitly invokes `$commit-ja` or `/commit-ja`. It proposes Japanese Conventional Commit text from staged changes without changing files, the index, or Git history.
- Use `tidy-css` only when the user explicitly asks to tidy, clean up, or normalize selected CSS. Do not invoke it for ordinary style implementation.
