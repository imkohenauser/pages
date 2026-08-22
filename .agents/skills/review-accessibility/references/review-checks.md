# Accessibility Review Checks

Apply only the checks relevant to the reviewed interface. Prefer project requirements and observed user impact over mechanically reporting every convention.

## Semantics and names

- Prefer native elements: links for navigation, buttons for actions, and native form controls where possible.
- Verify that real navigation uses links and preserves browser affordances such as opening with middle-click or a modified click.
- Verify that every interactive element has an accessible name and that visible label text is included in that name.
- Verify that ARIA roles match actual behavior and that required states and properties are exposed.
- Flag `aria-hidden="true"` on or above focusable content and broken `aria-labelledby` or `aria-describedby` references.
- Check landmarks, page title, and headings as navigation aids. Report structure only when it causes a concrete navigation or comprehension problem.
- When repeated navigation or other repeated content precedes the main content, verify that keyboard users have a working mechanism such as a skip link to bypass it.
- Classify image alternatives by purpose: decorative images use empty alt text, informative images convey their meaning, and functional images name the action or destination.

## Keyboard and focus

- Complete every in-scope task with the keyboard alone.
- Verify logical focus order, visible focus indication, and equivalent keyboard operation for pointer interactions.
- Flag `outline: none` or equivalent focus suppression without a visible replacement, and verify custom indicators in forced-colors mode when applicable.
- Reject positive `tabindex`. Composite widgets may use roving `tabindex="0"` and `tabindex="-1"` with their expected arrow-key behavior.
- Verify that modal overlays move focus inside, keep background content out of sequential focus and the accessibility tree through native modal behavior or an equivalent such as `inert`, contain focus, close with Escape when expected, and restore focus to a logical element.
- Verify that hidden, disabled, or inactive content is not left in the tab order.
- For client-side navigation, verify that the new view has an appropriate title, focus destination, and scroll behavior.

## Forms and dynamic updates

- Verify programmatic labels, useful input types, autocomplete metadata, and support for paste and password managers.
- Verify that errors are visible, associated with their fields, exposed through state such as `aria-invalid`, and reachable after submission.
- Do not require a disabled submit button as a validity gate; users need a way to submit and receive actionable validation.
- Use focus for errors tied to a destination, `aria-describedby` for control-specific help or errors, polite status regions for routine updates, and alerts only for urgent untied errors.
- Verify that repeated live-region announcements use stable regions and that timed messages do not remove the only path to essential information or actions.

## Visual access, targets, and reflow

- Verify that information and state are not communicated by color or motion alone.
- Measure rendered text, non-text, and focus-indicator contrast when contrast is in scope; do not infer it from token names.
- Check the applicable target-size requirement and its spacing, inline, equivalent-control, user-agent, and essential exceptions before reporting a failure.
- Verify that decorative overlays do not intercept pointer input and that extended hit areas do not overlap.
- Verify that hover-only behavior is gated for hover-capable pointers so a tap does not leave a false hover state.
- Test text resize and zoom, and verify reflow at a narrow viewport without loss of content or function. Allow horizontal scrolling for genuinely two-dimensional content such as tables, maps, and code.
- Verify that viewport settings do not disable or cap user zoom.

## Motion and media

- Verify that spatial motion, parallax, smooth scrolling, and autoplay respect reduced-motion preferences without removing necessary state cues.
- Verify visible controls for media or content that moves, blinks, or updates automatically, and check that essential information is not available only briefly.
- Verify captions for prerecorded video with speech and an appropriate text alternative or transcript for audio content.

## Verification boundaries

- Static source review can confirm markup, relationships, handlers, and CSS guards, but not the full accessibility tree or screen-reader announcement behavior.
- Automated tools find only a subset of barriers and cannot prove that a task is operable or understandable.
- Record browser, operating system, input method, zoom level, and assistive technology when they materially affect a result.
- Mark any required but unavailable manual, device, contrast, or assistive-technology test as `Not verified`.

Normative and pattern references:

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Accessible Rich Internet Applications (WAI-ARIA) 1.2](https://www.w3.org/TR/wai-aria-1.2/)
