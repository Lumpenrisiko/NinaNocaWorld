import type { ItemDefinition } from "../state/types";

export const ITEMS: Record<string, ItemDefinition> = {
  sofa: {
    id: "sofa",
    name: "Sofa",
    category: "furniture",
    size: { x: 140, y: 70 },
  },
  bed: {
    id: "bed",
    name: "Bett",
    category: "furniture",
    size: { x: 160, y: 90 },
  },
  table: {
    id: "table",
    name: "Tisch",
    category: "furniture",
    size: { x: 110, y: 70 },
  },
  apple: {
    id: "apple",
    name: "Apfel",
    category: "food",
    size: { x: 50, y: 50 },
  },
  bread: {
    id: "bread",
    name: "Brot",
    category: "food",
    size: { x: 70, y: 50 },
  },
  ball: {
    id: "ball",
    name: "Ball",
    category: "toy",
    size: { x: 55, y: 55 },
  },
  teddy: {
    id: "teddy",
    name: "Teddy",
    category: "toy",
    size: { x: 60, y: 70 },
  },
};

export function getItemDef(defId: string): ItemDefinition {
  const def = ITEMS[defId];
  if (!def) throw new Error(`Unknown item: ${defId}`);
  return def;
}
