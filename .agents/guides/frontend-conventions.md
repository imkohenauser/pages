# Frontend Conventions

Read only the sections routed from `AGENTS.md` for the current change.

## SCSS conventions

- Use SCSS. Keep tokens, reset, base rules, and shared utilities in partials under `src/styles/`, composed by `src/styles.scss`; keep component layout and appearance in scoped Astro `<style lang="scss">` blocks.
- Keep design tokens as CSS custom properties so they remain available at runtime. Use Sass features for organization and authoring rather than duplicating runtime tokens.
- Keep reusable motion durations in `src/styles/_motion-tokens.scss` as CSS custom properties; leave one-off, component-specific timing values scoped to the component.
- Add a matching value to `src/lib/motion-tokens.ts` only when TypeScript behavior needs the numeric duration. Keep the semantic name and duration synchronized across CSS and TypeScript, and prefer `animationend` or `transitionend` when that safely avoids mirrored timing logic.
- Use semantic kebab-case blocks, `block__element`, and `block--modifier`. Do not add `l-`, `p-`, or `c-` prefixes.
- Nest `@media` inside the selector it overrides so base and breakpoint rules stay together. Keep BEM elements and modifiers as top-level selectors.

## TypeScript conventions

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
