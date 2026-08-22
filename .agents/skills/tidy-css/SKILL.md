---
name: tidy-css
description: Refactor specified CSS or style declarations to match project conventions without changing visual intent. Use only when the user explicitly asks to tidy, clean up, or normalize selected CSS, including pasted design-tool CSS. Do not use for ordinary style implementation, design-to-code, or component refactoring.
disable-model-invocation: true
---

# Tidy CSS

Edit only the CSS, SCSS, or `<style>` declarations the user selected or named. Preserve visual intent. Do not inspect Figma or the browser, and do not infer new design.

## Workflow

1. Identify the target. If it is unclear, ask.
2. Read `AGENTS.md` and the target file. Read `src/styles/_tokens.scss` before replacing values. Read `src/styles/_tools.scss` when the target may use project Sass utilities.
3. Keep the diff minimal. If `AGENTS.md` specifies verification, run it.

## Allowed

- Format to match the file.
- Replace a value only when it exactly matches an existing token (`8px` / `rem(8)` / `0.5rem` → `var(--space-2)`). Do not snap nearby values (`10px` stays `rem(10)`, not `--space-3`).
- If a semantic token and a palette token both match, follow nearby declarations; otherwise keep the palette token.
- Use existing project mixins and `rem()` for the same meaning, and nest media mixins inside the selector they override.
- Use logical properties only when nearby code already does.
- Remove duplicates in the same rule set.
- Reorder properties only when the target file or project rules establish a clear ordering convention. For raw design-tool CSS, nearby blocks in the same file may be used as the reference.

Do not change markup, class names, or selectors. Do not rename or create tokens. Do not nest BEM elements as `&__`. Do not drop a declaration because it looks like a default.

Add `@use "tools" as *;` only when the block needs it and does not already import the Sass API.

Do not add comments. Remove a comment only when the edit made it obsolete.

## Example

```css
/* before */
display: flex;
width: 339px;
flex-direction: column;
gap: 10px;
padding: 8px 12px;
background: #262626;

/* after */
display: flex;
width: rem(339);
flex-direction: column;
gap: rem(10);
padding: var(--space-2) var(--space-3);
background: var(--neutral-800);
```

## Output

Name what was normalized, replaced, or removed. If a value stayed literal, say why. If no cleanup is needed, do not edit.
