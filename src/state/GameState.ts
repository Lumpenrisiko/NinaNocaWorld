import type {
  CharacterState,
  ItemInstance,
  LocationState,
  OutfitState,
  PlacedItem,
  RoomState,
  SaveData,
  Vec2,
} from "./types";

type Listener = () => void;

/**
 * Single source of truth across scenes. Scenes never hold state themselves;
 * they read/write here and listen for changes.
 */
class GameStateStore {
  private data!: SaveData;
  private listeners = new Set<Listener>();

  init(initial: SaveData): void {
    this.data = initial;
  }

  get snapshot(): SaveData {
    return this.data;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  // --- character ---

  get activeCharacter(): CharacterState {
    const c = this.data.characters[this.data.activeCharacterId];
    if (!c) throw new Error(`No active character: ${this.data.activeCharacterId}`);
    return c;
  }

  setActiveCharacter(id: string): void {
    if (!this.data.characters[id]) throw new Error(`Unknown character: ${id}`);
    this.data.activeCharacterId = id;
    this.emit();
  }

  moveCharacter(charId: string, locationId: string, roomId: string, pos: Vec2): void {
    const c = this.data.characters[charId];
    if (!c) return;
    c.position = { locationId, roomId, x: pos.x, y: pos.y };
    this.emit();
  }

  setCharacterOutfit(charId: string, outfit: OutfitState): void {
    const c = this.data.characters[charId];
    if (!c) return;
    c.outfit = { ...outfit };
    this.emit();
  }

  // --- room navigation ---

  setActiveRoom(roomId: string): void {
    this.data.activeRoomId = roomId;
    this.emit();
  }

  getRoom(locationId: string, roomId: string): RoomState {
    const loc = this.getOrCreateLocation(locationId);
    if (!loc.rooms[roomId]) loc.rooms[roomId] = { items: [] };
    return loc.rooms[roomId];
  }

  private getOrCreateLocation(locationId: string): LocationState {
    if (!this.data.world[locationId]) this.data.world[locationId] = { rooms: {} };
    return this.data.world[locationId];
  }

  // --- items: world (per room) ---

  placeItemInRoom(
    locationId: string,
    roomId: string,
    item: ItemInstance,
    pos: Vec2,
  ): void {
    const room = this.getRoom(locationId, roomId);
    room.items.push({ ...item, position: pos });
    this.emit();
  }

  updatePlacedItemPosition(
    locationId: string,
    roomId: string,
    instanceId: string,
    pos: Vec2,
  ): void {
    const room = this.getRoom(locationId, roomId);
    const it = room.items.find((i) => i.instanceId === instanceId);
    if (it) {
      it.position = pos;
      this.emit();
    }
  }

  removeItemFromRoom(
    locationId: string,
    roomId: string,
    instanceId: string,
  ): PlacedItem | undefined {
    const room = this.getRoom(locationId, roomId);
    const idx = room.items.findIndex((i) => i.instanceId === instanceId);
    if (idx < 0) return undefined;
    const [removed] = room.items.splice(idx, 1);
    this.emit();
    return removed;
  }

  // --- items: character inventory ---

  addToCharacterInventory(charId: string, item: ItemInstance): void {
    const c = this.data.characters[charId];
    if (!c) return;
    c.inventory.push(item);
    this.emit();
  }

  removeFromCharacterInventory(charId: string, instanceId: string): ItemInstance | undefined {
    const c = this.data.characters[charId];
    if (!c) return undefined;
    const idx = c.inventory.findIndex((i) => i.instanceId === instanceId);
    if (idx < 0) return undefined;
    const [removed] = c.inventory.splice(idx, 1);
    this.emit();
    return removed;
  }

  // --- world inventory (start pool) ---

  removeFromWorldInventory(instanceId: string): ItemInstance | undefined {
    const idx = this.data.worldInventory.findIndex((i) => i.instanceId === instanceId);
    if (idx < 0) return undefined;
    const [removed] = this.data.worldInventory.splice(idx, 1);
    this.emit();
    return removed;
  }

  addToWorldInventory(item: ItemInstance): void {
    this.data.worldInventory.push(item);
    this.emit();
  }
}

export const GameState = new GameStateStore();
