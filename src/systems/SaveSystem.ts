import { SAVE_KEY } from "../config";
import type { SaveData } from "../state/types";

const CURRENT_VERSION = 1;

type Migration = (data: any) => any;

const migrations: Record<number, Migration> = {
  // Future: 1 -> 2 etc. Slice ist version 1, daher leer.
};

function migrate(raw: any): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  let data = raw;
  let version: number = typeof data.version === "number" ? data.version : 0;
  while (version < CURRENT_VERSION) {
    const migrate = migrations[version];
    if (!migrate) return null;
    data = migrate(data);
    version += 1;
  }
  if (data.version !== CURRENT_VERSION) return null;
  return data as SaveData;
}

function isValid(data: SaveData): boolean {
  return (
    typeof data.activeCharacterId === "string" &&
    typeof data.activeLocationId === "string" &&
    typeof data.activeRoomId === "string" &&
    !!data.characters &&
    !!data.world &&
    Array.isArray(data.worldInventory)
  );
}

export const SaveSystem = {
  load(): SaveData | null {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const migrated = migrate(parsed);
      if (!migrated || !isValid(migrated)) return null;
      return migrated;
    } catch (err) {
      console.warn("SaveSystem.load failed", err);
      return null;
    }
  },

  save(data: SaveData): void {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("SaveSystem.save failed", err);
    }
  },

  clear(): void {
    window.localStorage.removeItem(SAVE_KEY);
  },

  get version(): number {
    return CURRENT_VERSION;
  },
};
