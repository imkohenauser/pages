import { runCycle } from './horse-motion';
import { attachPressState } from './press-state';

const cycleDuration = runCycle.reduce((sum, frame) => sum + frame.durationMs, 0);

class HorseRunDemo extends HTMLElement {
  private controller?: AbortController;
  private observer?: IntersectionObserver;
  private motion?: MediaQueryList;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private image?: HTMLImageElement;
  private playButton?: HTMLButtonElement;
  private playLabel?: HTMLElement;
  private status?: HTMLElement;
  private animation?: number;
  private elapsed = 0;
  private startedAt = 0;
  private visible = false;
  private frameIndex = -1;
  private playbackId = 0;

  connectedCallback() {
    if (this.controller) return;
    const canvas = this.querySelector('[data-horse-run-canvas]');
    const play = this.querySelector('[data-horse-run-play]');
    const playLabel = this.querySelector('[data-horse-run-play-label]');
    const reset = this.querySelector('[data-horse-run-reset]');
    const status = this.querySelector('[data-horse-run-status]');
    if (!(canvas instanceof HTMLCanvasElement) || !(play instanceof HTMLButtonElement) ||
        !(playLabel instanceof HTMLElement) || !(reset instanceof HTMLButtonElement) ||
        !(status instanceof HTMLElement)) return;
    this.canvas = canvas;
    this.playButton = play;
    this.playLabel = playLabel;
    this.status = status;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => {
      this.pause();
      play.disabled = this.motion?.matches ?? false;
      this.message(play.disabled ? 'モーション軽減設定に合わせて静止表示しています。' : this.pausedMessage());
    };
    preference();
    reset.disabled = false;
    attachPressState(play, play, 'data-horse-run-pressed', signal);
    attachPressState(reset, reset, 'data-horse-run-pressed', signal);
    this.motion.addEventListener('change', preference, { signal });
    play.addEventListener('click', () => {
      if (this.animation !== undefined) this.pause();
      else void this.play(signal);
    }, { signal });
    reset.addEventListener('click', () => {
      this.pause();
      this.elapsed = 0;
      this.draw(0);
      if (!this.motion?.matches) this.message(this.pausedMessage());
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    }, { signal });
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? false;
      if (!this.visible) this.pause();
    });
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.pause();
    this.controller?.abort();
    this.controller = undefined;
    this.observer?.disconnect();
    this.image = undefined;
    this.context = undefined;
    this.elapsed = 0;
    this.frameIndex = -1;
    if (this.canvas) this.canvas.hidden = true;
    const poster = this.querySelector('[data-horse-run-poster]');
    if (poster instanceof SVGElement) poster.removeAttribute('hidden');
  }

  private async play(signal: AbortSignal) {
    if (!this.playButton || this.motion?.matches || signal.aborted) return;
    const playbackId = ++this.playbackId;
    this.playButton.disabled = true;
    this.message('読み込み中');
    try {
      if (!this.image) {
        const image = new Image();
        image.decoding = 'async';
        image.src = this.dataset.horseRunSource ?? '';
        await image.decode();
        if (signal.aborted) return;
        const context = this.canvas?.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');
        this.context = context;
        this.image = image;
      }
      if (signal.aborted || playbackId !== this.playbackId || this.motion?.matches || document.hidden || !this.visible) {
        this.message(this.motion?.matches ? 'モーション軽減設定に合わせて静止表示しています。' : this.pausedMessage());
        return;
      }
      this.startedAt = performance.now() - this.elapsed;
      this.setPlaying(true);
      this.message('再生中');
      this.animation = requestAnimationFrame(this.tick);
    } catch {
      if (!signal.aborted) this.message('再生できませんでした。「再生する」で再試行できます。');
    } finally {
      if (!signal.aborted) this.playButton.disabled = this.motion?.matches ?? false;
    }
  }

  private tick = (now: number) => {
    this.elapsed = now - this.startedAt;
    this.draw(this.elapsed);
    this.animation = requestAnimationFrame(this.tick);
  };

  private pause() {
    this.playbackId += 1;
    if (this.animation !== undefined) {
      cancelAnimationFrame(this.animation);
      this.animation = undefined;
      this.elapsed = performance.now() - this.startedAt;
      this.message(this.pausedMessage());
    }
    this.setPlaying(false);
  }

  private setPlaying(playing: boolean) {
    this.playButton?.toggleAttribute('data-horse-run-playing', playing);
    this.playButton?.setAttribute('aria-pressed', playing ? 'true' : 'false');
    if (this.playLabel) this.playLabel.textContent = playing ? '一時停止' : '再生する';
  }

  private draw(elapsed: number) {
    if (!this.context || !this.canvas || !this.image) return;
    let time = elapsed % cycleDuration;
    let index = 0;
    for (let i = 0; i < runCycle.length; i++) {
      index = i;
      if (time < runCycle[i].durationMs) break;
      time -= runCycle[i].durationMs;
    }
    if (this.frameIndex === index) return;
    this.frameIndex = index;
    const frame = runCycle[index];
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.image, frame.atlasX, frame.atlasY, frame.atlasWidth,
      frame.atlasHeight, 0, 0, this.canvas.width, this.canvas.height);
    this.canvas.hidden = false;
    const poster = this.querySelector('[data-horse-run-poster]');
    if (poster instanceof SVGElement) poster.setAttribute('hidden', '');
  }

  private pausedMessage() {
    return this.elapsed === 0 ? '先頭で停止中' : '途中で停止中';
  }

  private message(text: string) {
    if (this.status) this.status.textContent = text;
  }
}

export function defineHorseRunDemo() {
  if (!customElements.get('horse-run-demo')) customElements.define('horse-run-demo', HorseRunDemo);
}
