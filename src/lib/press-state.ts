export function attachPressState(
  host: HTMLElement,
  target: HTMLElement,
  attribute: `data-${string}`,
  signal: AbortSignal,
) {
  const press = () => host.toggleAttribute(attribute, true);
  const release = () => host.removeAttribute(attribute);

  target.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      press();
    },
    { signal },
  );
  target.addEventListener('pointerup', release, { signal });
  target.addEventListener('pointercancel', release, { signal });
  target.addEventListener('pointerleave', release, { signal });
  target.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' || event.repeat) return;
      press();
    },
    { signal },
  );
  target.addEventListener(
    'keyup',
    (event) => {
      if (event.key !== 'Enter') return;
      release();
    },
    { signal },
  );
  target.addEventListener('blur', release, { signal });
  signal.addEventListener('abort', release, { once: true });
}
