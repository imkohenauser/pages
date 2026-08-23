---
name: motion-identity
description: Apply this site's Frame Echo + Material Malfunction identity when designing or implementing animation, transitions, hover or press feedback, blinking, lighting, glow, afterimages, or three.js motion. Do not use for a dedicated review of existing motion; use the repository's review skill when the user explicitly requests a review.
---

# Motion Identity

Apply this skill when adding or changing motion. It defines the project's visual and behavioral identity; it is not a general animation review or accessibility audit.

Do not invoke `review-animations` or `review-accessibility` during ordinary implementation unless the user separately requests that review. This skill does not override repository conventions, accessibility requirements, performance constraints, or explicit user direction.

## Identity

The motion identity is **Frame Echo + Material Malfunction**.

The site combines digitally sampled time with tactile interface materials. The three.js world may be spatial, atmospheric, and continuous. UI motion reflects that world through short event-driven reactions rather than behaving like another continuous 3D scene.

- **Frame Echo** treats movement as visible fragments of time instead of a perfectly smooth trajectory.
- **Material Malfunction** gives acrylic, gel, fluorescent, CRT, and early Aqua-like surfaces a controlled electrical fault.
- The result may look slightly broken, but it must remain intentional, deterministic, and reproducible.

Static presentation is the default. Add motion only when it communicates an electronic event, a material response, a spatial relationship, or a meaningful state change.

## Priority

When principles compete, use this order:

1. Preserve task clarity and reliable operation.
2. Preserve accessible state communication and input support.
3. Provide immediate interaction feedback.
4. Express the motion identity.
5. Add decorative detail only when it does not weaken the preceding priorities.

Identity never justifies obscuring content, delaying frequent operations, or making state understandable only through motion.

## Two kinds of time

Keep electronic time and material time distinct. Their contrast is central to the identity.

### Electronic time

Electronic time is discrete, stepped, and deliberately uneven.

Use it for:

- failed ignition;
- blinking or signal loss;
- CRT bloom and phosphor afterglow;
- white clipping;
- sampled echoes or duplicated frames.

Electronic sequences must:

- use fixed keyframes rather than runtime randomness;
- occur in response to a meaningful encounter;
- play once and settle into a stable state;
- start and finish in intentionally defined states;
- keep labels readable for most of the sequence;
- avoid smooth interpolation between simulated electrical failures.

Use `var(--motion-electronic-cycle)` for the shared electronic cadence when appropriate. Do not copy identical brightness changes onto every layer. Offset the surface, gloss, label, icon, and echo phases so the result resembles an electrical system stabilizing.

### Material time

Material time is continuous, short, and physically legible.

Use it for:

- press and release;
- surface compression;
- small displacement;
- deformation;
- restoration after interaction.

Treat a control as one acrylic or gel object. Its label and icon follow the material rather than moving as independent decorations.

Prefer the existing material tokens:

- press: `var(--motion-material-press)`;
- release: `var(--motion-material-release)`;
- afterglow: `var(--motion-material-afterglow)`.

A typical press may use `translateY(1px) scale(0.97)`. Do not add bounce unless a future material concept explicitly calls for elasticity; the current material is acrylic or gel, not rubber.

## Lighting and ignition

Treat glow as emitted light, not as a generic blue hover color.

- A lit surface may use gradients, inner edges, bloom, white clipping, or a short afterglow.
- Keep the resting label stable and readable.
- Put strong bloom on surfaces or dedicated light layers before applying it to text.
- Prefer fixed pseudo-element light layers whose opacity changes over repeatedly animating large gradients, shadows, or filters.
- Use palette colors according to the layer: brighter sky values may describe bloom, while readable text must retain sufficient contrast.
- Do not change text, logo, or icon color merely because its parent surface blinks unless that color change is part of the requested design.

A blink represents failed ignition or brief signal instability. It is not a generic indication that an element is interactive.

## Intensity hierarchy

Do not make every interactive element malfunction at the same strength.

Use the current hierarchy as the reference:

1. **Primary controls such as `ButtonLink`** may use the strongest ignition sequence, layered surface changes, gloss interruption, a short frame echo, material press, and afterglow.
2. **Large interactive surfaces such as `Card`** may ignite their surface and edge, but content remains comparatively stable.
3. **Nested indicators such as `ActionLink` inside a Card** follow the host timing. They may use a small opacity interruption, but must not introduce independent color, shadow, transform, or a second unsynchronized blink unless explicitly requested.
4. **Utility and header links** use the lowest intensity. A short one-shot interruption is acceptable; continuous flicker, large bloom, and material displacement are not.
5. **Ordinary inline text links** remain quiet unless the user establishes a new role for them.

When extending the system, choose the component's level before choosing keyframes.

## Reference behavior

`ButtonLink` is the primary reference implementation.

Its behavior establishes these relationships:

- pointer entry triggers a deterministic failed-ignition sequence;
- surface, gloss, label, and icon respond at different phases;
- press interrupts the electronic sequence and switches to material time;
- release is faster than deliberate press;
- afterglow represents residual phosphor rather than primary feedback;
- a cooldown prevents rapid re-entry from becoming uncontrolled flicker.

Reuse these relationships, not necessarily every keyframe value.

`Card` is the reference for a larger lit surface:

- a short dwell prevents incidental cursor travel from igniting a list;
- the surface settles into a stable illuminated state;
- edge bloom disappears after ignition;
- nested content does not become a second light source;
- keyboard focus receives a stable equivalent state without blinking.

## Frame Echo

Use Frame Echo sparingly to connect UI motion with repeated horses, fish, binary fields, and video-feedback imagery.

A Frame Echo may use:

- one or two short positional duplicates;
- stepped horizontal or directional displacement;
- briefly separated icon states;
- low-frame-rate sampled movement;
- a short phase offset between related layers.

Keep echoes local and short. They must converge cleanly and must not leave duplicate text, uncertain hit targets, or a persistent blurred state.

Do not apply Frame Echo to body text, form values, error messages, or information the user is actively reading.

## Input and motion preferences

- Gate hover-only motion with the repository's `hover-fine` mixin.
- Keep non-motion hover styling separate when it should apply to any hover-capable pointer.
- Use `motion-safe` for stepped, spatial, or decorative motion.
- Touch interaction receives material press feedback, not simulated hover ignition.
- Keyboard focus is immediate, stable, and visibly distinct. Do not blink focus indicators.
- Keyboard activation may use essential static or material feedback, but must not replay decorative hover malfunction.
- Under `prefers-reduced-motion: reduce`, remove stepped malfunction, spatial echo, and decorative afterglow. Retain static color, outline, contrast, shape, or surface changes that communicate the state.
- Never use blinking as the only indication of focus, activation, loading, success, or error.

## three.js relationship

The three.js scene and UI occupy different motion layers.

- The scene may be continuous, spatial, atmospheric, or environmental.
- UI motion remains short, local, and event-driven.
- Translate repetition from the scene into small echoes, sampled frames, or phase offsets in UI.
- Do not duplicate the full scene language inside controls.
- Avoid simultaneous paint-heavy UI effects across lists while the three.js scene is rendering.
- Evaluate the combined page on a physical mobile device and a moderately powered laptop when changing both layers.

## Implementation constraints

Follow the repository's existing SCSS, token, state, and custom-element conventions.

- Keep reusable durations in `src/styles/_motion-tokens.scss`.
- Mirror a duration in TypeScript only when behavior genuinely needs its numeric value.
- Prefer `animationend` or `transitionend` over duplicated timers when safe.
- Use component-prefixed `data-*` state attributes for behavior without a native equivalent.
- Keep one source of truth for each state.
- Keep hover ignition deterministic; do not generate random timing at runtime.
- Keep paint-heavy effects short and local.
- Prefer opacity and transform for moving layers, while allowing brief surface paint effects when they are essential to the lighting concept.
- Do not use `transition: all`.
- Preserve visible focus treatment and complete keyboard operation.

## Avoid

Do not introduce:

- runtime-random flicker;
- continuous ambient blinking on inactive UI;
- the same brightness keyframes on every layer;
- smooth easing between electrical failure frames;
- large bounce combined with stepped malfunction;
- independent nested blinks competing with their host component;
- blue color changes as a substitute for an actual lighting concept;
- glow or shadow on every interactive label;
- motion that delays navigation or repeated tasks;
- malfunction as the sole carrier of semantic state;
- a new animation simply because another component already blinks.

## Working method

When adding or changing motion:

1. Identify what the motion communicates and whether static feedback is sufficient.
2. Classify it as electronic time, material time, Frame Echo, or a deliberate combination.
3. Assign its intensity level relative to existing components.
4. Inspect nearby implementations and reuse established tokens and state patterns.
5. Define pointer, touch, keyboard, and reduced-motion behavior before adding decorative detail.
6. Implement the smallest sequence that expresses the concept.
7. Verify the resting state, ignition, interruption, settled state, and rapid re-entry.
8. Check the component in the context of the complete page, not only in isolation.

If the requested effect conflicts with this identity, preserve the user's explicit request and briefly identify the departure rather than silently redesigning it.
