import { GLITCH_SEQUENCE, drawMosaicImage, glitchFromAge, type Glitch } from './mosaic-glitch';
import { fishPose, spriteScale, type FishKind } from './fish-sprites';
import type { Fish, FishSimulation } from './fish-simulation';

export function drawFishSchool(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  sheets: Record<FishKind, HTMLImageElement>,
  simulation: FishSimulation,
) {
  context.clearRect(0, 0, simulation.width, simulation.height);

  const glitches = simulation.school.map((fish) =>
    glitchFromAge(simulation.elapsed - fish.glitchAt, GLITCH_SEQUENCE),
  );

  /* Smallest first, so the nearer fish pass in front. */
  for (let index = simulation.school.length - 1; index >= 0; index -= 1) {
    const fish = simulation.school[index];
    const glitch = glitches[index];
    if (!fish || !glitch) continue;
    drawFish(context, mosaic, sheets, fish, glitch);
  }
}

function drawFish(
  context: CanvasRenderingContext2D,
  mosaic: HTMLCanvasElement | undefined,
  sheets: Record<FishKind, HTMLImageElement>,
  fish: Fish,
  glitch: Glitch,
) {
  const sheet = sheets[fish.config.kind];
  const clip = fishPose(fish);
  if (!context || !sheet || !clip) return;

  const scale = fish.scale * spriteScale[fish.config.kind];
  const drawnWidth = clip.width * scale;
  const drawnHeight = clip.height * scale;
  const drawX = -clip.anchorX * scale;
  const drawY = -clip.anchorY * scale;

  context.save();
  context.translate(fish.x, fish.y);
  context.rotate(fish.pitch);
  if (clip.flip) context.scale(-1, 1);

  if (!mosaic) {
    context.restore();
    return;
  }

  drawMosaicImage(
    context,
    mosaic,
    sheet,
    clip.x,
    clip.y,
    clip.width,
    clip.height,
    drawX,
    drawY,
    drawnWidth,
    drawnHeight,
    glitch,
  );
  context.restore();
}
