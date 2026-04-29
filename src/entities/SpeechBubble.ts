import Phaser from "phaser";

/**
 * One-shot speech bubble. Pops in above (x, y), holds, then floats up and
 * fades out, destroying itself when done.
 *
 * The (x, y) supplied is where the bubble's TAIL points — typically just
 * above a character's head.
 */
export class SpeechBubble extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, emoji: string) {
    super(scene, x, y);

    const text = scene.add
      .text(0, -22, emoji, { fontSize: "30px" })
      .setOrigin(0.5);

    const padX = 10;
    const padY = 6;
    const bgW = Math.max(48, text.width + padX * 2);
    const bgH = text.height + padY * 2;

    const bg = scene.add
      .rectangle(0, -22, bgW, bgH, 0xffffff, 0.95)
      .setStrokeStyle(2, 0x1b1f3b, 0.9);

    // Tail pointing down toward (x, y)
    const tail = scene.add
      .triangle(0, -22 + bgH / 2 + 4, -7, 0, 7, 0, 0, 8, 0xffffff, 0.95)
      .setStrokeStyle(2, 0x1b1f3b, 0.9);

    this.add([bg, tail, text]);
    this.setDepth(2000);
    scene.add.existing(this);

    this.setScale(0.4);
    this.setAlpha(0);

    scene.tweens.chain({
      targets: this,
      tweens: [
        { scale: 1, alpha: 1, duration: 180, ease: "Back.easeOut" },
        { duration: 1300 },
        { alpha: 0, y: y - 36, duration: 380, ease: "Sine.easeIn" },
      ],
      onComplete: () => this.destroy(),
    });
  }
}
