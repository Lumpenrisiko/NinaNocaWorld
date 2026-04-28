import type { CharacterDefinition } from "../state/types";

export const CHARACTERS: Record<string, CharacterDefinition> = {
  nina: {
    id: "nina",
    name: "Nina",
    defaultOutfit: {
      skinTone: "warm",
      hair: "long",
      top: "redshirt",
      bottom: "jeans",
      shoes: "sneakers",
    },
  },
  noca: {
    id: "noca",
    name: "Noca",
    defaultOutfit: {
      skinTone: "light",
      hair: "spiky",
      top: "blueshirt",
      bottom: "shorts",
      shoes: "boots",
    },
  },
  pip: {
    id: "pip",
    name: "Pip",
    defaultOutfit: {
      skinTone: "tan",
      hair: "curly",
      top: "yellowshirt",
      bottom: "skirt",
      shoes: "sandals",
    },
  },
};

export function getCharacterDef(defId: string): CharacterDefinition {
  const def = CHARACTERS[defId];
  if (!def) throw new Error(`Unknown character: ${defId}`);
  return def;
}
