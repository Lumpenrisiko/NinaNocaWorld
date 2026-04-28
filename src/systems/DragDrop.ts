import Phaser from "phaser";

export type DragSource = "world-inventory" | "room" | "character-inventory";

export interface DraggableData {
  /** Discriminator for handlers. */
  kind: "item" | "character";
  source: DragSource;
  /** ItemInstance id (for items) or character defId (for characters). */
  payloadId: string;
  /** Snapshot of where the drag started, in world space. */
  origin: { x: number; y: number };
}

const DATA_KEY = "ninanoca:drag";

/**
 * Marks a GameObject as draggable and stores discriminated data on it.
 * The drag/drop pipeline is Phaser-native; we just normalise the metadata.
 */
export function makeDraggable(
  go: Phaser.GameObjects.GameObject & { x: number; y: number },
  data: Omit<DraggableData, "origin">,
): void {
  const interactiveTarget = go as unknown as Phaser.GameObjects.GameObject;
  if (!interactiveTarget.input) {
    interactiveTarget.setInteractive({ useHandCursor: true, draggable: true });
  } else {
    interactiveTarget.input.draggable = true;
  }

  go.setDataEnabled();
  go.data.set(DATA_KEY, { ...data, origin: { x: go.x, y: go.y } });
}

export function getDragData(
  go: Phaser.GameObjects.GameObject & { data?: Phaser.Data.DataManager },
): DraggableData | undefined {
  return go.data?.get(DATA_KEY);
}

export function refreshOrigin(
  go: Phaser.GameObjects.GameObject & { x: number; y: number; data?: Phaser.Data.DataManager },
): void {
  const cur = go.data?.get(DATA_KEY) as DraggableData | undefined;
  if (cur) cur.origin = { x: go.x, y: go.y };
}
