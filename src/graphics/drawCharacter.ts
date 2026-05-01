import Phaser from "phaser";
import {
  BOTTOMS,
  HAIRS,
  SHOES,
  SKIN_TONES,
  TOPS,
  TextureKeys,
  CHARACTER_CANVAS,
} from "../data/outfits";
import type {
  BottomOption,
  HairOption,
  ShoeOption,
  SkinToneOption,
  TopOption,
} from "../data/outfits";
import { bakeTexture } from "./textureFactory";
import { OUTLINE, shade, mix } from "./colorUtils";

/**
 * Anatomy reference (relative to texture center cx, cy):
 *   ground shadow: ellipse below the feet, drawn at the start of the skin
 *                  layer so all layers stack visually above it.
 *   head:        center (cx, cy-52),   70w × 68h ellipse  (≈40% of body)
 *   torso:       center (cx, cy-8),    46w × 30h rounded rect
 *   arms:        center (cx ± 28, cy-8), 16w × 30h
 *   hip:         trapezoid cx ± 23 → cx ± 20, y cy+7 .. cy+38
 *   shins:       center (cx ± 12, cy+47), 18w × 22h
 *   shoes:       center (cx ± 14, cy+64), 30w × 14h
 *
 * All layer textures share CHARACTER_CANVAS so they stack pixel-perfectly.
 */

const W = CHARACTER_CANVAS.w;
const H = CHARACTER_CANVAS.h;

const HEAD = { dx: 0, dy: -52, w: 70, h: 68 };
const TORSO = { dx: 0, dy: -8, w: 46, h: 30, r: 12 };
const ARM = { offsetX: 28, dy: -8, w: 16, h: 30, r: 8 };
const HIP_TOP_HALFW = 23;
const HIP_BOTTOM_HALFW = 20;
const HIP_TOP_Y = 7;
const HIP_BOTTOM_Y = 38;
const SHIN = { offsetX: 12, dy: 47, w: 18, h: 22, r: 7 };
const SHOE = { offsetX: 14, dy: 64, w: 30, h: 14, r: 6 };

// ---------- skin / base ----------

export function drawSkinBase(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  skin: SkinToneOption,
): void {
  const skinColor = skin.color;
  const skinDark = shade(skinColor, 0.86);
  const outlineCol = OUTLINE;

  // 1. Ground shadow — drawn first so every layer above it gets its depth hint.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 80, 60, 12);

  g.lineStyle(2, outlineCol, 0.9);

  // 2. Arms
  g.fillStyle(skinColor, 1);
  drawRoundedRectCentered(g, cx - ARM.offsetX, cy + ARM.dy, ARM.w, ARM.h, ARM.r, true);
  drawRoundedRectCentered(g, cx + ARM.offsetX, cy + ARM.dy, ARM.w, ARM.h, ARM.r, true);

  // Hands at end of arms (slightly larger now to match thicker arms).
  for (const sign of [-1, 1]) {
    const hx = cx + sign * ARM.offsetX;
    const hy = cy + ARM.dy + ARM.h / 2;
    g.fillStyle(skinColor, 1);
    g.fillCircle(hx, hy, 9);
    g.lineStyle(2, outlineCol, 0.9);
    g.strokeCircle(hx, hy, 9);
    // Subtle ambient shadow at the bottom of each hand.
    g.fillStyle(skinDark, 0.45);
    g.fillEllipse(hx, hy + 3, 12, 4);
  }

  // 3. Hip / upper-legs trapezoid
  g.fillStyle(skinColor, 1);
  g.lineStyle(2, outlineCol, 0.9);
  g.beginPath();
  g.moveTo(cx - HIP_TOP_HALFW, cy + HIP_TOP_Y);
  g.lineTo(cx + HIP_TOP_HALFW, cy + HIP_TOP_Y);
  g.lineTo(cx + HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.lineTo(cx - HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.closePath();
  g.fillPath();
  g.strokePath();

  // 4. Shins
  drawRoundedRectCentered(g, cx - SHIN.offsetX, cy + SHIN.dy, SHIN.w, SHIN.h, SHIN.r, true);
  drawRoundedRectCentered(g, cx + SHIN.offsetX, cy + SHIN.dy, SHIN.w, SHIN.h, SHIN.r, true);

  // 5. Torso (mostly hidden under top, shows at neck).
  drawRoundedRectCentered(g, cx + TORSO.dx, cy + TORSO.dy, TORSO.w, TORSO.h, TORSO.r, true);

  // 6. Head
  g.fillStyle(skinColor, 1);
  g.lineStyle(2, outlineCol, 0.9);
  g.fillEllipse(cx + HEAD.dx, cy + HEAD.dy, HEAD.w, HEAD.h);
  g.strokeEllipse(cx + HEAD.dx, cy + HEAD.dy, HEAD.w, HEAD.h);

  // 6a. Top-of-head highlight — fakes a soft directional light from above.
  g.fillStyle(0xffffff, 0.22);
  g.fillEllipse(cx + HEAD.dx - 8, cy + HEAD.dy - 22, 26, 12);

  // 6b. Chin ambient shadow — adds dimension along the lower jaw curve.
  g.fillStyle(skinDark, 0.4);
  g.fillEllipse(cx + HEAD.dx, cy + HEAD.dy + 22, 36, 8);

  // 7. Cheeks (bigger, more saturated for a Toca-Boca-ish look).
  const blush = mix(skinColor, 0xff6f87, 0.7);
  g.fillStyle(blush, 0.9);
  g.fillCircle(cx + HEAD.dx - 18, cy + HEAD.dy + 8, 6);
  g.fillCircle(cx + HEAD.dx + 18, cy + HEAD.dy + 8, 6);
  // Small inner core that's slightly more pink, for soft gradient feel.
  g.fillStyle(mix(skinColor, 0xff8ea0, 0.85), 0.6);
  g.fillCircle(cx + HEAD.dx - 18, cy + HEAD.dy + 8, 3);
  g.fillCircle(cx + HEAD.dx + 18, cy + HEAD.dy + 8, 3);

  // 8. Eyes (bigger, rounder, with shine).
  const eyeY = cy + HEAD.dy - 4;
  const eyeOffsetX = 11;
  const eyeW = 13;
  const eyeH = 16;
  for (const sign of [-1, 1]) {
    const ex = cx + HEAD.dx + sign * eyeOffsetX;
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(ex, eyeY, eyeW, eyeH);
    g.lineStyle(1.6, outlineCol, 0.95);
    g.strokeEllipse(ex, eyeY, eyeW, eyeH);
    // Pupil
    g.fillStyle(0x1b1f3b, 1);
    g.fillCircle(ex, eyeY + 1, 4);
    // Big shine, top-left of pupil
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex - 1.5, eyeY - 1.5, 1.8);
    // Tiny secondary shine
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(ex + 1.8, eyeY + 2.5, 0.8);
  }

  // 9. Eyebrows — short curved arcs above each eye. Single biggest expression boost.
  g.lineStyle(2.5, outlineCol, 0.95);
  for (const sign of [-1, 1]) {
    const ex = cx + HEAD.dx + sign * eyeOffsetX;
    g.beginPath();
    g.arc(ex, eyeY - 11, 6, 1.18 * Math.PI, 1.82 * Math.PI, false);
    g.strokePath();
  }

  // 10. Tiny nose hint — single soft line/dot.
  g.fillStyle(skinDark, 0.7);
  g.fillEllipse(cx + HEAD.dx, cy + HEAD.dy + 4, 4, 3);

  // 11. Smile (slightly bigger, ends with little upticks via two short strokes).
  g.lineStyle(2.4, outlineCol, 0.95);
  g.beginPath();
  g.arc(cx + HEAD.dx, cy + HEAD.dy + 14, 8, 0.12 * Math.PI, 0.88 * Math.PI, false);
  g.strokePath();
}

// ---------- hair ----------

export function drawHair(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  hair: HairOption,
): void {
  const headTop = cy + HEAD.dy - HEAD.h / 2;
  const headBottom = cy + HEAD.dy + HEAD.h / 2;
  const headHalfW = HEAD.w / 2;
  const col = hair.color;
  const dark = shade(col, 0.7);
  const highlight = shade(col, 1.25);
  g.lineStyle(2, OUTLINE, 0.85);

  switch (hair.style) {
    case "short": {
      // Cap that follows top half of the head with a parted fringe.
      g.fillStyle(col, 1);
      g.beginPath();
      g.moveTo(cx - headHalfW + 2, cy + HEAD.dy + 2);
      g.lineTo(cx - headHalfW + 2, cy + HEAD.dy - 4);
      g.arc(cx + HEAD.dx, cy + HEAD.dy, headHalfW + 2, Math.PI, 0, false);
      g.lineTo(cx + headHalfW - 2, cy + HEAD.dy + 2);
      // Fringe across forehead
      g.lineTo(cx + 8, cy + HEAD.dy - 8);
      g.lineTo(cx - 4, cy + HEAD.dy - 2);
      g.lineTo(cx - 14, cy + HEAD.dy - 10);
      g.closePath();
      g.fillPath();
      g.strokePath();
      // Highlight streak on the crown
      g.fillStyle(highlight, 0.45);
      g.fillEllipse(cx - 8, headTop + 8, 24, 6);
      break;
    }
    case "long": {
      // Down-to-shoulders with parted fringe.
      g.fillStyle(col, 1);
      g.beginPath();
      g.moveTo(cx - headHalfW - 6, cy + HEAD.dy - 6);
      g.arc(cx + HEAD.dx, cy + HEAD.dy, headHalfW + 6, Math.PI, 0, false);
      g.lineTo(cx + headHalfW + 6, headBottom + 16);
      g.lineTo(cx + headHalfW - 4, headBottom + 22);
      g.lineTo(cx - headHalfW + 4, headBottom + 22);
      g.lineTo(cx - headHalfW - 6, headBottom + 16);
      g.closePath();
      g.fillPath();
      g.strokePath();
      // Fringe overlay
      g.fillStyle(dark, 1);
      g.beginPath();
      g.moveTo(cx - 18, cy + HEAD.dy - 12);
      g.lineTo(cx + 4, cy + HEAD.dy - 4);
      g.lineTo(cx - 4, cy + HEAD.dy + 4);
      g.lineTo(cx - 22, cy + HEAD.dy - 4);
      g.closePath();
      g.fillPath();
      // Strand highlights
      g.lineStyle(1.5, highlight, 0.55);
      g.lineBetween(cx - headHalfW - 2, headBottom + 2, cx - headHalfW + 6, headBottom + 18);
      g.lineBetween(cx + headHalfW + 2, headBottom + 2, cx + headHalfW - 6, headBottom + 18);
      break;
    }
    case "curly": {
      // Cluster of circles around the upper head.
      g.fillStyle(col, 1);
      const r = 14;
      const ring: [number, number][] = [
        [-24, -4], [-10, -16], [4, -20], [18, -16], [28, -2],
        [24, 12], [-2, -22], [12, -22], [-24, 8], [22, -18],
      ];
      for (const [dx, dy] of ring) {
        g.fillCircle(cx + dx, headTop + 16 + dy, r);
      }
      // Inner highlight on each curl
      g.fillStyle(highlight, 0.45);
      for (const [dx, dy] of ring) {
        g.fillCircle(cx + dx - 3, headTop + 16 + dy - 3, 4);
      }
      // Outline pass
      g.lineStyle(2, OUTLINE, 0.7);
      for (const [dx, dy] of ring) {
        g.strokeCircle(cx + dx, headTop + 16 + dy, r);
      }
      break;
    }
    case "spiky": {
      g.fillStyle(col, 1);
      const baseY = headTop + 8;
      const spikes = 7;
      g.beginPath();
      g.moveTo(cx - headHalfW, baseY);
      for (let i = 0; i <= spikes; i++) {
        const t = i / spikes;
        const x = cx - headHalfW + t * HEAD.w;
        const tipY = baseY - 18 - (i % 2 === 0 ? 6 : 0);
        const x2 = x + HEAD.w / spikes / 2;
        g.lineTo(x2, tipY);
        g.lineTo(x + HEAD.w / spikes, baseY);
      }
      g.closePath();
      g.fillPath();
      g.strokePath();
      // Spike-tip highlights
      g.fillStyle(highlight, 0.6);
      for (let i = 0; i <= spikes; i++) {
        const t = i / spikes;
        const x = cx - headHalfW + t * HEAD.w + HEAD.w / spikes / 2;
        const tipY = baseY - 16 - (i % 2 === 0 ? 6 : 0);
        g.fillCircle(x, tipY + 2, 1.6);
      }
      break;
    }
    case "ponytail": {
      // Short cap with side ponytail at the back-right.
      g.fillStyle(col, 1);
      g.beginPath();
      g.moveTo(cx - headHalfW + 2, cy + HEAD.dy);
      g.arc(cx + HEAD.dx, cy + HEAD.dy, headHalfW + 2, Math.PI, 0, false);
      g.lineTo(cx + headHalfW - 4, cy + HEAD.dy + 4);
      g.lineTo(cx - headHalfW + 4, cy + HEAD.dy + 4);
      g.closePath();
      g.fillPath();
      g.strokePath();
      // Tail
      g.fillStyle(col, 1);
      g.beginPath();
      g.moveTo(cx + headHalfW - 4, cy + HEAD.dy - 8);
      g.lineTo(cx + headHalfW + 18, cy + HEAD.dy + 4);
      g.lineTo(cx + headHalfW + 16, cy + HEAD.dy + 18);
      g.lineTo(cx + headHalfW - 2, cy + HEAD.dy + 8);
      g.closePath();
      g.fillPath();
      g.strokePath();
      // Tail highlight + tie band
      g.fillStyle(highlight, 0.5);
      g.fillEllipse(cx + headHalfW + 6, cy + HEAD.dy + 2, 4, 8);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(cx + headHalfW - 2, cy + HEAD.dy - 4, 3);
      g.lineStyle(1.5, OUTLINE, 0.85);
      g.strokeCircle(cx + headHalfW - 2, cy + HEAD.dy - 4, 3);
      break;
    }
  }
}

// ---------- top ----------

export function drawTop(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  top: TopOption,
): void {
  const col = top.color;
  const dark = shade(col, 0.75);
  const light = shade(col, 1.18);

  // Shirt body
  g.fillStyle(col, 1);
  g.lineStyle(2, OUTLINE, 0.9);
  drawRoundedRectCentered(
    g,
    cx + TORSO.dx,
    cy + TORSO.dy,
    TORSO.w + 6,
    TORSO.h + 6,
    TORSO.r,
    true,
  );

  // Sleeves (cover upper third of arms)
  drawRoundedRectCentered(g, cx - ARM.offsetX, cy + ARM.dy - 6, ARM.w + 8, 18, 8, true);
  drawRoundedRectCentered(g, cx + ARM.offsetX, cy + ARM.dy - 6, ARM.w + 8, 18, 8, true);

  // Top highlight band — soft sheen along the shoulder line.
  g.fillStyle(light, 0.45);
  g.fillEllipse(cx + TORSO.dx, cy + TORSO.dy - TORSO.h / 2 + 4, TORSO.w - 4, 6);

  // Bottom shadow — small darker band where shirt meets pants.
  g.fillStyle(dark, 0.5);
  g.fillRect(cx - (TORSO.w + 6) / 2 + 4, cy + TORSO.dy + TORSO.h / 2, TORSO.w - 2, 3);

  // Neckline (slightly darker patch hinting at collar shadow).
  g.fillStyle(dark, 1);
  g.fillEllipse(cx + TORSO.dx, cy + TORSO.dy - TORSO.h / 2 + 1, 18, 7);
}

// ---------- bottom ----------

export function drawBottom(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  bottom: BottomOption,
): void {
  const col = bottom.color;
  const dark = shade(col, 0.78);
  const light = shade(col, 1.15);

  g.fillStyle(col, 1);
  g.lineStyle(2, OUTLINE, 0.9);

  if (bottom.style === "skirt") {
    g.beginPath();
    g.moveTo(cx - HIP_TOP_HALFW - 2, cy + HIP_TOP_Y - 2);
    g.lineTo(cx + HIP_TOP_HALFW + 2, cy + HIP_TOP_Y - 2);
    g.lineTo(cx + HIP_BOTTOM_HALFW + 18, cy + HIP_BOTTOM_Y + 10);
    g.lineTo(cx - HIP_BOTTOM_HALFW - 18, cy + HIP_BOTTOM_Y + 10);
    g.closePath();
    g.fillPath();
    g.strokePath();
    // Skirt highlight stripe down the front
    g.fillStyle(light, 0.4);
    g.fillRect(cx - 6, cy + HIP_TOP_Y, 4, HIP_BOTTOM_Y - HIP_TOP_Y + 8);
    // Belt line
    g.fillStyle(dark, 0.85);
    g.fillRect(cx - HIP_TOP_HALFW - 1, cy + HIP_TOP_Y - 3, HIP_TOP_HALFW * 2 + 2, 3);
    return;
  }

  // Hip block
  g.beginPath();
  g.moveTo(cx - HIP_TOP_HALFW - 1, cy + HIP_TOP_Y - 2);
  g.lineTo(cx + HIP_TOP_HALFW + 1, cy + HIP_TOP_Y - 2);
  g.lineTo(cx + HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.lineTo(cx - HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.closePath();
  g.fillPath();
  g.strokePath();

  // Lower legs
  const legBottom = bottom.style === "short" ? cy + SHIN.dy - 6 : cy + SHIN.dy + SHIN.h / 2 - 2;
  drawRoundedRectCentered(
    g,
    cx - SHIN.offsetX,
    (cy + HIP_BOTTOM_Y + legBottom) / 2,
    SHIN.w + 2,
    legBottom - (cy + HIP_BOTTOM_Y),
    4,
    true,
  );
  drawRoundedRectCentered(
    g,
    cx + SHIN.offsetX,
    (cy + HIP_BOTTOM_Y + legBottom) / 2,
    SHIN.w + 2,
    legBottom - (cy + HIP_BOTTOM_Y),
    4,
    true,
  );

  // Center seam (jeans-style stitching) – subtle vertical line down the middle
  g.fillStyle(light, 0.35);
  g.fillRect(cx - 1, cy + HIP_TOP_Y, 1, HIP_BOTTOM_Y - HIP_TOP_Y);

  // Belt line
  g.fillStyle(dark, 1);
  g.fillRect(cx - HIP_TOP_HALFW - 1, cy + HIP_TOP_Y - 3, HIP_TOP_HALFW * 2 + 2, 3);
}

// ---------- shoes ----------

export function drawShoes(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  shoes: ShoeOption,
): void {
  const col = shoes.color;
  const dark = shade(col, 0.55);
  const light = shade(col, 1.18);
  g.lineStyle(2, OUTLINE, 0.9);

  for (const sign of [-1, 1]) {
    const x = cx + sign * SHOE.offsetX;
    const y = cy + SHOE.dy;

    if (shoes.style === "sandal") {
      // Sole
      g.fillStyle(col, 1);
      drawRoundedRectCentered(g, x, y + 3, SHOE.w, 7, 3, true);
      // Straps
      g.lineStyle(2.2, dark, 1);
      g.lineBetween(x - 9, y - 2, x + 7, y - 2);
      g.lineBetween(x - 4, y - 5, x + 9, y - 5);
      g.lineStyle(2, OUTLINE, 0.9);
    } else {
      // Body
      g.fillStyle(col, 1);
      drawRoundedRectCentered(g, x, y, SHOE.w, SHOE.h, SHOE.r, true);
      // Top sheen
      g.fillStyle(light, 0.5);
      g.fillEllipse(x, y - SHOE.h / 2 + 3, SHOE.w - 8, 3);
      // Sole accent (rubber bottom)
      g.fillStyle(dark, 1);
      g.fillRect(x - SHOE.w / 2 + 1, y + SHOE.h / 2 - 4, SHOE.w - 2, 3);

      if (shoes.style === "boot") {
        // Add a shaft above the foot
        g.fillStyle(col, 1);
        g.lineStyle(2, OUTLINE, 0.9);
        drawRoundedRectCentered(g, x, y - 12, SHOE.w - 6, 14, 4, true);
        // Shaft highlight
        g.fillStyle(light, 0.5);
        g.fillRect(x - 8, y - 18, 3, 12);
      }
    }
  }
}

// ---------- helper ----------

function drawRoundedRectCentered(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
  stroke: boolean,
): void {
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
  if (stroke) g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
}

// ---------- bake all ----------

export function bakeCharacterTextures(scene: Phaser.Scene): void {
  for (const skin of SKIN_TONES) {
    bakeTexture(scene, TextureKeys.skin(skin.id), W, H, (g, cx, cy) =>
      drawSkinBase(g, cx, cy, skin),
    );
  }
  for (const hair of HAIRS) {
    bakeTexture(scene, TextureKeys.hair(hair.id), W, H, (g, cx, cy) =>
      drawHair(g, cx, cy, hair),
    );
  }
  for (const top of TOPS) {
    bakeTexture(scene, TextureKeys.top(top.id), W, H, (g, cx, cy) =>
      drawTop(g, cx, cy, top),
    );
  }
  for (const bot of BOTTOMS) {
    bakeTexture(scene, TextureKeys.bottom(bot.id), W, H, (g, cx, cy) =>
      drawBottom(g, cx, cy, bot),
    );
  }
  for (const sh of SHOES) {
    bakeTexture(scene, TextureKeys.shoes(sh.id), W, H, (g, cx, cy) =>
      drawShoes(g, cx, cy, sh),
    );
  }
}
