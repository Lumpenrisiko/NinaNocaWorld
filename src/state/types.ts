export type Vec2 = { x: number; y: number };

export type ItemCategory = "furniture" | "food" | "toy";

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  /** Width and height in world pixels (for placeholders). */
  size: Vec2;
  /** Optional sprite key (Phase 3+); placeholders ignore this. */
  spriteKey?: string;
}

export interface ItemInstance {
  /** Unique instance id (so two sofas can coexist). */
  instanceId: string;
  defId: string;
}

export interface PlacedItem extends ItemInstance {
  position: Vec2;
}

export interface OutfitState {
  skinTone: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  /** Default outfit when this character first enters the world. */
  defaultOutfit: OutfitState;
}

export interface CharacterState {
  defId: string;
  position: {
    locationId: string;
    roomId: string;
    x: number;
    y: number;
  };
  /** Items the character is carrying; reisen mit. */
  inventory: ItemInstance[];
  /** Outfit layers — typed in Phase 2. */
  outfit: OutfitState;
}

export interface RoomState {
  /** Items freely placed in the room (not held by a character). */
  items: PlacedItem[];
}

export interface LocationState {
  rooms: Record<string, RoomState>;
}

export interface SaveData {
  version: number;
  characters: Record<string, CharacterState>;
  world: Record<string, LocationState>;
  /** Inventar, das niemandem gehört (Welt-Pool). Slice nutzt es als Start-Pool. */
  worldInventory: ItemInstance[];
  activeCharacterId: string;
  activeLocationId: string;
  activeRoomId: string;
}
