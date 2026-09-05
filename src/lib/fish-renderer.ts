import { drawMosaicImage, glitchFromAge, type Glitch } from './mosaic-glitch';
import { clipSets, swimClipIndex, type FishKind } from './fish-sprites';
import { GLITCH_SEQUENCE, type Fish, type FishSimulation } from './fish-simulation';

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
  const clip = clipSets[fish.config.kind][swimClipIndex(fish.swimPhase)];
  if (!context || !sheet || !clip) return;

  const drawnWidth = clip.width * fish.scale;
  const drawnHeight = clip.height * fish.scale;
  const drawX = -clip.headX * fish.scale;
  const drawY = -clip.headY * fish.scale;

  context.save();
  context.translate(fish.x, fish.y);
  /* The sheet faces right, so swimming left is a flip around the eye. */
  if (fish.heading < 0) context.scale(-1, 1);

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
