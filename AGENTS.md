# Guidance for AI Agents Working in This Repo

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

## UI, motion, and accessibility skills

Use the skills under `.agents/skills/` according to the task, and read the selected skill's `SKILL.md` before changing code. Keep the existing component library, design tokens, density, and motion language unless the selected skill requires a specific value or interaction.

### Skill responsibilities

- Use `better-ui` when building or polishing UI, including hover and press states, shadows, radii, icon treatment, optical alignment, and motion restraint. It decides how an interaction should look and feel; it is not a substitute for accessibility review.
- Use `animate` when the task is to add or implement motion. Follow its build sequence in order: decide whether the element should animate, name the purpose, choose the cheapest suitable tool, then select properties, easing, duration, interruption behavior, and exit behavior. Load its referenced recipe when the requested component has one.
- Use `better-accessibility` when building or reviewing interactive UI and whenever the task involves semantics, keyboard access, focus, accessible names, hit areas, screen readers, zoom, autoplay, hover on touch, or reduced motion. Prefer native HTML over custom controls and ARIA.
- Use `review-animations` only for a dedicated review of existing animation or motion code. It reports findings and a `Block` or `Approve` verdict; it does not implement features or review unrelated code. Because the skill disables automatic model invocation, invoke it explicitly when an animation review is requested or required by the workflow.

### Recommended workflow

1. For UI work, use `better-ui` to establish the interaction and visual treatment.
2. If motion is justified, use `animate` to implement it. It is valid for this step to conclude that no animation should be added.
3. Use `better-accessibility` during implementation, not as a final patch, so semantics, focus, keyboard behavior, pointer gating, and reduced-motion behavior ship with the component.
4. After motion is implemented, explicitly use `review-animations` to review the changed motion code. Resolve blocking findings before considering the work complete.

### Shared constraints

- Keep motion consistent across the site.
- Centralize motion values in a shared motion-token file instead of defining them per component.
- Accessibility takes precedence over decorative motion. Never make motion the only indication of a state change.
- Prefer `transform` and `opacity`; do not animate layout properties when a composited alternative exists.
- Name transition properties explicitly. Do not use `transition: all`.
- Gate hover-only motion with `@media (hover: hover) and (pointer: fine)` so taps do not leave false hover states.
- Honor `prefers-reduced-motion`: remove spatial movement, parallax, and autoplay as appropriate while retaining static cues or gentle opacity/color feedback that aids comprehension.
- Keep frequent interactions subtle and fast. Do not animate keyboard-initiated or extremely frequent actions.
- Preserve visible `:focus-visible` treatment and complete keyboard operation for every pointer interaction.
