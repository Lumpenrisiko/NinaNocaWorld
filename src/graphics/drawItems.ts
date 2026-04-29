import Phaser from "phaser";
import { ITEMS, getItemDef } from "../data/items";
import { TextureKeys } from "../data/outfits";
import { bakeTexture } from "./textureFactory";
import { OUTLINE, shade } from "./colorUtils";

const FURNITURE_BASE = 0xa37d4e;
const WOOD_DARK = 0x6b4e2c;
const FOOD_HIGHLIGHT = 0xfff4d6;

type ItemDrawer = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
) => void;

const drawers: Record<string, ItemDrawer> = {
  sofa(g, _cx, _cy, w, h) {
    const baseColor = 0xc88a5a;
    const cushionColor = shade(baseColor, 1.05);
    const accent = shade(baseColor, 0.7);

    g.lineStyle(2, OUTLINE, 0.85);

    // Backrest (top half)
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(2, 2, w - 4, h * 0.55, 14);
    g.strokeRoundedRect(2, 2, w - 4, h * 0.55, 14);

    // Seat base (bottom half)
    g.fillRoundedRect(2, h * 0.45, w - 4, h * 0.45, 10);
    g.strokeRoundedRect(2, h * 0.45, w - 4, h * 0.45, 10);

    // Armrests
    g.fillStyle(accent, 1);
    g.fillRoundedRect(0, h * 0.35, 14, h * 0.55, 6);
    g.fillRoundedRect(w - 14, h * 0.35, 14, h * 0.55, 6);
    g.strokeRoundedRect(0, h * 0.35, 14, h * 0.55, 6);
    g.strokeRoundedRect(w - 14, h * 0.35, 14, h * 0.55, 6);

    // Cushions on seat
    const cushW = (w - 32) / 3;
    g.fillStyle(cushionColor, 1);
    for (let i = 0; i < 3; i++) {
      const x = 16 + i * cushW;
      g.fillRoundedRect(x + 2, h * 0.5 + 2, cushW - 4, h * 0.3, 6);
      g.strokeRoundedRect(x + 2, h * 0.5 + 2, cushW - 4, h * 0.3, 6);
    }

    // Legs
    g.fillStyle(WOOD_DARK, 1);
    g.fillRect(8, h - 4, 6, 4);
    g.fillRect(w - 14, h - 4, 6, 4);
  },

  bed(g, _cx, _cy, w, h) {
    const frame = WOOD_DARK;
    const mattress = 0xf5e8d0;
    const pillow = 0xffffff;
    const blanket = 0x6e9bd4;

    g.lineStyle(2, OUTLINE, 0.9);

    // Headboard (left third)
    g.fillStyle(frame, 1);
    g.fillRoundedRect(0, 6, w * 0.18, h - 8, 6);
    g.strokeRoundedRect(0, 6, w * 0.18, h - 8, 6);

    // Mattress
    g.fillStyle(mattress, 1);
    g.fillRoundedRect(w * 0.16, h * 0.35, w * 0.82, h * 0.55, 8);
    g.strokeRoundedRect(w * 0.16, h * 0.35, w * 0.82, h * 0.55, 8);

    // Pillow
    g.fillStyle(pillow, 1);
    g.fillRoundedRect(w * 0.2, h * 0.4, w * 0.18, h * 0.32, 6);
    g.strokeRoundedRect(w * 0.2, h * 0.4, w * 0.18, h * 0.32, 6);

    // Blanket
    g.fillStyle(blanket, 1);
    g.fillRoundedRect(w * 0.42, h * 0.4, w * 0.55, h * 0.5, 6);
    g.strokeRoundedRect(w * 0.42, h * 0.4, w * 0.55, h * 0.5, 6);

    // Stripes on blanket
    g.fillStyle(shade(blanket, 0.75), 1);
    for (let i = 0; i < 3; i++) {
      g.fillRect(w * 0.45 + i * 22, h * 0.45, 4, h * 0.4);
    }

    // Legs
    g.fillStyle(frame, 1);
    g.fillRect(6, h - 4, 8, 4);
    g.fillRect(w - 14, h - 4, 8, 4);
  },

  table(g, _cx, _cy, w, h) {
    const top = 0xb98c5a;
    const dark = WOOD_DARK;

    g.lineStyle(2, OUTLINE, 0.9);

    // Tabletop
    g.fillStyle(top, 1);
    g.fillRoundedRect(2, 4, w - 4, h * 0.3, 8);
    g.strokeRoundedRect(2, 4, w - 4, h * 0.3, 8);

    // Front legs
    g.fillStyle(dark, 1);
    g.fillRect(10, h * 0.32, 8, h * 0.66);
    g.fillRect(w - 18, h * 0.32, 8, h * 0.66);
    g.strokeRect(10, h * 0.32, 8, h * 0.66);
    g.strokeRect(w - 18, h * 0.32, 8, h * 0.66);

    // Back legs (slightly inset, suggested with darker shade)
    g.fillStyle(shade(dark, 0.7), 1);
    g.fillRect(22, h * 0.32, 6, h * 0.5);
    g.fillRect(w - 28, h * 0.32, 6, h * 0.5);
  },

  apple(g, cx, cy, _w, h) {
    const r = (h / 2) * 0.85;
    const body = 0xd9534f;

    // Body
    g.fillStyle(body, 1);
    g.lineStyle(2, OUTLINE, 0.85);
    g.fillCircle(cx, cy + 3, r);
    g.strokeCircle(cx, cy + 3, r);

    // Highlight
    g.fillStyle(FOOD_HIGHLIGHT, 0.65);
    g.fillEllipse(cx - r * 0.4, cy - r * 0.2, r * 0.5, r * 0.3);

    // Stem
    g.fillStyle(WOOD_DARK, 1);
    g.fillRoundedRect(cx - 1.5, cy - r - 4, 3, 7, 1);

    // Leaf
    g.fillStyle(0x6abf69, 1);
    g.lineStyle(1.5, OUTLINE, 0.8);
    g.beginPath();
    g.arc(cx + 6, cy - r - 1, 6, Math.PI * 0.55, Math.PI * 1.55, false);
    g.closePath();
    g.fillPath();
    g.strokePath();
  },

  bread(g, cx, cy, w, _h) {
    const body = 0xd6a86a;
    const dark = shade(body, 0.65);

    g.fillStyle(body, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillEllipse(cx, cy + 2, w - 8, 28);
    g.strokeEllipse(cx, cy + 2, w - 8, 28);

    // Crust accents
    g.lineStyle(1.5, dark, 0.9);
    for (let i = -2; i <= 2; i++) {
      const x = cx + i * 7;
      g.lineBetween(x - 4, cy - 6, x + 4, cy + 4);
    }

    // Highlight
    g.fillStyle(FOOD_HIGHLIGHT, 0.5);
    g.fillEllipse(cx - 6, cy - 6, 14, 5);
  },

  ball(g, cx, cy, _w, h) {
    const r = (h / 2) * 0.9;
    const a = 0xff6b6b;
    const b = 0x4ecdc4;

    g.fillStyle(a, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillCircle(cx, cy, r);
    g.strokeCircle(cx, cy, r);

    // Stripe band
    g.fillStyle(b, 1);
    g.fillRect(cx - r, cy - r * 0.25, r * 2, r * 0.5);
    // Re-stroke circle so the band stays inside the outline
    g.lineStyle(2, OUTLINE, 0.9);
    g.strokeCircle(cx, cy, r);

    // Highlight
    g.fillStyle(FOOD_HIGHLIGHT, 0.6);
    g.fillEllipse(cx - r * 0.4, cy - r * 0.4, r * 0.55, r * 0.35);
  },

  teddy(g, cx, cy, _w, h) {
    const fur = FURNITURE_BASE;
    const inner = shade(fur, 1.2);

    g.lineStyle(2, OUTLINE, 0.85);

    // Body
    g.fillStyle(fur, 1);
    g.fillRoundedRect(cx - 22, cy - 4, 44, h * 0.55, 14);
    g.strokeRoundedRect(cx - 22, cy - 4, 44, h * 0.55, 14);

    // Belly
    g.fillStyle(inner, 1);
    g.fillEllipse(cx, cy + 14, 26, 22);

    // Head
    g.fillStyle(fur, 1);
    g.fillCircle(cx, cy - 18, 18);
    g.strokeCircle(cx, cy - 18, 18);

    // Ears
    g.fillCircle(cx - 14, cy - 28, 7);
    g.fillCircle(cx + 14, cy - 28, 7);
    g.strokeCircle(cx - 14, cy - 28, 7);
    g.strokeCircle(cx + 14, cy - 28, 7);
    g.fillStyle(inner, 1);
    g.fillCircle(cx - 14, cy - 28, 4);
    g.fillCircle(cx + 14, cy - 28, 4);

    // Snout
    g.fillStyle(inner, 1);
    g.fillEllipse(cx, cy - 14, 14, 9);
    g.lineStyle(1.5, OUTLINE, 0.8);
    g.strokeEllipse(cx, cy - 14, 14, 9);

    // Eyes + nose
    g.fillStyle(0x1b1f3b, 1);
    g.fillCircle(cx - 6, cy - 22, 2);
    g.fillCircle(cx + 6, cy - 22, 2);
    g.fillCircle(cx, cy - 16, 2);

    // Arms (small stubs at the sides)
    g.fillStyle(fur, 1);
    g.lineStyle(2, OUTLINE, 0.85);
    g.fillRoundedRect(cx - 28, cy + 4, 8, 16, 4);
    g.fillRoundedRect(cx + 20, cy + 4, 8, 16, 4);
    g.strokeRoundedRect(cx - 28, cy + 4, 8, 16, 4);
    g.strokeRoundedRect(cx + 20, cy + 4, 8, 16, 4);
  },
};

export function bakeItemTextures(scene: Phaser.Scene): void {
  for (const id of Object.keys(ITEMS)) {
    const def = getItemDef(id);
    const drawer = drawers[id];
    if (!drawer) {
      // Fallback: just a labelled rectangle so missing drawers stay visible.
      bakeTexture(scene, TextureKeys.item(id), def.size.x, def.size.y, (g) => {
        g.fillStyle(0xcccccc, 1);
        g.fillRoundedRect(0, 0, def.size.x, def.size.y, 6);
        g.lineStyle(2, OUTLINE, 0.9);
        g.strokeRoundedRect(0, 0, def.size.x, def.size.y, 6);
      });
      continue;
    }
    bakeTexture(scene, TextureKeys.item(id), def.size.x, def.size.y, (g, cx, cy) =>
      drawer(g, cx, cy, def.size.x, def.size.y),
    );
  }
}
