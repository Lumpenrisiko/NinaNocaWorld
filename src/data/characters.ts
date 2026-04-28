import type { CharacterDefinition } from "../state/types";
import { COLORS } from "../config";

export const CHARACTERS: Record<string, CharacterDefinition> = {
  nina: {
    id: "nina",
    name: "Nina",
    color: COLORS.character[0]!,
  },
  noca: {
    id: "noca",
    name: "Noca",
    color: COLORS.character[1]!,
  },
  pip: {
    id: "pip",
    name: "Pip",
    color: COLORS.character[2]!,
  },
};

export function getCharacterDef(defId: string): CharacterDefinition {
  const def = CHARACTERS[defId];
  if (!def) throw new Error(`Unknown character: ${defId}`);
  return def;
}
