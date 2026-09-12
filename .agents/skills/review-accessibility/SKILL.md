---
name: review-accessibility
description: Review interface code, diffs, or rendered flows for accessibility barriers. Use when explicitly invoked as `$review-accessibility` or `/review-accessibility`.
license: MIT
disable-model-invocation: true
---

# Review Accessibility

Review the requested interface or flow. Do not edit files unless fixes are explicitly requested.

Use the project's accessibility target, or WCAG 2.2 AA if none is stated. Use the relevant sections of [review-checks.md](references/review-checks.md).

Inspect semantics, keyboard and focus behavior, forms, dynamic updates, visual access, and media. Test the flow in a browser when available. Distinguish observed behavior from source inspection and mark missing checks `Not verified`.

## Findings

List findings in this table, ordered by severity. Use `path:line` for code or the flow and element for observed behavior.

| Severity | Location | Finding and evidence | User impact | Suggested fix | Verification |
| --- | --- | --- | --- | --- | --- |

Severity:

- **HIGH**: blocks a task or essential content, traps focus, or makes an essential control inaccessible.
- **MEDIUM**: causes substantial friction or ambiguity.
- **LOW**: causes limited difficulty.

For requirement failures, cite the applicable WCAG criterion and level or project rule. Label other improvements as recommendations. Report concrete barriers rather than convention preferences.

## Verdict

End with the reviewed scope, missing checks, and one verdict:

- `Block`: a confirmed HIGH finding remains.
- `Inconclusive`: no confirmed HIGH finding, but essential checks are incomplete.
- `Approve`: essential checks are complete and no HIGH finding remains. Include any MEDIUM or LOW findings.

The verdict covers the reviewed scope; automated checks alone do not establish WCAG conformance.
