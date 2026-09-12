# Electronic Time

Electronic time is discrete, stepped, and deliberately uneven. Use it for failed ignition, blinking or signal loss, CRT bloom, white clipping, and sampled electrical instability.

## Sequence

- Use fixed keyframes rather than runtime randomness.
- Trigger the sequence from a meaningful encounter, play it once, and settle into an intentionally defined stable state.
- Keep labels readable for most of the sequence.
- Avoid smooth interpolation between simulated electrical failures.
- Use `var(--motion-electronic-cycle)` for the shared cadence when appropriate.
- Offset surface, gloss, label, icon, and echo phases instead of copying identical brightness changes onto every layer.

A blink represents failed ignition or brief signal instability. It is not a generic indication that an element is interactive. Do not add an animation merely because another component already blinks.

## Lighting

Treat glow as emitted light, not as a generic blue hover color.

- A lit surface may use gradients, inner edges, bloom, white clipping, or a short afterglow.
- Keep resting labels stable and readable. Put strong bloom on surfaces or dedicated light layers before applying it to text.
- Prefer fixed pseudo-element light layers whose opacity changes over repeatedly animating large gradients, shadows, or filters.
- Use palette colors according to the layer: brighter sky values may describe bloom, while readable text retains sufficient contrast.
- Do not change text, logo, or icon color merely because its parent surface blinks unless the requested design includes that change.
- Keep paint-heavy effects short and local. Brief surface paint effects are acceptable when essential to the lighting concept.

Do not introduce continuous ambient blinking on inactive UI, glow or shadow on every interactive label, or blue color changes as a substitute for a lighting concept.

## Intensity hierarchy

Choose the component's level before choosing keyframes.

1. Primary controls such as `ButtonLink` may use the strongest ignition, layered surface changes, gloss interruption, a short Frame Echo, material press, and afterglow.
2. Large interactive surfaces such as `Card` may ignite their surface and edge, while content remains comparatively stable.
3. Nested indicators such as `ActionLink` inside a Card follow the host timing. They may use a small opacity interruption, but not an independent color, shadow, transform, or unsynchronized blink unless explicitly requested.
4. Utility and header links use the lowest intensity: a short one-shot interruption is acceptable; continuous flicker, large bloom, and material displacement are not.
5. Ordinary inline text links remain quiet unless the user establishes a new role for them.

## Reference behavior

`ButtonLink` is the primary reference implementation. Pointer entry triggers deterministic failed ignition; surface, gloss, label, and icon respond at different phases. A cooldown prevents rapid pointer re-entry from becoming uncontrolled flicker.

`Card` is the reference for a larger lit surface. A short dwell prevents incidental cursor travel from igniting a list; the surface settles into a stable illuminated state; edge bloom disappears after ignition; nested content does not become a second light source; keyboard focus receives a stable equivalent state without blinking.

Reuse these relationships, not necessarily every keyframe value. Independent nested blinks must not compete with their host component.
