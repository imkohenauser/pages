export interface Glitch {
  mosaicPx: number;
  dissolve: number;
  scatter: number;
  chromaPx: number;
}

export interface GlitchStep extends Glitch {
  until: number;
}

export const GLITCH_REST: Glitch = {
  mosaicPx: 0,
  dissolve: 0,
  scatter: 0,
  chromaPx: 0,
};

const MIN_MOSAIC_CELLS = 3;

export function glitchFromAge(age: number, sequence: readonly GlitchStep[]): Glitch {
  if (age < 0) return GLITCH_REST;
  for (const step of sequence) {
    if (age < step.until) return step;
  }
  return GLITCH_REST;
}

export function mosaicCells(drawnPx: number, mosaicPx: number) {
  if (mosaicPx <= 0) return 1;
  return Math.max(MIN_MOSAIC_CELLS, Math.round(drawnPx / mosaicPx));
}

export interface CoverSourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/* Matches object-fit: cover with object-position: center. */
export function coverSourceRect(
  srcWidth: number,
  srcHeight: number,
  destWidth: number,
  destHeight: number,
): CoverSourceRect {
  const scale = Math.max(destWidth / srcWidth, destHeight / srcHeight);
  const sw = destWidth / scale;
  const sh = destHeight / scale;
  return {
    sx: (srcWidth - sw) / 2,
    sy: (srcHeight - sh) / 2,
    sw,
    sh,
  };
}

export function drawMosaicImage(
  context: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  glitch: Glitch,
) {
  if (glitch.mosaicPx <= 0) {
    context.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  const scratchContext = scratch.getContext('2d');
  if (!scratchContext) {
    context.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }

  const cellsX = mosaicCells(dw, glitch.mosaicPx);
  const cellsY = mosaicCells(dh, glitch.mosaicPx);
  scratch.width = cellsX;
  scratch.height = cellsY;
  scratchContext.imageSmoothingEnabled = true;
  scratchContext.clearRect(0, 0, cellsX, cellsY);
  scratchContext.drawImage(source, sx, sy, sw, sh, 0, 0, cellsX, cellsY);
  ditherMosaic(scratchContext, cellsX, cellsY, glitch.dissolve, glitch.scatter);

  context.imageSmoothingEnabled = false;
  if (glitch.chromaPx > 0) {
    context.globalAlpha = 0.45;
    context.drawImage(scratch, dx + glitch.chromaPx, dy, dw, dh);
    context.drawImage(scratch, dx - glitch.chromaPx, dy, dw, dh);
    context.globalAlpha = 1;
  }
  context.drawImage(scratch, dx, dy, dw, dh);
  context.imageSmoothingEnabled = true;
}

function fract(value: number) {
  return value - Math.floor(value);
}

function bayer2(x: number, y: number) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  return fract(cellX * 0.5 + cellY * cellY * 0.75);
}

function bayer4(x: number, y: number) {
  return (bayer2(x * 0.5, y * 0.5) * 0.25 + bayer2(x, y)) * (16 / 15);
}

/* Ordered dither on the mosaic cells themselves, matching the gate's cell dropout. */
function ditherMosaic(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dissolve: number,
  scatter: number,
) {
  if (dissolve <= 0 && scatter <= 0) return;

  const image = context.getImageData(0, 0, width, height);
  const { data } = image;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha === undefined || alpha === 0) continue;

      if (dissolve > 0 && bayer4(x, y) < dissolve) {
        data[index + 3] = 0;
        continue;
      }

      const grade = bayer4(y + 1, x + 3);
      data[index + 3] = Math.round(alpha * (1 - scatter + scatter * grade));
    }
  }
  context.putImageData(image, 0, 0);
}
