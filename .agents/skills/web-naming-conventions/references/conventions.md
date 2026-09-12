# Naming defaults

Use these when project conventions do not settle the choice.

## General

- Use one word per concept and symmetrical pairs: `users` / `user`, `minWidth` / `maxWidth`.
- Prefer specific names; use `data` or `item` when the local context supplies the meaning.
- Include units when needed: `delayMs`, `widthPx`.
- Follow existing acronym casing and omit redundant types or directory names.

## JavaScript and TypeScript

- `camelCase` for variables and functions; `PascalCase` for components, classes, and types.
- `SCREAMING_SNAKE_CASE` for module-level immutable constants; `camelCase` for ordinary `const` bindings.
- Nouns for values, verb–object pairs for actions: `selectedPlan`, `formatPrice`.
- Positive predicates for booleans: `isVisible`, `hasError`, `canRetry`.
- Plurals for collections; describe keyed relationships: `usersById`.
- `onAction` for callback props, `handleAction` for local handlers, `use` for hooks.
- Distinguish behavior: `findUser` may return nothing; `requireUser` returns a user or fails. Use `parse`, `format`, and `to` / `from` for their respective operations.
- Add `Async` when distinguishing a synchronous counterpart.

## HTML and CSS

- Name purpose or state. Follow the existing CSS architecture; keep CSS Module names local.
- Use kebab-case for custom elements, data attributes, and custom properties: `account-menu`, `data-plan-id`, `--color-accent`.
- Name keyframes for the effect and test hooks for stable behavior.

## Paths and contracts

- Follow framework-required filenames and local casing. Otherwise, match a file's primary export or use kebab-case for its responsibility.
- Use lowercase ASCII kebab-case for routes and general directories. Name capabilities, not buckets such as `misc`.
- Keep routes short and based on user-facing concepts. Use a consistent language scheme for localized slugs.
- Follow the owning schema or platform for packages, API fields, environment variables, events, and stored keys.
- Defaults: `SCREAMING_SNAKE_CASE` for environment variables, `snake_case` for analytics events and properties, and namespaced storage keys such as `checkout:cart:version`.
- Keep analytics and translation keys tied to meaning rather than UI implementation or current copy. Preserve framework prefixes on exposed environment variables.

## Assets

- Use short kebab-case names for content or role: `checkout-empty-state.svg`.
- Add maintained variants in a consistent order: `logo-dark.svg`, `hero-mobile@2x.webp`.
- Preserve generated hashes. Include dates, dimensions, or versions only when they distinguish maintained variants.
- Name shared icons by concept: `arrow-left`, `warning`.
