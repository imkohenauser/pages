# Accessibility checks

Use the checks relevant to the flow and review target.

## Semantics

- Native links for navigation and buttons for actions; preserve browser link behavior.
- Accessible names for controls, including visible labels; roles and states matching behavior.
- Valid `aria-labelledby` and `aria-describedby` references; no focusable content under `aria-hidden="true"`.
- Useful landmarks, page title, headings, and a way to bypass repeated content.
- Image alternatives matching purpose: empty for decoration, meaning for information, action or destination for functional images.

## Keyboard and focus

- Complete tasks with the keyboard; check focus order, visibility, and equivalent operation.
- Test custom focus indicators, including forced-colors mode where relevant.
- Check actual ordering problems from positive `tabindex`; allow expected roving tabindex in composite widgets.
- For modals, check entry focus, background isolation, focus containment, expected Escape behavior, and restoration.
- Keep hidden and inactive content out of the tab order. Check title and focus after client-side navigation.

## Forms and updates

- Programmatic labels, input types, autocomplete, paste, and password-manager support.
- Visible, associated, reachable errors and accurate invalid states. Allow users to obtain actionable validation.
- Control-specific descriptions, polite routine status updates, and alerts for urgent updates.
- Stable live regions and enough time to access essential messages and actions.

## Visual access

- Information conveyed beyond color or motion alone.
- Measured rendered contrast; token names are insufficient evidence.
- Target size under the applicable criterion, including its spacing, inline, equivalent-control, user-agent, and essential exceptions.
- Usable hit areas without obstructing overlays or overlap; hover interactions that also work on touch.
- Text resize, zoom, and narrow reflow without loss of function. Allow scrolling for two-dimensional content.

## Motion and media

- Controls for moving or auto-updating content, flash limits, and access to time-limited information.
- Reduced-motion behavior that retains necessary state cues. At AA, distinguish recommendations from AAA criterion 2.3.3 or explicit project requirements.
- Captions for prerecorded speech video and text alternatives for audio.

Record browser, input method, zoom, or assistive technology when it affects the finding. Source inspection cannot verify screen-reader announcements.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
