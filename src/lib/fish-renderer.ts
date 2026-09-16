import { GLITCH_SEQUENCE, drawMosaicImage, glitchFromAge, type Glitch } from './mosaic-glitch.ts';
import { fishPose, spriteScale } from './fish-sprites.ts';
import type { Fish, FishSimulation } from './fish-simulation.ts';

export function drawFishSchool(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  atlas: HTMLImageElement,
  simulation: FishSimulation,
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
    drawFish(context, mosaic, atlas, fish, glitch);
  }
}

function drawFish(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  atlas: HTMLImageElement,
  fish: Fish,
  glitch: Glitch,
) {
  if (!mosaic) return;

  const clip = fishPose(fish);
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
