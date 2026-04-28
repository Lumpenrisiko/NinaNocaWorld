import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";

/**
 * In Phase 1 gibt es keine echten Assets zu laden — wir simulieren einen
 * Progress-Pass für ~400 ms, damit der spätere LocationLoader denselben
 * Hookpoint nutzen kann.
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

    this.add
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

    this.tweens.add({
      targets: fill,
      width: barWidth,
      duration: 400,
      ease: "Sine.easeOut",
      onComplete: () => this.startGame(),
    });
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
