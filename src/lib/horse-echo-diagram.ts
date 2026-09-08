class HorseEchoDiagram extends HTMLElement {
  private controller?: AbortController;
  private observer?: IntersectionObserver;
  private image?: HTMLImageElement;

  connectedCallback() {
    if (this.controller) return;
    const toggle = this.querySelector('[data-horse-echo-toggle]');
    if (!(toggle instanceof HTMLInputElement)) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    toggle.addEventListener('change', () => void this.renderStills(signal), { signal });
    this.observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      this.observer?.disconnect();
      void this.renderStills(signal);
    });
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = undefined;
    this.observer?.disconnect();
    this.image = undefined;
  }

  private async renderStills(signal: AbortSignal) {
    const toggle = this.querySelector('[data-horse-echo-toggle]');
    const status = this.querySelector('[data-horse-echo-status]');
    if (!(toggle instanceof HTMLInputElement) || !(status instanceof HTMLElement)) return;
    toggle.disabled = true;
    let renderer: import('./arch-renderer').ArchRenderer | undefined;
    try {
      const { ArchRenderer } = await import('./arch-renderer');
      if (signal.aborted) return;
      if (!this.image) {
        const image = new Image();
        image.src = this.dataset.horseEchoSource ?? '';
        await image.decode();
        if (signal.aborted) return;
        this.image = image;
      }
      if (signal.aborted) return;
      const source = document.createElement('canvas');
      // Render once per still, then release the shared GPU context.
      renderer = new ArchRenderer(source, this, this.image);
      for (const canvas of this.querySelectorAll('[data-horse-echo-step]')) {
        if (!(canvas instanceof HTMLCanvasElement)) continue;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');
        renderer.snapshot(Number(canvas.dataset.horseEchoStep), toggle.checked);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0);
        canvas.hidden = false;
      }
      for (const fallback of this.querySelectorAll('[data-horse-echo-fallback]')) {
        fallback.setAttribute('hidden', '');
      }
      status.textContent = toggle.checked ? '残像ありの3段階を表示中' : '残像なしの3段階を表示中';
      toggle.disabled = false;
    } catch {
      if (signal.aborted) return;
      for (const canvas of this.querySelectorAll('[data-horse-echo-step]')) {
        if (canvas instanceof HTMLCanvasElement) canvas.hidden = true;
      }
      for (const fallback of this.querySelectorAll('[data-horse-echo-fallback]')) fallback.removeAttribute('hidden');
      status.textContent = '残像を描画できないため、姿勢と位置の静止図を表示しています。';
    } finally {
      renderer?.dispose();
    }
  }
}

export function defineHorseEchoDiagram() {
  if (!customElements.get('horse-echo-diagram')) customElements.define('horse-echo-diagram', HorseEchoDiagram);
}
