import Phaser from "phaser";
import { ITEMS, getItemDef } from "../data/items";
import { TextureKeys } from "../data/outfits";
import { bakeTexture } from "./textureFactory";
import { OUTLINE, shade } from "./colorUtils";

const WOOD_DARK = 0x6b4e2c;
const FOOD_HIGHLIGHT = 0xfff4d6;

type ItemDrawer = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
) => void;

/**
 * Soft ground shadow at the bottom of an item texture, drawn before the
 * item itself so the item sits "on" it. Uses (cx, near-bottom) so the
 * shadow lines up with whatever rests on the floor in-scene.
 */
function groundShadow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  bottomY: number,
  width: number,
  alpha = 0.22,
): void {
  g.fillStyle(0x000000, alpha);
  g.fillEllipse(cx, bottomY - 2, width, 8);
}

const drawers: Record<string, ItemDrawer> = {
  sofa(g, cx, _cy, w, h) {
    const baseColor = 0xe07a5f; // warm coral, more Toca-saturated
    const cushionColor = shade(baseColor, 1.12);
    const cushionDark = shade(baseColor, 0.78);
    const accent = shade(baseColor, 0.7);
    const accentLight = shade(accent, 1.15);

    groundShadow(g, cx, h, w * 0.85, 0.22);
    g.lineStyle(2, OUTLINE, 0.9);

    // Backrest (top half)
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(2, 2, w - 4, h * 0.55, 14);
    g.strokeRoundedRect(2, 2, w - 4, h * 0.55, 14);

    // Backrest highlight (top sheen)
    g.fillStyle(cushionColor, 0.55);
    g.fillEllipse(cx, 8, w - 28, 8);

    // Seat base (bottom half)
    g.fillRoundedRect(2, h * 0.45, w - 4, h * 0.45, 10);
    g.strokeRoundedRect(2, h * 0.45, w - 4, h * 0.45, 10);

    // Subtle seat-base shadow under cushions
    g.fillStyle(cushionDark, 0.6);
    g.fillRect(8, h * 0.78, w - 16, 4);

    // Armrests
    g.fillStyle(accent, 1);
    g.fillRoundedRect(0, h * 0.35, 14, h * 0.55, 6);
    g.fillRoundedRect(w - 14, h * 0.35, 14, h * 0.55, 6);
    g.strokeRoundedRect(0, h * 0.35, 14, h * 0.55, 6);
    g.strokeRoundedRect(w - 14, h * 0.35, 14, h * 0.55, 6);
    // Armrest top highlights
    g.fillStyle(accentLight, 0.6);
    g.fillEllipse(7, h * 0.4, 8, 3);
    g.fillEllipse(w - 7, h * 0.4, 8, 3);

    // Cushions on seat
    const cushW = (w - 32) / 3;
    for (let i = 0; i < 3; i++) {
      const x = 16 + i * cushW;
      g.fillStyle(cushionColor, 1);
      g.fillRoundedRect(x + 2, h * 0.5 + 2, cushW - 4, h * 0.3, 6);
      g.strokeRoundedRect(x + 2, h * 0.5 + 2, cushW - 4, h * 0.3, 6);
      // Cushion top sheen
      g.fillStyle(0xffffff, 0.18);
      g.fillEllipse(x + cushW / 2, h * 0.5 + 6, cushW - 14, 3);
    }

    // Stitching detail across backrest
    g.lineStyle(1, cushionDark, 0.6);
    g.lineBetween(10, h * 0.18, w - 10, h * 0.18);

    // Legs
    g.fillStyle(WOOD_DARK, 1);
    g.lineStyle(1, OUTLINE, 0.9);
    g.fillRect(8, h - 4, 6, 4);
    g.fillRect(w - 14, h - 4, 6, 4);
    g.strokeRect(8, h - 4, 6, 4);
    g.strokeRect(w - 14, h - 4, 6, 4);
  },

  bed(g, cx, _cy, w, h) {
    const frame = 0x8a5a2c; // warmer wood
    const frameLight = shade(frame, 1.2);
    const frameDark = shade(frame, 0.7);
    const mattress = 0xfaeed7;
    const pillow = 0xffffff;
    const blanket = 0x6e9bd4;
    const blanketDark = shade(blanket, 0.7);
    const blanketLight = shade(blanket, 1.18);

    groundShadow(g, cx, h, w * 0.88, 0.22);
    g.lineStyle(2, OUTLINE, 0.9);

    // Headboard with paneling detail
    g.fillStyle(frame, 1);
    g.fillRoundedRect(0, 6, w * 0.18, h - 8, 6);
    g.strokeRoundedRect(0, 6, w * 0.18, h - 8, 6);
    // Headboard light edge
    g.fillStyle(frameLight, 0.45);
    g.fillRect(2, 8, w * 0.18 - 4, 3);
    // Headboard panel line
    g.lineStyle(1, frameDark, 0.6);
    g.lineBetween(4, h * 0.4, w * 0.18 - 4, h * 0.4);

    // Mattress
    g.fillStyle(mattress, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillRoundedRect(w * 0.16, h * 0.35, w * 0.82, h * 0.55, 8);
    g.strokeRoundedRect(w * 0.16, h * 0.35, w * 0.82, h * 0.55, 8);
    // Mattress quilt seam
    g.lineStyle(1, shade(mattress, 0.85), 0.7);
    g.lineBetween(w * 0.16 + 6, h * 0.5, w * 0.97 - 6, h * 0.5);

    // Pillow with soft shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRoundedRect(w * 0.21, h * 0.42, w * 0.18, h * 0.32, 6);
    g.fillStyle(pillow, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillRoundedRect(w * 0.2, h * 0.4, w * 0.18, h * 0.32, 6);
    g.strokeRoundedRect(w * 0.2, h * 0.4, w * 0.18, h * 0.32, 6);
    // Pillow crease
    g.lineStyle(1, shade(pillow, 0.85), 0.7);
    g.beginPath();
    g.moveTo(w * 0.21, h * 0.55);
    g.lineTo(w * 0.36, h * 0.55);
    g.strokePath();

    // Blanket
    g.fillStyle(blanket, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillRoundedRect(w * 0.42, h * 0.4, w * 0.55, h * 0.5, 6);
    g.strokeRoundedRect(w * 0.42, h * 0.4, w * 0.55, h * 0.5, 6);

    // Blanket stripes (alternating dark + light for depth)
    for (let i = 0; i < 3; i++) {
      g.fillStyle(blanketDark, 0.85);
      g.fillRect(w * 0.45 + i * 22, h * 0.45, 4, h * 0.4);
      g.fillStyle(blanketLight, 0.55);
      g.fillRect(w * 0.45 + i * 22 + 6, h * 0.45, 2, h * 0.4);
    }
    // Blanket top fold highlight
    g.fillStyle(blanketLight, 0.55);
    g.fillRect(w * 0.43, h * 0.41, w * 0.53, 3);

    // Legs
    g.fillStyle(frame, 1);
    g.lineStyle(1, OUTLINE, 0.85);
    g.fillRect(6, h - 4, 8, 4);
    g.fillRect(w - 14, h - 4, 8, 4);
    g.strokeRect(6, h - 4, 8, 4);
    g.strokeRect(w - 14, h - 4, 8, 4);
  },

  table(g, cx, _cy, w, h) {
    const top = 0xc99a6b;
    const topLight = shade(top, 1.2);
    const dark = WOOD_DARK;

    groundShadow(g, cx, h, w * 0.85, 0.22);
    g.lineStyle(2, OUTLINE, 0.9);

    // Tabletop
    g.fillStyle(top, 1);
    g.fillRoundedRect(2, 4, w - 4, h * 0.3, 8);
    g.strokeRoundedRect(2, 4, w - 4, h * 0.3, 8);
    // Top sheen
    g.fillStyle(topLight, 0.6);
    g.fillEllipse(cx, 8, w - 30, 4);
    // Wood-grain hint
    g.lineStyle(1, shade(top, 0.7), 0.45);
    g.lineBetween(8, h * 0.18, w - 8, h * 0.18);
    g.lineBetween(20, h * 0.26, w - 20, h * 0.26);

    // Underside shadow (just below tabletop)
    g.fillStyle(0x000000, 0.18);
    g.fillRect(6, h * 0.32, w - 12, 4);

    // Front legs
    g.fillStyle(dark, 1);
    g.lineStyle(2, OUTLINE, 0.9);
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
    const bodyDark = shade(body, 0.7);

    groundShadow(g, cx, h, r * 1.6, 0.18);

    // Body
    g.fillStyle(body, 1);
    g.lineStyle(2, OUTLINE, 0.85);
    g.fillCircle(cx, cy + 3, r);
    g.strokeCircle(cx, cy + 3, r);

    // Bottom inner shadow (hint of roundness)
    g.fillStyle(bodyDark, 0.5);
    g.fillEllipse(cx, cy + r * 0.7, r * 1.3, r * 0.4);

    // Highlight (large soft + small bright)
    g.fillStyle(FOOD_HIGHLIGHT, 0.55);
    g.fillEllipse(cx - r * 0.4, cy - r * 0.2, r * 0.65, r * 0.4);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(cx - r * 0.45, cy - r * 0.25, r * 0.12);

    // Stem
    g.fillStyle(WOOD_DARK, 1);
    g.lineStyle(1, OUTLINE, 0.7);
    g.fillRoundedRect(cx - 1.5, cy - r - 4, 3, 7, 1);

    // Leaf (rounded teardrop with vein)
    g.fillStyle(0x6abf69, 1);
    g.lineStyle(1.5, OUTLINE, 0.8);
    g.beginPath();
    g.moveTo(cx + 2, cy - r);
    g.lineTo(cx + 14, cy - r - 6);
    g.lineTo(cx + 12, cy - r + 2);
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Leaf vein
    g.lineStyle(1, shade(0x6abf69, 0.6), 0.85);
    g.lineBetween(cx + 3, cy - r - 1, cx + 12, cy - r - 4);
  },

  bread(g, cx, cy, w, _h) {
    const body = 0xd6a86a;
    const dark = shade(body, 0.6);
    const light = shade(body, 1.2);

    groundShadow(g, cx, cy + 24, w * 0.7, 0.18);

    g.fillStyle(body, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillEllipse(cx, cy + 2, w - 8, 28);
    g.strokeEllipse(cx, cy + 2, w - 8, 28);

    // Crust accents – diagonal score lines, slightly brighter
    g.lineStyle(1.6, dark, 0.85);
    for (let i = -2; i <= 2; i++) {
      const x = cx + i * 7;
      g.lineBetween(x - 4, cy - 6, x + 4, cy + 4);
    }
    g.lineStyle(1, light, 0.6);
    for (let i = -2; i <= 2; i++) {
      const x = cx + i * 7;
      g.lineBetween(x - 3, cy - 5, x + 3, cy + 3);
    }

    // Highlight (broad soft + small bright)
    g.fillStyle(FOOD_HIGHLIGHT, 0.55);
    g.fillEllipse(cx - 6, cy - 6, 18, 6);
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(cx - 8, cy - 7, 6, 2);

    // Bottom shadow (under the loaf)
    g.fillStyle(dark, 0.3);
    g.fillEllipse(cx, cy + 13, w - 14, 4);
  },

  ball(g, cx, cy, _w, h) {
    const r = (h / 2) * 0.9;
    const a = 0xff6b6b;
    const aDark = shade(a, 0.65);
    const b = 0x4ecdc4;

    groundShadow(g, cx, h, r * 1.6, 0.22);

    g.fillStyle(a, 1);
    g.lineStyle(2, OUTLINE, 0.9);
    g.fillCircle(cx, cy, r);
    g.strokeCircle(cx, cy, r);

    // Stripe band (Toca-Boca-style band with darker edges)
    g.fillStyle(b, 1);
    g.fillRect(cx - r, cy - r * 0.25, r * 2, r * 0.5);
    // Band shadow line
    g.lineStyle(1, shade(b, 0.7), 0.7);
    g.lineBetween(cx - r, cy - r * 0.25, cx + r, cy - r * 0.25);
    g.lineBetween(cx - r, cy + r * 0.25, cx + r, cy + r * 0.25);
    // Re-stroke circle so the band stays inside the outline
    g.lineStyle(2, OUTLINE, 0.9);
    g.strokeCircle(cx, cy, r);

    // Bottom roundness shadow
    g.fillStyle(aDark, 0.45);
    g.fillEllipse(cx, cy + r * 0.55, r * 1.5, r * 0.4);

    // Highlights — large soft + sharp shine
    g.fillStyle(FOOD_HIGHLIGHT, 0.65);
    g.fillEllipse(cx - r * 0.4, cy - r * 0.4, r * 0.6, r * 0.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - r * 0.45, cy - r * 0.45, r * 0.14);
  },

  teddy(g, cx, cy, _w, h) {
    const fur = 0xb78a55;
    const furDark = shade(fur, 0.7);
    const inner = shade(fur, 1.25);
    const innerLight = shade(inner, 1.1);

    groundShadow(g, cx, h, 50, 0.22);
    g.lineStyle(2, OUTLINE, 0.85);

    // Body
    g.fillStyle(fur, 1);
    g.fillRoundedRect(cx - 22, cy - 4, 44, h * 0.55, 14);
    g.strokeRoundedRect(cx - 22, cy - 4, 44, h * 0.55, 14);

    // Body bottom shadow (depth hint)
    g.fillStyle(furDark, 0.45);
    g.fillEllipse(cx, cy + h * 0.45, 36, 5);

    // Belly
    g.fillStyle(inner, 1);
    g.fillEllipse(cx, cy + 14, 26, 22);
    g.lineStyle(1, OUTLINE, 0.4);
    g.strokeEllipse(cx, cy + 14, 26, 22);
    // Belly stitching line
    g.lineStyle(1, furDark, 0.6);
    g.lineBetween(cx, cy + 4, cx, cy + 24);

    // Head
    g.fillStyle(fur, 1);
    g.lineStyle(2, OUTLINE, 0.85);
    g.fillCircle(cx, cy - 18, 18);
    g.strokeCircle(cx, cy - 18, 18);
    // Head top sheen
    g.fillStyle(0xffffff, 0.18);
    g.fillEllipse(cx - 5, cy - 30, 14, 5);

    // Ears
    g.fillStyle(fur, 1);
    g.fillCircle(cx - 14, cy - 28, 7);
    g.fillCircle(cx + 14, cy - 28, 7);
    g.strokeCircle(cx - 14, cy - 28, 7);
    g.strokeCircle(cx + 14, cy - 28, 7);
    g.fillStyle(inner, 1);
    g.fillCircle(cx - 14, cy - 28, 4);
    g.fillCircle(cx + 14, cy - 28, 4);
    g.fillStyle(innerLight, 0.7);
    g.fillCircle(cx - 14, cy - 29, 2);
    g.fillCircle(cx + 14, cy - 29, 2);

    // Snout
    g.fillStyle(inner, 1);
    g.fillEllipse(cx, cy - 14, 14, 9);
    g.lineStyle(1.5, OUTLINE, 0.8);
    g.strokeEllipse(cx, cy - 14, 14, 9);
    // Snout highlight
    g.fillStyle(innerLight, 0.7);
    g.fillEllipse(cx - 2, cy - 16, 6, 2);

    // Eyes (slightly larger + shine)
    g.fillStyle(0x1b1f3b, 1);
    g.fillCircle(cx - 6, cy - 22, 2.6);
    g.fillCircle(cx + 6, cy - 22, 2.6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6.8, cy - 22.8, 0.9);
    g.fillCircle(cx + 5.2, cy - 22.8, 0.9);

    // Nose
    g.fillStyle(0x1b1f3b, 1);
    g.fillEllipse(cx, cy - 16, 4, 3);

    // Tiny smile
    g.lineStyle(1.3, 0x1b1f3b, 0.9);
    g.beginPath();
    g.arc(cx, cy - 11, 3, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();

    // Arms (small stubs at the sides)
    g.fillStyle(fur, 1);
    g.lineStyle(2, OUTLINE, 0.85);
    g.fillRoundedRect(cx - 28, cy + 4, 8, 16, 4);
    g.fillRoundedRect(cx + 20, cy + 4, 8, 16, 4);
    g.strokeRoundedRect(cx - 28, cy + 4, 8, 16, 4);
    g.strokeRoundedRect(cx + 20, cy + 4, 8, 16, 4);
    // Paw pad
    g.fillStyle(inner, 1);
    g.fillCircle(cx - 24, cy + 18, 2);
    g.fillCircle(cx + 24, cy + 18, 2);
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
