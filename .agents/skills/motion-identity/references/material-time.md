# Material Time

Material time is continuous, short, and physically legible. Use it for press and release, compression, small displacement, deformation, restoration, and afterglow after interaction.

Treat a control as one acrylic or gel object. Its label and icon follow the material rather than moving as independent decorations.

Prefer the existing material tokens:

- press: `var(--motion-material-press)`;
- release: `var(--motion-material-release)`;
- afterglow: `var(--motion-material-afterglow)`.

A typical press may use `translateY(1px) scale(0.97)`. Do not add bounce unless a future material concept explicitly calls for elasticity; the current material is acrylic or gel, not rubber.

## Interaction relationships

- Press interrupts the electronic sequence and switches to material time.
- Release is faster than deliberate press.
- Afterglow represents residual phosphor rather than primary feedback.
- Interruption and repeated input must end in an intentionally defined stable state.

Reuse these relationships from `ButtonLink`, not necessarily every keyframe value. Do not introduce large bounce combined with stepped malfunction or motion that delays navigation or repeated tasks.
