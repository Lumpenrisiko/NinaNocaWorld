import type { Vec2 } from "../../state/types";

export interface RoomDefinition {
  id: string;
  name: string;
  /** Background color used as placeholder until real assets exist. */
  bgColor: number;
}

export interface LocationDefinition {
  id: string;
  name: string;
  rooms: RoomDefinition[];
  /** Default placement for newly placed items if no drag pos is given. */
  defaultDropPosition: Vec2;
  /** Asset manifest path (loaded on-demand from Phase 3 onwards). */
  assetManifestPath?: string;
}
