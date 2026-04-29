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
 *   head:        center (cx, cy-45),   60w × 60h ellipse
 *   torso:       center (cx, cy-5),    50w × 40h rounded rect
 *   left arm:    center (cx-32, cy-5), 14w × 40h rounded rect
 *   right arm:   center (cx+32, cy-5), 14w × 40h rounded rect
 *   hip/thigh:   trapezoid cx ± 25 -> cx ± 22, y cy+15 .. cy+50
 *   l. shin:     center (cx-11, cy+55), 16w × 25h rounded rect
 *   r. shin:     center (cx+11, cy+55), 16w × 25h rounded rect
 *   l. shoe:     center (cx-13, cy+72), 24w × 12h shoe
 *   r. shoe:     center (cx+13, cy+72), 24w × 12h shoe
 *
 * All layer textures share CHARACTER_CANVAS dimensions, so they stack
 * pixel-perfectly when placed at the same Container origin.
 */

const W = CHARACTER_CANVAS.w;
const H = CHARACTER_CANVAS.h;

const HEAD = { dx: 0, dy: -45, w: 60, h: 60 };
const TORSO = { dx: 0, dy: -5, w: 50, h: 40, r: 12 };
const ARM = { offsetX: 30, dy: -5, w: 14, h: 40, r: 7 };
const HIP_TOP_HALFW = 26;
const HIP_BOTTOM_HALFW = 22;
const HIP_TOP_Y = 15;
const HIP_BOTTOM_Y = 50;
const SHIN = { offsetX: 11, dy: 56, w: 16, h: 26, r: 6 };
const SHOE = { offsetX: 13, dy: 73, w: 26, h: 14, r: 5 };

// ---------- skin / base ----------

export function drawSkinBase(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  skin: SkinToneOption,
): void {
  const skinColor = skin.color;
  const outlineCol = OUTLINE;

  g.lineStyle(2, outlineCol, 0.9);

  // Arms
  g.fillStyle(skinColor, 1);
  drawRoundedRectCentered(g, cx - ARM.offsetX, cy + ARM.dy, ARM.w, ARM.h, ARM.r, true);
  drawRoundedRectCentered(g, cx + ARM.offsetX, cy + ARM.dy, ARM.w, ARM.h, ARM.r, true);

  // Hands at end of arms
  g.fillCircle(cx - ARM.offsetX, cy + ARM.dy + ARM.h / 2, 8);
  g.fillCircle(cx + ARM.offsetX, cy + ARM.dy + ARM.h / 2, 8);
  g.lineStyle(2, outlineCol, 0.9);
  g.strokeCircle(cx - ARM.offsetX, cy + ARM.dy + ARM.h / 2, 8);
  g.strokeCircle(cx + ARM.offsetX, cy + ARM.dy + ARM.h / 2, 8);

  // Hip / upper-legs trapezoid
  g.fillStyle(skinColor, 1);
  g.beginPath();
  g.moveTo(cx - HIP_TOP_HALFW, cy + HIP_TOP_Y);
  g.lineTo(cx + HIP_TOP_HALFW, cy + HIP_TOP_Y);
  g.lineTo(cx + HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.lineTo(cx - HIP_BOTTOM_HALFW, cy + HIP_BOTTOM_Y);
  g.closePath();
  g.fillPath();
  g.strokePath();

  // Shins
  drawRoundedRectCentered(g, cx - SHIN.offsetX, cy + SHIN.dy, SHIN.w, SHIN.h, SHIN.r, true);
  drawRoundedRectCentered(g, cx + SHIN.offsetX, cy + SHIN.dy, SHIN.w, SHIN.h, SHIN.r, true);

  // Torso (skin color is mostly hidden under top, but shows at neck)
  drawRoundedRectCentered(g, cx + TORSO.dx, cy + TORSO.dy, TORSO.w, TORSO.h, TORSO.r, true);

  // Head
  g.fillStyle(skinColor, 1);
  g.lineStyle(2, outlineCol, 0.9);
  g.fillEllipse(cx + HEAD.dx, cy + HEAD.dy, HEAD.w, HEAD.h);
  g.strokeEllipse(cx + HEAD.dx, cy + HEAD.dy, HEAD.w, HEAD.h);

  // Cheeks
  const blush = mix(skinColor, 0xff8e9c, 0.55);
  g.fillStyle(blush, 0.85);
  g.fillCircle(cx + HEAD.dx - 14, cy + HEAD.dy + 6, 4);
  g.fillCircle(cx + HEAD.dx + 14, cy + HEAD.dy + 6, 4);

  // Eyes
  const eyeY = cy + HEAD.dy - 2;
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx + HEAD.dx - 8, eyeY, 9, 11);
  g.fillEllipse(cx + HEAD.dx + 8, eyeY, 9, 11);
  g.lineStyle(1.5, outlineCol, 0.9);
  g.strokeEllipse(cx + HEAD.dx - 8, eyeY, 9, 11);
  g.strokeEllipse(cx + HEAD.dx + 8, eyeY, 9, 11);
  g.fillStyle(0x1b1f3b, 1);
  g.fillCircle(cx + HEAD.dx - 8, eyeY + 1, 3);
  g.fillCircle(cx + HEAD.dx + 8, eyeY + 1, 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + HEAD.dx - 9, eyeY, 1);
  g.fillCircle(cx + HEAD.dx + 7, eyeY, 1);

  // Smile: clockwise arc through the bottom of the mouth circle.
  g.lineStyle(2, outlineCol, 0.95);
  g.beginPath();
  g.arc(cx + HEAD.dx, cy + HEAD.dy + 11, 7, 0.15 * Math.PI, 0.85 * Math.PI, false);
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
  g.lineStyle(2, OUTLINE, 0.85);

  switch (hair.style) {
    case "short": {
      // Cap that follows top half of the head with a fringe.
      // arc(π → 0) clockwise (anticlockwise=false) traverses through 3π/2
      // which in canvas-coordinates (y-down) is the top of the circle.
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
      // Fringe
      g.fillStyle(dark, 1);
      g.beginPath();
      g.moveTo(cx - 18, cy + HEAD.dy - 12);
      g.lineTo(cx + 4, cy + HEAD.dy - 4);
      g.lineTo(cx - 4, cy + HEAD.dy + 4);
      g.lineTo(cx - 22, cy + HEAD.dy - 4);
      g.closePath();
      g.fillPath();
      break;
    }
    case "curly": {
      // Cluster of circles around the upper head.
      g.fillStyle(col, 1);
      const r = 13;
      const ring: [number, number][] = [
        [-22, -6], [-10, -16], [4, -18], [18, -14], [26, -2],
        [22, 10], [-2, -22], [10, -22], [-22, 6], [22, -16],
      ];
      for (const [dx, dy] of ring) {
        g.fillCircle(cx + dx, headTop + 14 + dy, r);
      }
      // Outline pass
      g.lineStyle(2, OUTLINE, 0.7);
      for (const [dx, dy] of ring) {
        g.strokeCircle(cx + dx, headTop + 14 + dy, r);
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
        const x = cx - headHalfW + t * (HEAD.w);
        const tipY = baseY - 16 - (i % 2 === 0 ? 6 : 0);
        const x2 = x + HEAD.w / spikes / 2;
        g.lineTo(x2, tipY);
        g.lineTo(x + HEAD.w / spikes, baseY);
      }
      g.closePath();
      g.fillPath();
      g.strokePath();
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
  drawRoundedRectCentered(g, cx - ARM.offsetX, cy + ARM.dy - 8, ARM.w + 8, 18, 8, true);
  drawRoundedRectCentered(g, cx + ARM.offsetX, cy + ARM.dy - 8, ARM.w + 8, 18, 8, true);

  // Neckline (hint of skin tone behind)
  g.fillStyle(dark, 1);
  g.fillEllipse(cx + TORSO.dx, cy + TORSO.dy - TORSO.h / 2 + 2, 18, 8);
}

// ---------- bottom ----------

export function drawBottom(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  bottom: BottomOption,
): void {
  const col = bottom.color;
  const dark = shade(col, 0.8);

  g.fillStyle(col, 1);
  g.lineStyle(2, OUTLINE, 0.9);

  if (bottom.style === "skirt") {
    g.beginPath();
    g.moveTo(cx - HIP_TOP_HALFW - 2, cy + HIP_TOP_Y - 2);
    g.lineTo(cx + HIP_TOP_HALFW + 2, cy + HIP_TOP_Y - 2);
    g.lineTo(cx + HIP_BOTTOM_HALFW + 16, cy + HIP_BOTTOM_Y + 8);
    g.lineTo(cx - HIP_BOTTOM_HALFW - 16, cy + HIP_BOTTOM_Y + 8);
    g.closePath();
    g.fillPath();
    g.strokePath();
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
  const dark = shade(col, 0.6);
  g.lineStyle(2, OUTLINE, 0.9);

  for (const sign of [-1, 1]) {
    const x = cx + sign * SHOE.offsetX;
    const y = cy + SHOE.dy;

    if (shoes.style === "sandal") {
      // Sole
      g.fillStyle(col, 1);
      drawRoundedRectCentered(g, x, y + 3, SHOE.w, 6, 3, true);
      // Straps
      g.lineStyle(2, dark, 1);
      g.lineBetween(x - 8, y - 2, x + 6, y - 2);
      g.lineBetween(x - 4, y - 4, x + 8, y - 4);
      g.lineStyle(2, OUTLINE, 0.9);
    } else {
      // Body
      g.fillStyle(col, 1);
      drawRoundedRectCentered(g, x, y, SHOE.w, SHOE.h, SHOE.r, true);
      // Sole accent
      g.fillStyle(dark, 1);
      g.fillRect(x - SHOE.w / 2 + 1, y + SHOE.h / 2 - 4, SHOE.w - 2, 3);

      if (shoes.style === "boot") {
        // Add a shaft above the foot
        g.fillStyle(col, 1);
        g.lineStyle(2, OUTLINE, 0.9);
        drawRoundedRectCentered(g, x, y - 12, SHOE.w - 6, 14, 4, true);
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
