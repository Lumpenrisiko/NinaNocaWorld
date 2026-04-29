import Phaser from "phaser";
import type { OutfitState } from "../state/types";
import { CHARACTER_CANVAS, TextureKeys } from "../data/outfits";

/**
 * Composite character built from five baked-texture layers (skin/base,
 * bottom, top, shoes, hair) sharing one canvas size so they stack
 * pixel-perfectly. applyOutfit just swaps each layer's texture.
 *
 * Layer order (bottom → top in z):
 *   skin → bottom → top → shoes → hair
 */
export class Character extends Phaser.GameObjects.Container {
  static readonly SIZE = CHARACTER_CANVAS;

  private skinLayer!: Phaser.GameObjects.Image;
  private bottomLayer!: Phaser.GameObjects.Image;
  private topLayer!: Phaser.GameObjects.Image;
  private shoesLayer!: Phaser.GameObjects.Image;
  private hairLayer!: Phaser.GameObjects.Image;
  private nameTag!: Phaser.GameObjects.Text;
  private activeRing!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, displayName: string) {
    super(scene, x, y);

    this.activeRing = scene.add
      .rectangle(0, 0, Character.SIZE.w + 10, Character.SIZE.h + 10, 0xffffff, 0)
      .setStrokeStyle(4, 0xffffff, 0);
    this.add(this.activeRing);

    this.skinLayer = scene.add.image(0, 0, TextureKeys.skin("light"));
    this.bottomLayer = scene.add.image(0, 0, TextureKeys.bottom("jeans"));
    this.topLayer = scene.add.image(0, 0, TextureKeys.top("redshirt"));
    this.shoesLayer = scene.add.image(0, 0, TextureKeys.shoes("sneakers"));
    this.hairLayer = scene.add.image(0, 0, TextureKeys.hair("short"));

    this.add([this.skinLayer, this.bottomLayer, this.topLayer, this.shoesLayer, this.hairLayer]);

    this.nameTag = scene.add
      .text(0, -Character.SIZE.h / 2 - 10, displayName, {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#1b1f3b",
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      })
      .setOrigin(0.5);
    this.add(this.nameTag);

    this.setSize(Character.SIZE.w, Character.SIZE.h);

    scene.add.existing(this);
  }

  applyOutfit(outfit: OutfitState): void {
    this.skinLayer.setTexture(TextureKeys.skin(outfit.skinTone));
    this.bottomLayer.setTexture(TextureKeys.bottom(outfit.bottom));
    this.topLayer.setTexture(TextureKeys.top(outfit.top));
    this.shoesLayer.setTexture(TextureKeys.shoes(outfit.shoes));
    this.hairLayer.setTexture(TextureKeys.hair(outfit.hair));
  }

  showActiveMarker(active: boolean): this {
    this.activeRing.setStrokeStyle(active ? 4 : 0, 0xffffff, active ? 1 : 0);
    return this;
  }

  setDisplayName(name: string): this {
    this.nameTag.setText(name);
    return this;
  }
}
