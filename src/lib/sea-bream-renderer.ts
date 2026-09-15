import { GLITCH_SEQUENCE, drawMosaicImage, glitchFromAge, type Glitch } from './mosaic-glitch.ts';
import { seaBreamPose, spriteScale } from './sea-bream-sprites.ts';
import type { SeaBream, SeaBreamSimulation } from './sea-bream-simulation.ts';

export function drawSeaBreamSchool(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  atlas: HTMLImageElement,
  simulation: SeaBreamSimulation,
) {
  context.clearRect(0, 0, simulation.width, simulation.height);

  const glitches = simulation.school.map((fish) =>
    glitchFromAge(simulation.elapsed - fish.glitchAt, GLITCH_SEQUENCE),
  );

  /* Back to front, so the resident fish passes in front of its duplicates. */
  for (let index = simulation.school.length - 1; index >= 0; index -= 1) {
    const fish = simulation.school[index];
    const glitch = glitches[index];
    if (!fish || !glitch) continue;
    drawSeaBream(context, mosaic, atlas, fish, glitch);
  }
}

function drawSeaBream(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  atlas: HTMLImageElement,
  fish: SeaBream,
  glitch: Glitch,
) {
  if (!mosaic) return;

  const clip = seaBreamPose(fish);
  const scale = fish.scale * spriteScale;
  const drawnWidth = clip.width * scale;
  const drawnHeight = clip.height * scale;

  context.save();
  context.translate(fish.x, fish.y);
  context.rotate(fish.pitch);
  if (clip.flip) context.scale(-1, 1);

  drawMosaicImage(
    context,
    mosaic,
    atlas,
    clip.x,
    clip.y,
    clip.width,
    clip.height,
    -clip.anchorX * scale,
    -clip.anchorY * scale,
    drawnWidth,
    drawnHeight,
    glitch,
  );
  context.restore();
}
