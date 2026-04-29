import Phaser from "phaser";
import { LOCATIONS } from "../data/locations";
import { TextureKeys } from "../data/outfits";
import { bakeTexture } from "./textureFactory";
import { OUTLINE, mix, shade } from "./colorUtils";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

const ROOM_W = GAME_WIDTH - 80;
const ROOM_H = GAME_HEIGHT - 260;
const FLOOR_Y = ROOM_H * 0.55;

interface RoomPalette {
  wall: number;
  wallAccent: number;
  floor: number;
  floorAccent: number;
}

const palettes: Record<string, RoomPalette> = {
  living: { wall: 0xf2d6b5, wallAccent: 0xe7c19b, floor: 0xa37d4e, floorAccent: 0x8a653c },
  kitchen: { wall: 0xc8e1d4, wallAccent: 0xa9d0bd, floor: 0xe7e3d0, floorAccent: 0xc7c2a8 },
  bath: { wall: 0xbcd8e8, wallAccent: 0x99c4dc, floor: 0xe9eef3, floorAccent: 0xb8c7d3 },
  bedroom: { wall: 0xe2c7e0, wallAccent: 0xc8a6c5, floor: 0xa37d4e, floorAccent: 0x7a5b36 },
};

function drawWalls(g: Phaser.GameObjects.Graphics, palette: RoomPalette): void {
  // Wall fill
  g.fillStyle(palette.wall, 1);
  g.fillRect(0, 0, ROOM_W, FLOOR_Y);

  // Wallpaper accent stripes (vertical, very subtle)
  g.fillStyle(palette.wallAccent, 0.5);
  for (let x = 30; x < ROOM_W; x += 60) {
    g.fillRect(x, 0, 4, FLOOR_Y);
  }

  // Baseboard
  g.fillStyle(shade(palette.floor, 0.6), 1);
  g.fillRect(0, FLOOR_Y - 8, ROOM_W, 8);
}

function drawFloor(g: Phaser.GameObjects.Graphics, palette: RoomPalette, kind: "wood" | "tile"): void {
  g.fillStyle(palette.floor, 1);
  g.fillRect(0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y);

  if (kind === "wood") {
    // Plank lines
    g.fillStyle(palette.floorAccent, 0.85);
    for (let x = 0; x < ROOM_W; x += 110) {
      g.fillRect(x + 28, FLOOR_Y, 2, ROOM_H - FLOOR_Y);
    }
    // Subtle horizontal seam
    g.fillRect(0, FLOOR_Y + (ROOM_H - FLOOR_Y) / 2, ROOM_W, 1);
  } else {
    // Tile grid
    g.fillStyle(palette.floorAccent, 0.85);
    const tile = 60;
    for (let x = 0; x < ROOM_W; x += tile) g.fillRect(x, FLOOR_Y, 2, ROOM_H - FLOOR_Y);
    for (let y = FLOOR_Y; y < ROOM_H; y += tile) g.fillRect(0, y, ROOM_W, 2);
  }
}

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

  // Sky pane
  g.fillStyle(0xa9d6f0, 1);
  g.fillRect(cx - w / 2 + 8, cy - h / 2 + 8, w - 16, h - 16);

  // Sun
  g.fillStyle(0xffd45c, 1);
  g.fillCircle(cx + w / 2 - 30, cy - h / 2 + 30, 12);

  // Hills
  g.fillStyle(0x6abf69, 1);
  g.fillEllipse(cx - w / 4, cy + h / 4 - 10, w * 0.6, h * 0.4);
  g.fillStyle(shade(0x6abf69, 0.8), 1);
  g.fillEllipse(cx + w / 4, cy + h / 4, w * 0.5, h * 0.35);

  // Window cross
  g.lineStyle(3, OUTLINE, 0.8);
  g.lineBetween(cx, cy - h / 2 + 8, cx, cy + h / 2 - 8);
  g.lineBetween(cx - w / 2 + 8, cy, cx + w / 2 - 8, cy);
}

function drawDoor(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  groundY: number,
  w = 110,
  h = 200,
): void {
  g.fillStyle(0x8a653c, 1);
  g.lineStyle(3, OUTLINE, 0.85);
  g.fillRoundedRect(cx - w / 2, groundY - h, w, h, 8);
  g.strokeRoundedRect(cx - w / 2, groundY - h, w, h, 8);

  // Panel inset
  g.lineStyle(2, shade(0x8a653c, 0.6), 0.8);
  g.strokeRoundedRect(cx - w / 2 + 12, groundY - h + 16, w - 24, h - 36, 6);

  // Knob
  g.fillStyle(0xf6c177, 1);
  g.lineStyle(1.5, OUTLINE, 0.8);
  g.fillCircle(cx + w / 2 - 18, groundY - h / 2, 4);
  g.strokeCircle(cx + w / 2 - 18, groundY - h / 2, 4);
}

function drawPictureFrame(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 110,
  h = 80,
): void {
  g.fillStyle(0x6b4226, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
  g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);

  // Picture (abstract scene)
  g.fillStyle(0xa9d6f0, 1);
  g.fillRect(cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12);
  g.fillStyle(0x6abf69, 1);
  g.fillRect(cx - w / 2 + 6, cy + h / 6, w - 12, h / 3 - 6);
  g.fillStyle(0xffd45c, 1);
  g.fillCircle(cx + w / 4, cy - h / 4, 8);
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
  g.fillStyle(base, 1);
  g.lineStyle(2, OUTLINE, 0.6);
  g.fillEllipse(cx, cy, w, h);
  g.strokeEllipse(cx, cy, w, h);
  g.fillStyle(stripe, 0.9);
  g.fillEllipse(cx, cy, w * 0.7, h * 0.7);
  g.fillStyle(base, 1);
  g.fillEllipse(cx, cy, w * 0.4, h * 0.4);
}

function drawCounter(
  g: Phaser.GameObjects.Graphics,
  groundY: number,
  fromX: number,
  toX: number,
): void {
  const top = 0xf2efe6;
  const cab = 0xc7a36a;

  // Cabinets
  g.fillStyle(cab, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRect(fromX, groundY - 90, toX - fromX, 90);
  g.strokeRect(fromX, groundY - 90, toX - fromX, 90);

  // Door divisions
  const doors = Math.max(2, Math.floor((toX - fromX) / 80));
  for (let i = 1; i < doors; i++) {
    const x = fromX + (i * (toX - fromX)) / doors;
    g.lineBetween(x, groundY - 90, x, groundY);
  }
  for (let i = 0; i < doors; i++) {
    const x = fromX + (i * (toX - fromX)) / doors + 6;
    g.fillStyle(0xf6c177, 1);
    g.fillCircle(x + 8, groundY - 10, 2);
  }

  // Counter top
  g.fillStyle(top, 1);
  g.lineStyle(2, OUTLINE, 0.9);
  g.fillRect(fromX - 4, groundY - 100, toX - fromX + 8, 12);
  g.strokeRect(fromX - 4, groundY - 100, toX - fromX + 8, 12);
}

function drawSink(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xe9eef3, 1);
  g.lineStyle(2, OUTLINE, 0.9);
  g.fillRoundedRect(cx - 36, cy - 8, 72, 18, 4);
  g.strokeRoundedRect(cx - 36, cy - 8, 72, 18, 4);

  // Faucet
  g.fillStyle(0xb0bcc8, 1);
  g.fillRect(cx - 3, cy - 30, 6, 22);
  g.strokeRect(cx - 3, cy - 30, 6, 22);
  g.fillRect(cx - 16, cy - 30, 32, 5);
  g.strokeRect(cx - 16, cy - 30, 32, 5);
}

function drawTub(g: Phaser.GameObjects.Graphics, cx: number, baseY: number): void {
  const w = 280;
  const h = 70;

  g.fillStyle(0xffffff, 1);
  g.lineStyle(3, OUTLINE, 0.9);
  g.fillRoundedRect(cx - w / 2, baseY - h, w, h, 22);
  g.strokeRoundedRect(cx - w / 2, baseY - h, w, h, 22);

  // Water
  g.fillStyle(0xa9d6f0, 0.9);
  g.fillRoundedRect(cx - w / 2 + 12, baseY - h + 14, w - 24, h - 26, 16);

  // Bubbles
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 80, baseY - h + 10, 10);
  g.fillCircle(cx - 50, baseY - h + 4, 8);
  g.fillCircle(cx + 30, baseY - h + 8, 12);
  g.fillCircle(cx + 80, baseY - h + 4, 9);
}

function drawTowelRail(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0xb0bcc8, 1);
  g.lineStyle(2, OUTLINE, 0.85);
  g.fillRect(cx - 60, cy, 120, 4);
  g.strokeRect(cx - 60, cy, 120, 4);
  // Towel
  g.fillStyle(0xf6c177, 1);
  g.fillRoundedRect(cx - 26, cy + 4, 50, 32, 4);
  g.strokeRoundedRect(cx - 26, cy + 4, 50, 32, 4);
}

function drawLamp(g: Phaser.GameObjects.Graphics, cx: number, ceilingY: number): void {
  // Cord
  g.lineStyle(2, OUTLINE, 0.9);
  g.lineBetween(cx, ceilingY, cx, ceilingY + 30);
  // Shade
  g.fillStyle(0xf6c177, 1);
  g.beginPath();
  g.moveTo(cx - 24, ceilingY + 30);
  g.lineTo(cx + 24, ceilingY + 30);
  g.lineTo(cx + 16, ceilingY + 60);
  g.lineTo(cx - 16, ceilingY + 60);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Glow
  g.fillStyle(0xfff4d6, 0.55);
  g.fillEllipse(cx, ceilingY + 78, 60, 22);
}

// ---------- per-room composition ----------

function drawLiving(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.living!;
  drawWalls(g, p);
  drawFloor(g, p, "wood");
  drawLamp(g, ROOM_W * 0.5, 0);
  drawWindow(g, ROOM_W * 0.25, FLOOR_Y * 0.4);
  drawPictureFrame(g, ROOM_W * 0.62, FLOOR_Y * 0.35);
  drawDoor(g, ROOM_W * 0.85, FLOOR_Y);
  drawRug(g, ROOM_W * 0.5, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.65, 380, 110, 0xe27d60, 0xf6c177);
}

function drawKitchen(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.kitchen!;
  drawWalls(g, p);
  drawFloor(g, p, "tile");
  drawLamp(g, ROOM_W * 0.3, 0);
  drawWindow(g, ROOM_W * 0.32, FLOOR_Y * 0.4);
  drawCounter(g, FLOOR_Y, ROOM_W * 0.55, ROOM_W * 0.95);
  drawSink(g, ROOM_W * 0.62, FLOOR_Y - 100);
}

function drawBath(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.bath!;
  drawWalls(g, p);
  drawFloor(g, p, "tile");
  // Mirror
  g.fillStyle(0xeaf3fa, 1);
  g.lineStyle(3, OUTLINE, 0.8);
  g.fillRoundedRect(ROOM_W * 0.18, FLOOR_Y * 0.18, 130, 90, 8);
  g.strokeRoundedRect(ROOM_W * 0.18, FLOOR_Y * 0.18, 130, 90, 8);
  drawTowelRail(g, ROOM_W * 0.78, FLOOR_Y * 0.55);
  drawTub(g, ROOM_W * 0.6, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.7);
}

function drawBedroom(g: Phaser.GameObjects.Graphics): void {
  const p = palettes.bedroom!;
  drawWalls(g, p);
  drawFloor(g, p, "wood");
  drawLamp(g, ROOM_W * 0.7, 0);
  drawWindow(g, ROOM_W * 0.5, FLOOR_Y * 0.4, 260, 180);
  drawRug(g, ROOM_W * 0.5, FLOOR_Y + (ROOM_H - FLOOR_Y) * 0.7, 320, 100, 0x9b6ec1, 0xe2c7e0);
  drawPictureFrame(g, ROOM_W * 0.18, FLOOR_Y * 0.35);
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
          drawFloor(g, p, "wood");
        });
      }
    }
  }
}

export const ROOM_TEXTURE_SIZE = { w: ROOM_W, h: ROOM_H };

// Re-export for other modules that just want the dim helpers.
export { mix };
