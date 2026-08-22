---
name: review-accessibility
description: Review existing interface code, diffs, or rendered flows for accessibility barriers. Use only when the user explicitly requests a dedicated accessibility or WCAG review or audit. Report findings only; do not modify code unless separately asked.
---

# Review Accessibility

Review only the interface and user flow in scope. Do not edit files, implement fixes, or expand into general UI review unless the user separately asks.

Prefer the project's stated accessibility target. When none is stated, use WCAG 2.2 Level AA as the review baseline and identify checks that require manual or assistive-technology verification.

Read [references/review-checks.md](references/review-checks.md) completely before reviewing.

## Review method

1. Identify the user tasks, interactive elements, and dynamic states in scope.
2. Inspect semantics, accessible names, roles, relationships, and exposed states.
3. Inspect keyboard operation, focus order, focus visibility, focus movement, and restoration.
4. Inspect forms, errors, status messages, and other dynamic updates.
5. Inspect images, media, target sizes, color-independent cues, zoom, reflow, and motion preferences.
6. When a browser is available, test keyboard-only operation, the accessibility tree, zoom or narrow reflow, and reduced-motion settings.
7. Separate confirmed findings from checks that could not be performed.

Automated audits supplement manual review. They do not establish conformance.

## Finding requirements

Report only issues supported by code or observed behavior. Each finding must include severity, location or affected flow, current behavior, affected users and task impact, recommended outcome, and verification status.

Do not report conventions as failures without concrete user impact:

- Do not report heading-level preferences as standalone failures.
- Check target-size exceptions before reporting an undersized control.
- Do not assume a custom focus color or contrast pair passes without measuring the rendered result.
- Do not claim screen-reader behavior was verified when only source code was inspected.
- Prefer valid native behavior over a custom ARIA reconstruction.

## Severity and verdict

- **HIGH** — blocks a task, hides essential content, traps or loses focus, or makes an essential control unavailable to keyboard or assistive technology.
- **MEDIUM** — creates substantial friction, ambiguity, or unreliable operation without fully blocking the task.
- **LOW** — isolated accessibility polish with limited task impact.

List findings first, ordered by severity:

| Severity | Location | Finding | User impact | Recommendation | Verification |
| --- | --- | --- | --- | --- | --- |

Use `path:line` for code findings and a concise flow or element name for runtime findings.

Close with `Block` when a HIGH finding remains and `Approve` when no blocking finding remains in the inspected scope. State `Not fully verified` when required browser, screen-reader, contrast, zoom, or device checks could not be performed. Approval applies only to the reviewed scope and is not a claim of complete WCAG conformance.
