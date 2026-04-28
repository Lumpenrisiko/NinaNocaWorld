import Phaser from "phaser";
import type { OutfitState } from "../state/types";
import { OutfitCatalog } from "../data/outfits";

/**
 * Layered character placeholder. Real assets in Phase 3 swap each layer's
 * Rectangle for a Sprite/Image without changing this structure.
 *
 * Visual layout (origin = container x/y), bottom-up:
 *   feet:    y +60 .. +75   (shoes)
 *   legs:    y +25 .. +60   (bottom + skin)
 *   torso:   y -15 .. +25   (top + skin arms)
 *   head:    y -55 .. -15   (skin)
 *   hair:    on/around head, varies per style
 */
export class Character extends Phaser.GameObjects.Container {
  static readonly SIZE = { w: 80, h: 150 };

  private skin!: Phaser.GameObjects.Rectangle;
  private head!: Phaser.GameObjects.Rectangle;
  private bottomLayer!: Phaser.GameObjects.Rectangle;
  private topLayer!: Phaser.GameObjects.Rectangle;
  private leftShoe!: Phaser.GameObjects.Rectangle;
  private rightShoe!: Phaser.GameObjects.Rectangle;
  private hair!: Phaser.GameObjects.Rectangle;
  private nameTag!: Phaser.GameObjects.Text;
  private activeRing!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, displayName: string) {
    super(scene, x, y);

    this.activeRing = scene.add
      .rectangle(0, 0, Character.SIZE.w + 14, Character.SIZE.h + 14, 0xffffff, 0)
      .setStrokeStyle(4, 0xffffff, 0);
    this.add(this.activeRing);

    // Body skin column
    this.skin = scene.add.rectangle(0, 5, 50, 110, 0xffffff);
    this.add(this.skin);

    // Bottom (covers legs portion)
    this.bottomLayer = scene.add.rectangle(0, 38, 54, 40, 0xffffff);
    this.add(this.bottomLayer);

    // Top (torso)
    this.topLayer = scene.add.rectangle(0, -2, 60, 40, 0xffffff);
    this.add(this.topLayer);

    // Shoes
    this.leftShoe = scene.add.rectangle(-14, 64, 22, 12, 0xffffff);
    this.rightShoe = scene.add.rectangle(14, 64, 22, 12, 0xffffff);
    this.add(this.leftShoe);
    this.add(this.rightShoe);

    // Head sits on top of torso skin
    this.head = scene.add.rectangle(0, -42, 46, 46, 0xffffff);
    this.head.setStrokeStyle(2, 0x000000, 0.25);
    this.add(this.head);

    // Hair – position/size varies per option (set in applyOutfit).
    this.hair = scene.add.rectangle(0, -56, 1, 1, 0xffffff);
    this.add(this.hair);

    this.nameTag = scene.add
      .text(0, -Character.SIZE.h / 2 - 14, displayName, {
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
    const skin = OutfitCatalog.skin(outfit.skinTone);
    this.skin.setFillStyle(skin.color);
    this.head.setFillStyle(skin.color);

    const top = OutfitCatalog.top(outfit.top);
    this.topLayer.setFillStyle(top.color);

    const bottom = OutfitCatalog.bottom(outfit.bottom);
    this.bottomLayer.setFillStyle(bottom.color);

    const shoes = OutfitCatalog.shoes(outfit.shoes);
    this.leftShoe.setFillStyle(shoes.color);
    this.rightShoe.setFillStyle(shoes.color);

    const hair = OutfitCatalog.hair(outfit.hair);
    this.hair.setSize(hair.width, hair.height);
    this.hair.setFillStyle(hair.color);
    // Hair anchor: rests on top of head (head top edge ≈ y = -65), grows up.
    this.hair.setPosition(0, -65 + hair.offsetY - hair.height / 2);
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
