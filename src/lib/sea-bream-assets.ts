const ATLAS_PATH = 'sprite-sheet/pagrus-major-motion.webp';

let atlasRequest: Promise<HTMLImageElement> | undefined;

/**
 * Shares one decode across every instance and reconnection. Without this, re-entering the
 * observer before the first decode settles starts a second request for the same atlas.
 */
export function loadSeaBreamAtlas() {
  if (!atlasRequest) {
    const atlas = new Image();
    atlas.decoding = 'async';
    // The atlas is below the fold; it must not compete with the images of the first screen.
    atlas.fetchPriority = 'low';
    atlas.src = `${import.meta.env.BASE_URL}${ATLAS_PATH}`;
    atlasRequest = atlas.decode().then(
      () => atlas,
      (error: unknown) => {
        atlasRequest = undefined;
        throw error;
      },
    );
  }
  return atlasRequest;
}
