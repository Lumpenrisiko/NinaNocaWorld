import Phaser from "phaser";
import type { LocationDefinition } from "../data/locations/types";

/**
 * In Phase 1 lädt der Loader nichts (Platzhalter sind Rechtecke).
 * Die Schnittstelle ist aber so geschnitten, dass Phase 3 hier ein Manifest
 * via scene.load.atlas/image laden kann, ohne dass die LocationScene sich ändert.
 */
export const LocationLoader = {
  async ensureLoaded(scene: Phaser.Scene, location: LocationDefinition): Promise<void> {
    if (!location.assetManifestPath) return;

    return new Promise((resolve, reject) => {
      // Phase 3+: scene.load.atlas(...), scene.load.image(...) je manifest.
      // Slice: nichts zu tun.
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) =>
        reject(new Error(`Failed to load ${file.key}`)),
      );
      if (scene.load.totalToLoad === 0) resolve();
      else scene.load.start();
    });
  },
};
