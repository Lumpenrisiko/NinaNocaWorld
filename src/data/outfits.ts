import type { OutfitState } from "../state/types";

export interface SkinToneOption {
  id: string;
  label: string;
  color: number;
}

export type HairStyle = "short" | "long" | "curly" | "spiky" | "ponytail";

export interface HairOption {
  id: string;
  label: string;
  color: number;
  style: HairStyle;
}

export interface TopOption {
  id: string;
  label: string;
  color: number;
}

export type BottomStyle = "long" | "short" | "skirt";

export interface BottomOption {
  id: string;
  label: string;
  color: number;
  style: BottomStyle;
}

export type ShoeStyle = "sneaker" | "boot" | "sandal";

export interface ShoeOption {
  id: string;
  label: string;
  color: number;
  style: ShoeStyle;
}

export const SKIN_TONES: SkinToneOption[] = [
  { id: "light", label: "Hell", color: 0xf6d8b5 },
  { id: "warm", label: "Warm", color: 0xe5b48a },
  { id: "tan", label: "Sonnig", color: 0xc99565 },
  { id: "deep", label: "Tief", color: 0x8b5a3c },
  { id: "cool", label: "Kühl", color: 0xd9b896 },
];

export const HAIRS: HairOption[] = [
  { id: "short", label: "Kurz", color: 0x3a2818, style: "short" },
  { id: "long", label: "Lang", color: 0x6b4226, style: "long" },
  { id: "curly", label: "Locken", color: 0xc46a3a, style: "curly" },
  { id: "spiky", label: "Stacheln", color: 0xfddc5c, style: "spiky" },
  { id: "ponytail", label: "Zopf", color: 0x222222, style: "ponytail" },
];

export const TOPS: TopOption[] = [
  { id: "redshirt", label: "Rotes Shirt", color: 0xd9534f },
  { id: "blueshirt", label: "Blaues Shirt", color: 0x4a7fc1 },
  { id: "greenshirt", label: "Grünes Shirt", color: 0x6abf69 },
  { id: "yellowshirt", label: "Gelbes Shirt", color: 0xf6c177 },
  { id: "purpleshirt", label: "Lila Shirt", color: 0x9b6ec1 },
];

export const BOTTOMS: BottomOption[] = [
  { id: "jeans", label: "Jeans", color: 0x2e4a7a, style: "long" },
  { id: "shorts", label: "Shorts", color: 0x6abf69, style: "short" },
  { id: "skirt", label: "Rock", color: 0xd96bb1, style: "skirt" },
  { id: "khaki", label: "Khaki", color: 0xa68a5b, style: "long" },
];

export const SHOES: ShoeOption[] = [
  { id: "sneakers", label: "Sneaker", color: 0xffffff, style: "sneaker" },
  { id: "boots", label: "Stiefel", color: 0x3a2818, style: "boot" },
  { id: "sandals", label: "Sandalen", color: 0xc99565, style: "sandal" },
];

export const DEFAULT_OUTFIT: OutfitState = {
  skinTone: SKIN_TONES[0]!.id,
  hair: HAIRS[0]!.id,
  top: TOPS[0]!.id,
  bottom: BOTTOMS[0]!.id,
  shoes: SHOES[0]!.id,
};

function lookup<T extends { id: string }>(list: T[], id: string): T {
  return list.find((o) => o.id === id) ?? list[0]!;
}

export const OutfitCatalog = {
  skin: (id: string) => lookup(SKIN_TONES, id),
  hair: (id: string) => lookup(HAIRS, id),
  top: (id: string) => lookup(TOPS, id),
  bottom: (id: string) => lookup(BOTTOMS, id),
  shoes: (id: string) => lookup(SHOES, id),
};

export const TextureKeys = {
  skin: (id: string) => `skin:${id}`,
  hair: (id: string) => `hair:${id}`,
  top: (id: string) => `top:${id}`,
  bottom: (id: string) => `bottom:${id}`,
  shoes: (id: string) => `shoes:${id}`,
  item: (id: string) => `item:${id}`,
  room: (locId: string, roomId: string) => `room:${locId}:${roomId}`,
};

/** Character canvas size — every character layer texture has these dimensions
 *  so they stack pixel-perfectly when placed at the same Container origin. */
export const CHARACTER_CANVAS = { w: 100, h: 190 } as const;
