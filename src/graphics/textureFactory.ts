import Phaser from "phaser";

/**
 * Bake a Phaser.GameObjects.Graphics into a static texture identified by `key`.
 * The graphics object is destroyed afterwards.
 *
 * Drawing happens in the texture's pixel space: (0,0) is the top-left,
 * (width,height) is the bottom-right. Callers that prefer center-relative
 * drawing should add (width/2, height/2) to their coordinates.
 */
export function bakeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: Phaser.GameObjects.Graphics, cx: number, cy: number) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g, width / 2, height / 2);
  g.generateTexture(key, width, height);
  g.destroy();
}
