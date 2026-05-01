import { ITEMS } from "./items";
import { LOCATIONS } from "./locations";
import {
  BOTTOMS,
  CHARACTER_CANVAS,
  HAIRS,
  SHOES,
  SKIN_TONES,
  TOPS,
  TextureKeys,
} from "./outfits";

/**
 * Optional vector-asset overrides.
 *
 * Each entry tells the PreloadScene "instead of drawing the texture for this
 * key procedurally, raster the given SVG at the given size and use that".
 * The procedural pipeline (`src/graphics/draw*.ts`) stays as the fallback
 * for any key not listed here, so you can migrate one asset at a time.
 *
 * SVG files live in `public/assets/svg/` so Vite serves them as static
 * resources. Drop a new SVG, add an entry, the next reload uses it.
 *
 * Example:
 *   { key: TextureKeys.item("apple"), path: "assets/svg/items/apple.svg",
 *     width: 50, height: 50 }
 */
export interface AssetEntry {
  key: string;
  path: string;
  width: number;
  height: number;
}

export const ASSET_MANIFEST: AssetEntry[] = [
  // Demo entry: the procedural apple is replaced with a vector SVG that
  // uses radial/linear gradients (which Phaser.Graphics can't produce
  // directly). Comment out to fall back to procedural and compare.
  // See `public/assets/svg/README.md` for the complete migration guide.
  {
    key: TextureKeys.item("apple"),
    path: "assets/svg/items/apple.svg",
    width: 50,
    height: 50,
  },
];

// ---------- helpers for new entries ----------

/**
 * Resolves the texture-key/dimensions for any procedurally-known asset, so
 * adding a manifest entry is just `assetEntry("item", "apple", "...path...")`
 * without having to remember the size.
 */
type Category = "skin" | "hair" | "top" | "bottom" | "shoes" | "item" | "room";

const CHAR_LAYER_DIMS = { width: CHARACTER_CANVAS.w, height: CHARACTER_CANVAS.h };

export function assetEntry(category: Category, id: string, path: string, roomId?: string): AssetEntry {
  switch (category) {
    case "skin":
    case "hair":
    case "top":
    case "bottom":
    case "shoes":
      return { key: TextureKeys[category](id), path, ...CHAR_LAYER_DIMS };
    case "item": {
      const def = ITEMS[id];
      if (!def) throw new Error(`Unknown item id "${id}"`);
      return { key: TextureKeys.item(id), path, width: def.size.x, height: def.size.y };
    }
    case "room": {
      if (!roomId) throw new Error(`Room asset entry needs locationId AND roomId`);
      const loc = LOCATIONS[id];
      if (!loc) throw new Error(`Unknown location id "${id}"`);
      const room = loc.rooms.find((r) => r.id === roomId);
      if (!room) throw new Error(`Unknown room "${roomId}" in "${id}"`);
      // Rooms always render at the room view size (constant for now).
      // Importing the constant directly would create a circular dependency
      // through scenes; we re-derive it from config to stay independent.
      return { key: TextureKeys.room(id, roomId), path, width: 1200, height: 460 };
    }
  }
}

/**
 * Sanity check: warns at startup about manifest entries pointing to missing
 * texture keys (typo guard). Cheap because it just walks the data catalogs.
 */
export function validateManifest(): string[] {
  const known = new Set<string>();
  for (const s of SKIN_TONES) known.add(TextureKeys.skin(s.id));
  for (const h of HAIRS) known.add(TextureKeys.hair(h.id));
  for (const t of TOPS) known.add(TextureKeys.top(t.id));
  for (const b of BOTTOMS) known.add(TextureKeys.bottom(b.id));
  for (const s of SHOES) known.add(TextureKeys.shoes(s.id));
  for (const id of Object.keys(ITEMS)) known.add(TextureKeys.item(id));
  for (const loc of Object.values(LOCATIONS)) {
    for (const r of loc.rooms) known.add(TextureKeys.room(loc.id, r.id));
  }
  return ASSET_MANIFEST.filter((e) => !known.has(e.key)).map((e) => e.key);
}
