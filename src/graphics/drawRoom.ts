import Phaser from "phaser";
import { LOCATIONS } from "../data/locations";
import { TextureKeys } from "../data/outfits";
import { bakeTexture } from "./textureFactory";
import { OUTLINE, mix, shade } from "./colorUtils";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const ROOM_W = GAME_WIDTH - 80;
const ROOM_H = GAME_HEIGHT - 260;
const FLOOR_Y = ROOM_H * 0.55;

type WallPattern = "stripes" | "dots" | "panels" | "subway";
type FloorPattern = "wood" | "tile" | "checker";

interface RoomPalette {
  wall: number;
  wallAccent: number;
  floor: number;
  floorAccent: number;
  wallPattern: WallPattern;
  floorPattern: FloorPattern;
}

const palettes: Record<string, RoomPalette> = {
  living: {
    wall: 0xf6dfbe,
    wallAccent: 0xe7c19b,
    floor: 0xc99a6b,
    floorAccent: 0x8a653c,
    wallPattern: "panels",
    floorPattern: "wood",
  },
  kitchen: {
    wall: 0xc8e1d4,
    wallAccent: 0xa9d0bd,
    floor: 0xeae3cd,
    floorAccent: 0xc7c2a8,
    wallPattern: "subway",
    floorPattern: "checker",
  },
  bath: {
    wall: 0xbcd8e8,
    wallAccent: 0x99c4dc,
    floor: 0xeaeef3,
    floorAccent: 0xb3c4d3,
    wallPattern: "dots",
    floorPattern: "tile",
  },
  bedroom: {
    wall: 0xe9c8e5,
    wallAccent: 0xc8a6c5,
    floor: 0xb38a5a,
    floorAccent: 0x7a5b36,
    wallPattern: "dots",
    floorPattern: "wood",
  },
};

// ---------- walls / floor ----------

function drawWalls(g: Phaser.GameObjects.Graphics, palette: RoomPalette): void {
  // Wall fill
  g.fillStyle(palette.wall, 1);
  g.fillRect(0, 0, ROOM_W, FLOOR_Y);

  // Pattern overlay
  switch (palette.wallPattern) {
    case "stripes": {
      g.fillStyle(palette.wallAccent, 0.6);
      for (let x = 30; x < ROOM_W; x += 60) g.fillRect(x, 0, 4, FLOOR_Y);
      break;
    }
    case "dots": {
      g.fillStyle(palette.wallAccent, 0.55);
      const r = 4;
      const stepX = 50;
      const stepY = 50;
      for (let row = 0, y = 20; y < FLOOR_Y - 12; y += stepY, row++) {
        const offset = row % 2 === 0 ? 0 : stepX / 2;
        for (let x = 20 + offset; x < ROOM_W; x += stepX) g.fillCircle(x, y, r);
      }
      break;
    }
    case "panels": {
      // Tall outlined rectangles every ~140 px, like a wainscoting feature wall.
      g.lineStyle(2, palette.wallAccent, 0.6);
      const panelW = 130;
      const margin = 20;
      const panelH = FLOOR_Y - 80;
      for (let x = margin + 10; x + panelW < ROOM_W - margin; x += panelW + 14) {
        g.strokeRoundedRect(x, 40, panelW, panelH, 6);
      }
      break;
    }
    case "subway": {
      // Small white-ish rectangles, brick-offset rows.
      const tw = 54;
      const th = 22;
      const gap = 2;
      for (let r = 0, y = 14; y < FLOOR_Y - 18; y += th + gap, r++) {
        const offset = r % 2 === 0 ? 0 : (tw + gap) / 2;
        for (let x = -offset + 4; x < ROOM_W; x += tw + gap) {
          g.fillStyle(shade(palette.wall, 1.08), 0.85);
          g.fillRect(x, y, tw, th);
          g.lineStyle(1, palette.wallAccent, 0.6);
          g.strokeRect(x, y, tw, th);
        }
      }
      break;
    }
  }

  // Wall-floor ambient shadow (depth)
  g.fillStyle(0x000000, 0.16);
  g.fillRect(0, FLOOR_Y - 14, ROOM_W, 6);

  // Baseboard
  g.fillStyle(shade(palette.floor, 0.55), 1);
  g.fillRect(0, FLOOR_Y - 8, ROOM_W, 8);
  // Baseboard top edge highlight
  g.fillStyle(shade(palette.floor, 0.85), 0.8);
  g.fillRect(0, FLOOR_Y - 8, ROOM_W, 1);
}

function drawFloor(g: Phaser.GameObjects.Graphics, palette: RoomPalette): void {
  g.fillStyle(palette.floor, 1);
  g.fillRect(0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y);

  switch (palette.floorPattern) {
    case "wood": {
      // Plank vertical seams
      g.fillStyle(palette.floorAccent, 0.85);
      for (let x = 0; x < ROOM_W; x += 110) g.fillRect(x + 28, FLOOR_Y, 2, ROOM_H - FLOOR_Y);
      // Plank stagger seams
      g.fillStyle(palette.floorAccent, 0.65);
      for (let r = 0; r < 3; r++) {
        const rowY = FLOOR_Y + ((r + 1) * (ROOM_H - FLOOR_Y)) / 4;
        for (let x = (r * 70) % 110; x < ROOM_W; x += 220) {
          g.fillRect(x, rowY, 2, 6);
        }
      }
      // Subtle wood grain
      g.lineStyle(1, palette.floorAccent, 0.32);
      for (let y = FLOOR_Y + 12; y < ROOM_H; y += 18) {
        g.lineBetween(20, y, ROOM_W - 20, y);
      }
      // Top-edge floor highlight (light hits the floor)
      g.fillStyle(shade(palette.floor, 1.15), 0.4);
      g.fillRect(0, FLOOR_Y, ROOM_W, 4);
      break;
    }
    case "tile": {
      const tile = 60;
      g.fillStyle(palette.floorAccent, 0.85);
      for (let x = 0; x < ROOM_W; x += tile) g.fillRect(x, FLOOR_Y, 2, ROOM_H - FLOOR_Y);
      for (let y = FLOOR_Y; y < ROOM_H; y += tile) g.fillRect(0, y, ROOM_W, 2);
      // Each tile gets a tiny corner shadow for depth
      g.fillStyle(0x000000, 0.06);
      for (let x = 0; x < ROOM_W; x += tile) {
        for (let y = FLOOR_Y; y < ROOM_H; y += tile) {
          g.fillRect(x + 2, y + 2, tile - 4, 6);
        }
      }
      break;
    }
    case "checker": {
      const tile = 70;
      const dark = palette.floorAccent;
      for (let r = 0, y = FLOOR_Y; y < ROOM_H; y += tile, r++) {
        for (let c = 0, x = 0; x < ROOM_W; x += tile, c++) {
          if ((r + c) % 2 === 0) {
            g.fillStyle(dark, 0.55);
            g.fillRect(x, y, tile, tile);
          }
        }
      }
      // Outline grid
      g.lineStyle(1, shade(dark, 0.7), 0.35);
      for (let x = 0; x < ROOM_W; x += tile) g.lineBetween(x, FLOOR_Y, x, ROOM_H);
      for (let y = FLOOR_Y; y < ROOM_H; y += tile) g.lineBetween(0, y, ROOM_W, y);
      break;
    }
  }
}

// ---------- decorative pieces ----------

function drawWindow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 220,
  h = 160,
): void {
  // Frame
  g.fillStyle(0xf6f3ec, 1);
  g.lineStyle(3, OUTLINE, 0.8);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
  g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

  // Sky gradient – stack a few rectangles bottom→top from light to deep
  const skyTop = 0x6fb0d8;
  const skyMid = 0x9ec9e3;
  const skyBot = 0xc7e3ee;
  const innerX = cx - w / 2 + 8;
  const innerY = cy - h / 2 + 8;
  const innerW = w - 16;
  const innerH = h - 16;
  g.fillStyle(skyTop, 1);
  g.fillRect(innerX, innerY, innerW, innerH * 0.4);
  g.fillStyle(skyMid, 1);
  g.fillRect(innerX, innerY + innerH * 0.4, innerW, innerH * 0.3);
  g.fillStyle(skyBot, 1);
  g.fillRect(innerX, innerY + innerH * 0.7, innerW, innerH * 0.3);

  // Cloud
  g.fillStyle(0xffffff, 0.95);
  g.fillEllipse(innerX + innerW * 0.3, innerY + innerH * 0.25, 32, 12);
  g.fillCircle(innerX + innerW * 0.3 - 10, innerY + innerH * 0.25 - 2, 8);
  g.fillCircle(innerX + innerW * 0.3 + 10, innerY + innerH * 0.25 - 4, 9);

  // Sun with rays
  const sunX = innerX + innerW - 26;
  const sunY = innerY + 22;
  g.fillStyle(0xffd45c, 1);
  g.fillCircle(sunX, sunY, 12);
  g.lineStyle(2, 0xffd45c, 0.7);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.lineBetween(sunX + Math.cos(a) * 16, sunY + Math.sin(a) * 16, sunX + Math.cos(a) * 22, sunY + Math.sin(a) * 22);
  }

  // Hills
  g.fillStyle(0x6abf69, 1);
  g.fillEllipse(cx - w / 4, cy + h / 4 - 10, w * 0.6, h * 0.4);
  g.fillStyle(shade(0x6abf69, 0.8), 1);
  g.fillEllipse(cx + w / 4, cy + h / 4, w * 0.5, h * 0.35);

  // Window cross
  g.lineStyle(3, OUTLINE, 0.8);
  g.lineBetween(cx, cy - h / 2 + 8, cx, cy + h / 2 - 8);
  g.lineBetween(cx - w / 2 + 8, cy, cx + w / 2 - 8, cy);

  // Inner shadow at top of pane (suggests the frame casts a tiny shadow)
  g.fillStyle(0x000000, 0.12);
  g.fillRect(innerX, innerY, innerW, 4);

  // Curtains on the sides
  const curtainW = 26;
  const curtainCol = 0xd96b6b;
  g.fillStyle(curtainCol, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRoundedRect(cx - w / 2 - curtainW + 4, cy - h / 2 - 4, curtainW, h + 8, 4);
  g.strokeRoundedRect(cx - w / 2 - curtainW + 4, cy - h / 2 - 4, curtainW, h + 8, 4);
  g.fillRoundedRect(cx + w / 2 - 4, cy - h / 2 - 4, curtainW, h + 8, 4);
  g.strokeRoundedRect(cx + w / 2 - 4, cy - h / 2 - 4, curtainW, h + 8, 4);
  // Curtain pleats
  g.lineStyle(1.5, shade(curtainCol, 0.7), 0.7);
  for (let i = 1; i < 4; i++) {
    const x1 = cx - w / 2 - curtainW + 4 + (i * curtainW) / 4;
    const x2 = cx + w / 2 - 4 + (i * curtainW) / 4;
    g.lineBetween(x1, cy - h / 2, x1, cy + h / 2);
    g.lineBetween(x2, cy - h / 2, x2, cy + h / 2);
  }
  // Curtain rod
  g.fillStyle(0x6b4226, 1);
  g.lineStyle(1, OUTLINE, 0.8);
  g.fillRect(cx - w / 2 - curtainW, cy - h / 2 - 8, w + curtainW * 2, 4);
  g.fillCircle(cx - w / 2 - curtainW + 2, cy - h / 2 - 6, 4);
  g.fillCircle(cx + w / 2 + curtainW - 2, cy - h / 2 - 6, 4);
}

function drawDoor(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  groundY: number,
  w = 110,
  h = 200,
): void {
  // Frame shadow
  g.fillStyle(0x000000, 0.15);
  g.fillRoundedRect(cx - w / 2 - 3, groundY - h, w + 6, h, 8);

  g.fillStyle(0x8a653c, 1);
  g.lineStyle(3, OUTLINE, 0.85);
  g.fillRoundedRect(cx - w / 2, groundY - h, w, h, 8);
  g.strokeRoundedRect(cx - w / 2, groundY - h, w, h, 8);

  // Two panel insets
  g.lineStyle(2, shade(0x8a653c, 0.5), 0.85);
  g.strokeRoundedRect(cx - w / 2 + 12, groundY - h + 16, w - 24, (h - 36) / 2 - 4, 6);
  g.strokeRoundedRect(cx - w / 2 + 12, groundY - h + 16 + (h - 36) / 2 + 4, w - 24, (h - 36) / 2 - 4, 6);

  // Knob with tiny shadow
  g.fillStyle(0x000000, 0.4);
  g.fillCircle(cx + w / 2 - 18, groundY - h / 2 + 1, 5);
  g.fillStyle(0xf6c177, 1);
  g.lineStyle(1.5, OUTLINE, 0.8);
  g.fillCircle(cx + w / 2 - 18, groundY - h / 2, 5);
  g.strokeCircle(cx + w / 2 - 18, groundY - h / 2, 5);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx + w / 2 - 19, groundY - h / 2 - 1, 1.5);
}

function drawPictureFrame(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 110,
  h = 80,
): void {
  // Drop shadow
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h, 4);

  g.fillStyle(0x6b4226, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
  g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);

  // Inner mat
  g.fillStyle(0xf6f3ec, 1);
  g.fillRect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8);

  // Picture
  g.fillStyle(0xa9d6f0, 1);
  g.fillRect(cx - w / 2 + 8, cy - h / 2 + 8, w - 16, h - 16);
  g.fillStyle(0x6abf69, 1);
  g.fillRect(cx - w / 2 + 8, cy + h / 6, w - 16, h / 3 - 8);
  g.fillStyle(0xffd45c, 1);
  g.fillCircle(cx + w / 4, cy - h / 4, 8);
  // Tiny bird
  g.lineStyle(1.6, OUTLINE, 0.8);
  g.beginPath();
  g.arc(cx - w / 4, cy - h / 6, 4, 1.05 * Math.PI, 1.95 * Math.PI, false);
  g.strokePath();
}

function drawRug(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  base: number,
  stripe: number,
): void {
  // Soft shadow under rug
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 4, w + 6, h + 6);

  g.fillStyle(base, 1);
  g.lineStyle(2, OUTLINE, 0.6);
  g.fillEllipse(cx, cy, w, h);
  g.strokeEllipse(cx, cy, w, h);
  g.fillStyle(stripe, 0.9);
  g.fillEllipse(cx, cy, w * 0.7, h * 0.7);
  g.fillStyle(base, 1);
  g.fillEllipse(cx, cy, w * 0.4, h * 0.4);
  // Tassels
  g.lineStyle(2, shade(base, 0.7), 0.85);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = cx - w / 2 + t * w;
    g.lineBetween(x, cy - h / 2 + 3, x, cy - h / 2 - 4);
    g.lineBetween(x, cy + h / 2 - 3, x, cy + h / 2 + 4);
  }
}

function drawCounter(
  g: Phaser.GameObjects.Graphics,
  groundY: number,
  fromX: number,
  toX: number,
): void {
  const top = 0xf2efe6;
  const cab = 0xc7a36a;
  const cabDark = shade(cab, 0.8);

  // Cabinets
  g.fillStyle(cab, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRect(fromX, groundY - 90, toX - fromX, 90);
  g.strokeRect(fromX, groundY - 90, toX - fromX, 90);

  // Door divisions
  const doors = Math.max(2, Math.floor((toX - fromX) / 80));
  g.lineStyle(2, cabDark, 0.7);
  for (let i = 1; i < doors; i++) {
    const x = fromX + (i * (toX - fromX)) / doors;
    g.lineBetween(x, groundY - 90, x, groundY);
  }
  // Each door gets a panel inset and a knob
  for (let i = 0; i < doors; i++) {
    const x = fromX + (i * (toX - fromX)) / doors + 6;
    const dw = (toX - fromX) / doors - 12;
    g.lineStyle(1.5, cabDark, 0.6);
    g.strokeRoundedRect(x, groundY - 80, dw, 64, 4);
    g.fillStyle(0xf6c177, 1);
    g.lineStyle(1, OUTLINE, 0.7);
    g.fillCircle(x + dw - 6, groundY - 14, 2.5);
  }

  // Cabinet bottom shadow
  g.fillStyle(0x000000, 0.18);
  g.fillRect(fromX, groundY - 4, toX - fromX, 4);

  // Counter top
  g.fillStyle(top, 1);
  g.lineStyle(2, OUTLINE, 0.9);
  g.fillRect(fromX - 4, groundY - 100, toX - fromX + 8, 12);
  g.strokeRect(fromX - 4, groundY - 100, toX - fromX + 8, 12);
  // Counter top sheen
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(fromX - 2, groundY - 99, toX - fromX + 4, 2);
}

function drawSink(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  // Basin
  g.fillStyle(0xe9eef3, 1);
  g.lineStyle(2, OUTLINE, 0.9);
  g.fillRoundedRect(cx - 36, cy - 8, 72, 18, 4);
  g.strokeRoundedRect(cx - 36, cy - 8, 72, 18, 4);
  // Inner basin
  g.fillStyle(shade(0xe9eef3, 0.85), 0.85);
  g.fillRoundedRect(cx - 32, cy - 4, 64, 10, 3);

  // Faucet
  g.fillStyle(0xb0bcc8, 1);
  g.lineStyle(1.5, OUTLINE, 0.85);
  g.fillRect(cx - 3, cy - 30, 6, 22);
  g.strokeRect(cx - 3, cy - 30, 6, 22);
  g.fillRect(cx - 16, cy - 30, 32, 5);
  g.strokeRect(cx - 16, cy - 30, 32, 5);
  // Faucet sheen
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(cx - 2, cy - 28, 1, 18);
}

function drawTub(g: Phaser.GameObjects.Graphics, cx: number, baseY: number): void {
  const w = 280;
  const h = 70;

  // Tub shadow under
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, baseY + 2, w * 0.95, 8);

  g.fillStyle(0xffffff, 1);
  g.lineStyle(3, OUTLINE, 0.9);
  g.fillRoundedRect(cx - w / 2, baseY - h, w, h, 22);
  g.strokeRoundedRect(cx - w / 2, baseY - h, w, h, 22);

  // Outer tub side highlight
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - w / 2 + 22, baseY - h + 4, w - 44, 2);

  // Water (slightly varying tones to suggest depth)
  g.fillStyle(0x9bcfe8, 1);
  g.fillRoundedRect(cx - w / 2 + 12, baseY - h + 14, w - 24, h - 26, 16);
  g.fillStyle(0xb6dceb, 0.8);
  g.fillRect(cx - w / 2 + 16, baseY - h + 18, w - 32, 6);

  // Bubbles
  g.lineStyle(1, OUTLINE, 0.5);
  for (const [bx, by, br] of [
    [-80, -h + 10, 11],
    [-50, -h + 4, 8],
    [-20, -h + 8, 6],
    [30, -h + 8, 12],
    [70, -h + 4, 9],
    [95, -h + 12, 7],
  ] as [number, number, number][]) {
    g.fillStyle(0xffffff, 0.92);
    g.fillCircle(cx + bx, baseY + by, br);
    g.strokeCircle(cx + bx, baseY + by, br);
    // Bubble shine
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + bx - br * 0.4, baseY + by - br * 0.4, br * 0.25);
  }
}

function drawTowelRail(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xb0bcc8, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRect(cx - 60, cy, 120, 4);
  g.strokeRect(cx - 60, cy, 120, 4);
  // Rail shine
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(cx - 58, cy + 1, 116, 1);

  // Towel with vertical fold lines
  g.fillStyle(0xf6c177, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRoundedRect(cx - 26, cy + 4, 50, 32, 4);
  g.strokeRoundedRect(cx - 26, cy + 4, 50, 32, 4);
  g.lineStyle(1, shade(0xf6c177, 0.7), 0.7);
  for (let i = 1; i < 4; i++) {
    const x = cx - 26 + (i * 50) / 4;
    g.lineBetween(x, cy + 6, x, cy + 34);
  }
}

function drawLamp(g: Phaser.GameObjects.Graphics, cx: number, ceilingY: number): void {
  // Cord
  g.lineStyle(2, OUTLINE, 0.9);
  g.lineBetween(cx, ceilingY, cx, ceilingY + 30);
  // Shade
  const shadeCol = 0xf6c177;
  g.fillStyle(shadeCol, 1);
  g.beginPath();
  g.moveTo(cx - 24, ceilingY + 30);
  g.lineTo(cx + 24, ceilingY + 30);
  g.lineTo(cx + 16, ceilingY + 60);
  g.lineTo(cx - 16, ceilingY + 60);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Shade highlight
  g.fillStyle(shade(shadeCol, 1.25), 0.55);
  g.beginPath();
  g.moveTo(cx - 22, ceilingY + 32);
  g.lineTo(cx - 14, ceilingY + 32);
  g.lineTo(cx - 12, ceilingY + 58);
  g.lineTo(cx - 18, ceilingY + 58);
  g.closePath();
  g.fillPath();
  // Glow
  g.fillStyle(0xfff4d6, 0.6);
  g.fillEllipse(cx, ceilingY + 78, 70, 26);
  g.fillStyle(0xfff4d6, 0.3);
  g.fillEllipse(cx, ceilingY + 84, 110, 38);
}

function drawClock(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r = 26): void {
  // Drop shadow
  g.fillStyle(0x000000, 0.2);
  g.fillCircle(cx + 2, cy + 2, r);
  // Body
  g.fillStyle(0xfdfaf3, 1);
  g.lineStyle(3, OUTLINE, 0.9);
  g.fillCircle(cx, cy, r);
  g.strokeCircle(cx, cy, r);
  // Inner ring
  g.lineStyle(1.5, shade(0xfdfaf3, 0.8), 0.85);
  g.strokeCircle(cx, cy, r - 4);
  // Hour markers
  g.fillStyle(OUTLINE, 0.95);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a) * (r - 4);
    const y1 = cy + Math.sin(a) * (r - 4);
    g.fillCircle(x1, y1, i % 3 === 0 ? 2 : 1);
  }
  // Hands
  g.lineStyle(2.5, OUTLINE, 0.95);
  g.lineBetween(cx, cy, cx, cy - r * 0.55);
  g.lineStyle(2, OUTLINE, 0.95);
  g.lineBetween(cx, cy, cx + r * 0.65, cy - r * 0.1);
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, cy, 2);
}

function drawPlant(g: Phaser.GameObjects.Graphics, cx: number, baseY: number): void {
  // Pot
  const potW = 50;
  const potH = 38;
  // Shadow
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, baseY, potW + 4, 8);
  // Pot body (trapezoid)
  g.fillStyle(0xc77a55, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.beginPath();
  g.moveTo(cx - potW / 2, baseY - potH);
  g.lineTo(cx + potW / 2, baseY - potH);
  g.lineTo(cx + potW / 2 - 6, baseY);
  g.lineTo(cx - potW / 2 + 6, baseY);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Rim
  g.fillStyle(shade(0xc77a55, 0.8), 1);
  g.fillRect(cx - potW / 2 - 2, baseY - potH - 4, potW + 4, 6);
  g.strokeRect(cx - potW / 2 - 2, baseY - potH - 4, potW + 4, 6);

  // Foliage (5 overlapping leaves)
  const leafCol = 0x4f9d56;
  const leafLight = shade(leafCol, 1.25);
  g.fillStyle(leafCol, 1);
  g.lineStyle(2, OUTLINE, 0.7);
  const leaves: [number, number, number, number][] = [
    [-12, -22, 18, 36],
    [12, -28, 18, 36],
    [0, -38, 22, 30],
    [-22, -16, 16, 28],
    [22, -16, 16, 28],
  ];
  for (const [dx, dy, lw, lh] of leaves) {
    g.fillEllipse(cx + dx, baseY - potH + dy, lw, lh);
    g.strokeEllipse(cx + dx, baseY - potH + dy, lw, lh);
  }
  g.fillStyle(leafLight, 0.55);
  for (const [dx, dy, lw, lh] of leaves) {
    g.fillEllipse(cx + dx - lw * 0.18, baseY - potH + dy - lh * 0.18, lw * 0.4, lh * 0.4);
  }
}

function drawShelf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 120,
): void {
  // Plank
  g.fillStyle(0x8a5a2c, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRect(cx - w / 2, cy, w, 8);
  g.strokeRect(cx - w / 2, cy, w, 8);
  // Brackets
  g.fillStyle(0x6b4226, 1);
  g.beginPath();
  g.moveTo(cx - w / 2 + 4, cy + 8);
  g.lineTo(cx - w / 2 + 4, cy + 22);
  g.lineTo(cx - w / 2 + 14, cy + 8);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(cx + w / 2 - 4, cy + 8);
  g.lineTo(cx + w / 2 - 4, cy + 22);
  g.lineTo(cx + w / 2 - 14, cy + 8);
  g.closePath();
  g.fillPath();
  // Items on shelf
  g.fillStyle(0xd96b6b, 1);
  g.lineStyle(1.5, OUTLINE, 0.8);
  g.fillCircle(cx - w / 4, cy - 8, 8);
  g.strokeCircle(cx - w / 4, cy - 8, 8);
  g.fillStyle(0x6e9bd4, 1);
  g.fillRect(cx - 6, cy - 18, 12, 18);
  g.strokeRect(cx - 6, cy - 18, 12, 18);
  g.fillStyle(0x6abf69, 1);
  g.fillCircle(cx + w / 4, cy - 6, 6);
  g.strokeCircle(cx + w / 4, cy - 6, 6);
}

function drawMirror(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w = 130,
  h = 90,
): void {
  // Drop shadow
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(x + 3, y + 3, w, h, 8);
  // Frame
  g.fillStyle(0xb0bcc8, 1);
  g.lineStyle(3, OUTLINE, 0.85);
  g.fillRoundedRect(x, y, w, h, 8);
  g.strokeRoundedRect(x, y, w, h, 8);
  // Glass
  g.fillStyle(0xeaf3fa, 1);
  g.fillRoundedRect(x + 6, y + 6, w - 12, h - 12, 5);
  // Streaky highlights to suggest reflection
  g.fillStyle(0xffffff, 0.55);
  g.beginPath();
  g.moveTo(x + 14, y + 12);
  g.lineTo(x + 26, y + 12);
  g.lineTo(x + 14, y + h - 12);
  g.lineTo(x + 8, y + h - 12);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 0.35);
  g.fillRect(x + w - 18, y + 16, 4, h - 32);
}

// ---------- per-room composition ----------

function drawLiving(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.living!;
  drawWalls(g, p);
  drawFloor(g, p);
  drawLamp(g, ROOM_W * 0.5, 0);
  drawWindow(g, ROOM_W * 0.25, FLOOR_Y * 0.4);
  drawPictureFrame(g, ROOM_W * 0.62, FLOOR_Y * 0.32);
  drawClock(g, ROOM_W * 0.62, FLOOR_Y * 0.65, 22);
  drawDoor(g, ROOM_W * 0.88, FLOOR_Y);
  drawRug(g, ROOM_W * 0.5, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.65, 380, 110, 0xe27d60, 0xf6c177);
  drawPlant(g, ROOM_W * 0.06, FLOOR_Y + 4);
}

function drawKitchen(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.kitchen!;
  drawWalls(g, p);
  drawFloor(g, p);
  drawLamp(g, ROOM_W * 0.3, 0);
  drawWindow(g, ROOM_W * 0.32, FLOOR_Y * 0.4);
  drawShelf(g, ROOM_W * 0.18, FLOOR_Y * 0.7);
  drawCounter(g, FLOOR_Y, ROOM_W * 0.55, ROOM_W * 0.95);
  drawSink(g, ROOM_W * 0.62, FLOOR_Y - 100);
  drawClock(g, ROOM_W * 0.85, FLOOR_Y * 0.25, 22);
}

function drawBath(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.bath!;
  drawWalls(g, p);
  drawFloor(g, p);
  drawMirror(g, ROOM_W * 0.18, FLOOR_Y * 0.18);
  drawTowelRail(g, ROOM_W * 0.78, FLOOR_Y * 0.55);
  drawTub(g, ROOM_W * 0.6, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.7);
  drawPlant(g, ROOM_W * 0.08, FLOOR_Y + 4);
}

function drawBedroom(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.bedroom!;
  drawWalls(g, p);
  drawFloor(g, p);
  drawLamp(g, ROOM_W * 0.7, 0);
  drawWindow(g, ROOM_W * 0.5, FLOOR_Y * 0.4, 260, 180);
  drawRug(g, ROOM_W * 0.5, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.7, 320, 100, 0x9b6ec1, 0xe2c7e0);
  drawPictureFrame(g, ROOM_W * 0.18, FLOOR_Y * 0.32);
  drawClock(g, ROOM_W * 0.85, FLOOR_Y * 0.32, 22);
  drawShelf(g, ROOM_W * 0.18, FLOOR_Y * 0.65);
}

const roomDrawers: Record<string, (g: Phaser.GameObjects.Graphics) => void> = {
  living: drawLiving,
  kitchen: drawKitchen,
  bath: drawBath,
  bedroom: drawBedroom,
};

export function bakeRoomTextures(scene: Phaser.Scene): void {
  for (const loc of Object.values(LOCATIONS)) {
    for (const room of loc.rooms) {
      const key = TextureKeys.room(loc.id, room.id);
      const drawer = roomDrawers[room.id];
      if (drawer) {
        bakeTexture(scene, key, ROOM_W, ROOM_H, (g) => drawer(g));
      } else {
        bakeTexture(scene, key, ROOM_W, ROOM_H, (g) => {
          // Plain fallback so unknown rooms remain visible.
          const p = palettes[room.id] ?? palettes.living!;
          drawWalls(g, p);
          drawFloor(g, p);
        });
      }
    }
  }
}

export const ROOM_TEXTURE_SIZE = { w: ROOM_W, h: ROOM_H };

// Re-export for other modules that just want the dim helpers.
export { mix };
