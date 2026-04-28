import { COLORS } from "../../config";
import type { LocationDefinition } from "./types";

export const HOME: LocationDefinition = {
  id: "home",
  name: "Zuhause",
  rooms: [
    { id: "living", name: "Wohnzimmer", bgColor: COLORS.room[0]! },
    { id: "kitchen", name: "Küche", bgColor: COLORS.room[1]! },
    { id: "bath", name: "Badezimmer", bgColor: COLORS.room[2]! },
    { id: "bedroom", name: "Schlafzimmer", bgColor: COLORS.room[3]! },
  ],
  defaultDropPosition: { x: 640, y: 420 },
};
