# Naming Conventions

These are fallbacks, not reasons to override a coherent project convention.

## General model

- Use the vocabulary of the product domain. Use the same word for the same concept and different words for different concepts.
- Prefer specific, concise names. Generic words such as `data`, `info`, `item`, `object`, `value`, and `temp` are acceptable only when the surrounding scope supplies the missing meaning.
- Keep paired and related names symmetrical: `users` / `user`, `minWidth` / `maxWidth`.
- Include units when the type or context does not make them clear: `delayMs`, `widthPx`.
- Follow existing acronym casing consistently, such as `url` versus `URL`.
- Avoid encoding implementation details, redundant context, types, or directory names into a name.

## JavaScript and TypeScript

- Use `camelCase` for variables and functions and `PascalCase` for components, classes, and types. Follow the project's established form for constants; when none exists, reserve `SCREAMING_SNAKE_CASE` for module-level immutable constants and use `camelCase` for ordinary `const` bindings.
- Name values and objects with nouns: `selectedPlan`, `checkoutSession`.
- Name actions with a verb and object: `formatPrice`, `removeItem`.
- Write booleans as positive questions using `is`, `has`, `can`, `should`, or another precise predicate: `isVisible`, `hasError`, `canRetry`.
- Use plural nouns for collections and the corresponding singular noun for members: `users`, `user`.
- Name keyed collections by their relationship: `usersById`.
- Use `onAction` for callback properties and `handleAction` for local handlers when that distinction exists in the project.
- Prefix hooks with `use`. Name components and types for the concept they represent.
- Distinguish operation contracts. For example, `findUser` may return no result, while `requireUser` must return a user or fail. Do not mix `get`, `find`, `fetch`, `load`, `create`, and `ensure` without a meaningful distinction.
- Use `parse` for interpreting input, `format` for presentation, and `to` / `from` for conversions when those verbs describe the contract.
- Add `Async` only when it distinguishes the API from a synchronous counterpart.

## HTML, CSS, and browser-facing names

- Use semantic names based on purpose or state, not visual appearance or DOM position.
- Follow the project's CSS architecture. Do not introduce BEM, FLOCSS, utility naming, or another system into a project that uses a different coherent system.
- Keep CSS Module names locally meaningful; the module already supplies context.
- Use lowercase kebab-case for custom elements, custom data attributes, and CSS custom properties: `account-menu`, `data-plan-id`, `--color-accent`.
- Use IDs only when identity or browser behavior requires them; do not use IDs solely as styling hooks.
- Use native HTML and ARIA names exactly as specified. Do not invent ARIA attributes.
- Name animation keyframes for the transition or effect, not the page where they were first used.
- Keep test hooks stable and behavior-oriented. Do not expose styling or DOM structure unless the test specifically needs it.

## Files, directories, routes, and repositories

- Follow the surrounding path convention. When none exists, use lowercase ASCII kebab-case for URL segments, routes, general-purpose directories, and other web-facing paths.
- Follow the framework and surrounding convention for source-file casing. When neither settles the choice, match a named primary export's casing; otherwise name the file after its responsibility in lowercase kebab-case. Match framework-required filenames exactly.
- Name directories for the domain or capability they contain, not vague buckets such as `misc`, `common`, or `new` unless the repository defines those terms.
- Keep routes short, stable, readable, and based on user-facing concepts. Treat published routes as public contracts.
- For localized products, define whether new slugs use translated words, English concepts, or another stable scheme. Avoid ad hoc transliteration, and preserve published slugs unless a migration is planned.
- Follow package registry rules for package names. Treat published package and repository names as public contracts.

## Contract and persisted names

- Follow the owning schema, platform, or framework for API fields, URL parameters, environment variables, analytics events, translation keys, cookies, and persisted storage keys.
- When none defines a convention, use `SCREAMING_SNAKE_CASE` for environment variables, lowercase `snake_case` for analytics events and properties, and lowercase colon-delimited namespaces for browser storage keys, such as `checkout:cart:version`.
- Treat client-exposed environment-variable prefixes and similar framework markers as security and compatibility contracts.
- Keep analytics event names and properties stable and based on user or domain events rather than UI implementation details.
- Namespace persisted keys when collision is plausible.
- Keep translation keys semantic and stable; do not derive them from the current source-language sentence when copy changes independently.

## Images and other assets

- Describe the asset's content or role with a short lowercase kebab-case basename: `checkout-empty-state.svg`, `team-portrait.jpg`.
- Add meaningful variants in a stable order, such as subject, role, theme, breakpoint, or density: `logo-dark.svg`, `hero-mobile@2x.webp`.
- Do not add dimensions, dates, or version labels unless they distinguish maintained variants.
- Preserve hashes and generator-controlled names in build output.
- Keep icon names conceptual and reusable: `arrow-left`, `warning`, `download`; avoid names tied to one screen when the icon is shared.
- Do not derive accessible text such as image `alt` text from filenames; name files and author accessibility text for their different purposes.
