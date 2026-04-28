import type { LocationDefinition } from "./types";
import { HOME } from "./home";

export const LOCATIONS: Record<string, LocationDefinition> = {
  [HOME.id]: HOME,
};

export function getLocation(id: string): LocationDefinition {
  const loc = LOCATIONS[id];
  if (!loc) throw new Error(`Unknown location: ${id}`);
  return loc;
}
