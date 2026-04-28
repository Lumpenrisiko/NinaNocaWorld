import type { SaveData } from "../state/types";
import { CHARACTERS, getCharacterDef } from "../data/characters";
import { HOME } from "../data/locations/home";

let counter = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${counter++}`;

/**
 * Default world for a fresh game. Contains:
 * - 3 characters in different rooms
 * - A starter pool of items in the world inventory (UI-Bottom-Bar)
 * - Empty rooms (player drags items in)
 */
export function createInitialSave(): SaveData {
  const firstRoom = HOME.rooms[0]!;
  const secondRoom = HOME.rooms[1] ?? firstRoom;

  const charIds = Object.keys(CHARACTERS);

  return {
    version: 1,
    activeCharacterId: charIds[0]!,
    activeLocationId: HOME.id,
    activeRoomId: firstRoom.id,
    characters: Object.fromEntries(
      charIds.map((id, i) => [
        id,
        {
          defId: id,
          position: {
            locationId: HOME.id,
            roomId: i === 0 ? firstRoom.id : secondRoom.id,
            x: 400 + i * 120,
            y: 460,
          },
          inventory: [],
          outfit: { ...getCharacterDef(id).defaultOutfit },
        },
      ]),
    ),
    world: {
      [HOME.id]: { rooms: {} },
    },
    worldInventory: [
      { instanceId: newId("sofa"), defId: "sofa" },
      { instanceId: newId("bed"), defId: "bed" },
      { instanceId: newId("table"), defId: "table" },
      { instanceId: newId("apple"), defId: "apple" },
      { instanceId: newId("apple"), defId: "apple" },
      { instanceId: newId("bread"), defId: "bread" },
      { instanceId: newId("ball"), defId: "ball" },
      { instanceId: newId("teddy"), defId: "teddy" },
    ],
  };
}

export function newInstanceId(prefix: string): string {
  return newId(prefix);
}
