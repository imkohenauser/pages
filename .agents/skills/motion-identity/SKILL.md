---
name: motion-identity
description: Apply this site's Frame Echo + Material Malfunction identity when designing or implementing animation, transitions, hover or press feedback, blinking, lighting, glow, afterimages, or three.js motion. Do not use for a dedicated review of existing motion; use the repository's review skill when the user explicitly requests a review.
---

# Motion Identity

Apply this skill when adding or changing motion. It defines the project's visual and behavioral identity; it is not a general animation review or accessibility audit.

Do not invoke `review-animations` or `review-accessibility` during ordinary implementation unless the user separately requests that review. Follow repository conventions, accessibility and performance requirements, and explicit user direction. If a requested effect departs from this identity, preserve the request and briefly identify the departure instead of silently redesigning it.

## Identity

The motion identity is **Frame Echo + Material Malfunction**: digitally sampled time meets tactile acrylic, gel, fluorescent, CRT, and early Aqua-like surfaces. UI motion uses short, event-driven reactions; it does not become another continuous 3D scene. The result may look slightly broken, but it must remain intentional, deterministic, and reproducible.

Static presentation is the default. Add motion only when it communicates an electronic event, a material response, a spatial relationship, or a meaningful state change.

## Priority

When principles compete, use this order:

1. Preserve task clarity and reliable operation.
2. Preserve accessible state communication and input support.
3. Provide immediate interaction feedback.
4. Express the motion identity.
5. Add decorative detail only when it does not weaken the preceding priorities.

Identity never justifies obscuring content, delaying frequent operations, or making state understandable only through motion.

## Choose the effect

Keep electronic time and material time distinct. Their contrast is central to the identity.

- For failed ignition, blinking, lighting, bloom, signal instability, or intensity, read [electronic-time.md](references/electronic-time.md).
- For press and release, compression, restoration, afterglow, or interruption behavior, read [material-time.md](references/material-time.md).
- For sampled afterimages, positional duplicates, or phase-separated layers, read [frame-echo.md](references/frame-echo.md).

Read only the references needed for the effect. For a deliberate combination, read each relevant reference and preserve the relationship between its phases.

## Input and motion preferences

- Gate hover-only motion with the repository's `hover-fine` mixin. Touch receives material press feedback, not simulated hover ignition.
- Keep non-motion hover styling separate when it should apply to any hover-capable pointer.
- Use `motion-safe` for stepped, spatial, or decorative motion.
- Keyboard focus is immediate, stable, and visibly distinct. Do not blink focus indicators.
- Keyboard activation may use essential static or material feedback, but must not replay decorative hover malfunction.
- Under `prefers-reduced-motion: reduce`, remove stepped malfunction, spatial echo, and decorative afterglow. Retain a static cue that communicates the state.
- Never use blinking as the only indication of focus, activation, loading, success, or error.

## three.js relationship

The three.js scene may be continuous, spatial, atmospheric, or environmental. UI motion remains short, local, and event-driven. Translate repetition from the scene into small echoes, sampled frames, or phase offsets rather than duplicating the full scene language inside controls.

Avoid simultaneous paint-heavy UI effects across lists while the scene is rendering. When changing both layers, evaluate their combined load on a physical mobile device and a moderately powered laptop.

## Working method

Decide what the motion communicates and whether static feedback is sufficient. Then choose the relevant time model, intensity, nearby reference behavior, and the smallest sequence that expresses the concept. Define pointer, touch, keyboard, and reduced-motion behavior before decorative detail.

Before finishing, verify the resting and stable end states, interruption, rapid repeated input, and the effect in the complete page. Check page-level load as well as the component in isolation.
