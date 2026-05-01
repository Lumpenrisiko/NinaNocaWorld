import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { bakeCharacterTextures } from "../graphics/drawCharacter";
import { bakeItemTextures } from "../graphics/drawItems";
import { bakeRoomTextures } from "../graphics/drawRoom";
import { ASSET_MANIFEST, validateManifest } from "../data/assetManifest";

/**
 * Two-stage texture pipeline:
 *
 *   1. preload(): registers any SVG overrides from ASSET_MANIFEST.
 *      Phaser rasters them at the configured width/height during the
 *      built-in loader phase.
 *
 *   2. create(): runs the procedural bake* functions. Each one early-exits
 *      when its texture key already exists, so the SVG-loaded keys are
 *      preserved and only the gaps get drawn.
 *
 * This means there's exactly one place to override art ("drop a file +
 * add an entry to ASSET_MANIFEST"), and the procedural pipeline keeps
 * everything covered while you migrate.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload(): void {
    const stale = validateManifest();
    if (stale.length > 0) {
      console.warn("[ASSET_MANIFEST] entries reference unknown texture keys:", stale);
    }
    for (const entry of ASSET_MANIFEST) {
      this.load.svg(entry.key, entry.path, { width: entry.width, height: entry.height });
    }
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add
      .text(cx, cy - 60, "NinaNocaWorld", {
        fontSize: "44px",
        fontFamily: "system-ui, sans-serif",
        color: "#f6c177",
      })
      .setOrigin(0.5);

    const status = this.add
      .text(cx, cy - 18, "lädt …", {
        fontSize: "18px",
        color: "#9aa0c0",
      })
      .setOrigin(0.5);

    const barWidth = 360;
    const barHeight = 18;
    const barX = cx - barWidth / 2;
    const barY = cy + 20;

    const frame = this.add.rectangle(cx, barY + barHeight / 2, barWidth + 6, barHeight + 6);
    frame.setStrokeStyle(2, COLORS.textDim);

    const fill = this.add.rectangle(barX, barY, 0, barHeight, COLORS.accent).setOrigin(0, 0);

    // Synchronous baking is fast (<200 ms total in dev). We still update
    // the bar in steps so the player sees something move.
    const steps: Array<{ label: string; run: () => void }> = [
      { label: "Charaktere zeichnen …", run: () => bakeCharacterTextures(this) },
      { label: "Möbel zeichnen …", run: () => bakeItemTextures(this) },
      { label: "Räume zeichnen …", run: () => bakeRoomTextures(this) },
    ];

    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        status.setText("Fertig.");
        this.tweens.add({
          targets: fill,
          width: barWidth,
          duration: 120,
          ease: "Sine.easeOut",
          onComplete: () => this.startGame(),
        });
        return;
      }
      const step = steps[i]!;
      status.setText(step.label);
      this.tweens.add({
        targets: fill,
        width: ((i + 1) / (steps.length + 1)) * barWidth,
        duration: 80,
        ease: "Linear",
        onComplete: () => {
          step.run();
          i++;
          this.time.delayedCall(20, tick);
        },
      });
    };
    tick();
  }

  private startGame(): void {
    const snap = GameState.snapshot;
    this.scene.start("Location", {
      locationId: snap.activeLocationId,
      roomId: snap.activeRoomId,
    });
    this.scene.launch("UI");
  }
}
