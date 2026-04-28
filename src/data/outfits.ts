import type { OutfitState } from "../state/types";

export interface SkinToneOption {
  id: string;
  label: string;
  color: number;
}

export interface HairOption {
  id: string;
  label: string;
  color: number;
  /** Crown size relative to head, in pixels. */
  width: number;
  height: number;
  /** Vertical offset (positive = lower over forehead). */
  offsetY: number;
}

export interface ClothingOption {
  id: string;
  label: string;
  color: number;
}

export interface ShoeOption {
  id: string;
  label: string;
  color: number;
}

export const SKIN_TONES: SkinToneOption[] = [
  { id: "light", label: "Hell", color: 0xf6d8b5 },
  { id: "warm", label: "Warm", color: 0xe5b48a },
  { id: "tan", label: "Sonnig", color: 0xc99565 },
  { id: "deep", label: "Tief", color: 0x8b5a3c },
  { id: "cool", label: "Kühl", color: 0xd9b896 },
];

export const HAIRS: HairOption[] = [
  { id: "short", label: "Kurz", color: 0x3a2818, width: 70, height: 22, offsetY: 0 },
  { id: "long", label: "Lang", color: 0x6b4226, width: 78, height: 60, offsetY: 16 },
  { id: "curly", label: "Locken", color: 0xc46a3a, width: 86, height: 34, offsetY: 4 },
  { id: "spiky", label: "Stacheln", color: 0xfddc5c, width: 70, height: 30, offsetY: -4 },
  { id: "ponytail", label: "Zopf", color: 0x222222, width: 70, height: 26, offsetY: 0 },
];

export const TOPS: ClothingOption[] = [
  { id: "redshirt", label: "Rotes Shirt", color: 0xd9534f },
  { id: "blueshirt", label: "Blaues Shirt", color: 0x4a7fc1 },
  { id: "greenshirt", label: "Grünes Shirt", color: 0x6abf69 },
  { id: "yellowshirt", label: "Gelbes Shirt", color: 0xf6c177 },
  { id: "purpleshirt", label: "Lila Shirt", color: 0x9b6ec1 },
];

export const BOTTOMS: ClothingOption[] = [
  { id: "jeans", label: "Jeans", color: 0x2e4a7a },
  { id: "shorts", label: "Shorts", color: 0x6abf69 },
  { id: "skirt", label: "Rock", color: 0xd96bb1 },
  { id: "khaki", label: "Khaki", color: 0xa68a5b },
];

export const SHOES: ShoeOption[] = [
  { id: "sneakers", label: "Sneaker", color: 0xffffff },
  { id: "boots", label: "Stiefel", color: 0x3a2818 },
  { id: "sandals", label: "Sandalen", color: 0xc99565 },
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
