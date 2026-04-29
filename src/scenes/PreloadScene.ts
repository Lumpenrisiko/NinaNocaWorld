import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { bakeCharacterTextures } from "../graphics/drawCharacter";
import { bakeItemTextures } from "../graphics/drawItems";
import { bakeRoomTextures } from "../graphics/drawRoom";

/**
 * Bakes all "core" textures (characters, items, rooms) procedurally via
 * Phaser Graphics. Phase 3 has no remote assets to load — the time spent
 * is the synchronous baking, not network I/O.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
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
