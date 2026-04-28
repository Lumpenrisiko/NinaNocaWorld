import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { getLocation } from "../data/locations";
import { getItemDef } from "../data/items";
import { getCharacterDef } from "../data/characters";
import { LocationLoader } from "../systems/LocationLoader";
import { makeDraggable, getDragData, refreshOrigin } from "../systems/DragDrop";
import type { DraggableData } from "../systems/DragDrop";
import type { LocationDefinition } from "../data/locations/types";
import type { PlacedItem } from "../state/types";

interface InitData {
  locationId: string;
  roomId: string;
}

const ROOM_VIEW = {
  x: 40,
  y: 60,
  w: GAME_WIDTH - 80,
  h: GAME_HEIGHT - 260,
};

export class LocationScene extends Phaser.Scene {
  private location!: LocationDefinition;
  private currentRoomId!: string;

  private bg!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;

  private itemSprites: Phaser.GameObjects.GameObject[] = [];
  private characterSprites: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("Location");
  }

  async init(data: InitData): Promise<void> {
    this.location = getLocation(data.locationId);
    this.currentRoomId = data.roomId;
    await LocationLoader.ensureLoaded(this, this.location);
  }

  create(): void {
    this.bg = this.add
      .rectangle(ROOM_VIEW.x, ROOM_VIEW.y, ROOM_VIEW.w, ROOM_VIEW.h, COLORS.room[0])
      .setOrigin(0, 0);

    this.label = this.add.text(ROOM_VIEW.x + 20, ROOM_VIEW.y + 16, "", {
      fontSize: "28px",
      color: "#ffffff",
      fontStyle: "bold",
    });

    this.buildRoomNav();
    this.setupDragHandlers();
    this.renderRoom();

    GameState.subscribe(() => this.renderRoom());

    this.events.on("ui:request-place-from-world", (instanceId: string) =>
      this.placeFromWorld(instanceId),
    );
    this.events.on("ui:request-pickup-active-character-item", (instanceId: string) =>
      this.placeFromCharacter(instanceId),
    );
  }

  // --- room rendering ---

  private renderRoom(): void {
    const room = this.location.rooms.find((r) => r.id === this.currentRoomId);
    if (!room) return;

    this.bg.fillColor = room.bgColor;
    this.label.setText(`${this.location.name} · ${room.name}`);

    // Clear & redraw items + characters.
    this.itemSprites.forEach((s) => s.destroy());
    this.itemSprites = [];
    this.characterSprites.forEach((s) => s.destroy());
    this.characterSprites = [];

    const roomState = GameState.getRoom(this.location.id, this.currentRoomId);
    for (const placed of roomState.items) {
      this.itemSprites.push(this.spawnItemSprite(placed));
    }

    for (const charId of Object.keys(GameState.snapshot.characters)) {
      const c = GameState.snapshot.characters[charId]!;
      if (c.position.locationId === this.location.id && c.position.roomId === this.currentRoomId) {
        this.characterSprites.push(this.spawnCharacterSprite(charId));
      }
    }
  }

  private spawnItemSprite(placed: PlacedItem): Phaser.GameObjects.Rectangle {
    const def = getItemDef(placed.defId);
    const color =
      def.category === "furniture"
        ? COLORS.itemFurniture
        : def.category === "food"
          ? COLORS.itemFood
          : COLORS.itemToy;
    const rect = this.add.rectangle(placed.position.x, placed.position.y, def.size.x, def.size.y, color);
    rect.setStrokeStyle(2, 0x000000, 0.25);
    const label = this.add
      .text(placed.position.x, placed.position.y, def.name, {
        fontSize: "14px",
        color: "#1b1f3b",
      })
      .setOrigin(0.5);
    rect.setData("label", label);
    makeDraggable(rect, {
      kind: "item",
      source: "room",
      payloadId: placed.instanceId,
    });
    return rect;
  }

  private spawnCharacterSprite(charId: string): Phaser.GameObjects.Rectangle {
    const c = GameState.snapshot.characters[charId]!;
    const def = getCharacterDef(c.defId);
    const isActive = charId === GameState.snapshot.activeCharacterId;
    const rect = this.add.rectangle(c.position.x, c.position.y, 70, 110, def.color);
    rect.setStrokeStyle(isActive ? 4 : 2, isActive ? 0xffffff : 0x000000, isActive ? 1 : 0.3);
    const label = this.add
      .text(c.position.x, c.position.y - 70, def.name, {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#1b1f3b88",
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
      })
      .setOrigin(0.5);
    rect.setData("label", label);
    makeDraggable(rect, {
      kind: "character",
      source: "room",
      payloadId: charId,
    });
    return rect;
  }

  // --- drag handlers ---

  private setupDragHandlers(): void {
    this.input.on(Phaser.Input.Events.DRAG_START, (_p: Phaser.Input.Pointer, go: any) => {
      this.children.bringToTop(go);
      const data = getDragData(go) as DraggableData | undefined;
      if (!data) return;
      data.origin = { x: go.x, y: go.y };
    });

    this.input.on(
      Phaser.Input.Events.DRAG,
      (_p: Phaser.Input.Pointer, go: any, dragX: number, dragY: number) => {
        go.x = dragX;
        go.y = dragY;
        const label = go.getData?.("label") as Phaser.GameObjects.Text | undefined;
        if (label) {
          if (go.height > 100) label.setPosition(dragX, dragY - 70);
          else label.setPosition(dragX, dragY);
        }
      },
    );

    this.input.on(Phaser.Input.Events.DRAG_END, (_p: Phaser.Input.Pointer, go: any) => {
      const data = getDragData(go) as DraggableData | undefined;
      if (!data) return;
      const insideRoom = this.isInsideRoomView(go.x, go.y);

      if (data.kind === "item") {
        if (insideRoom) {
          this.commitItemPosition(data.payloadId, go.x, go.y, data.source);
        } else {
          // Außerhalb des Raumes (z. B. übers Inventar): zurück zum Owner.
          if (data.source === "room") {
            // Schicke ins Welt-Inventar (UI rendert es).
            const removed = GameState.removeItemFromRoom(
              this.location.id,
              this.currentRoomId,
              data.payloadId,
            );
            if (removed) {
              GameState.addToWorldInventory({
                instanceId: removed.instanceId,
                defId: removed.defId,
              });
            }
          } else {
            // Snap-back visuell — State unverändert.
            go.x = data.origin.x;
            go.y = data.origin.y;
            const label = go.getData?.("label") as Phaser.GameObjects.Text | undefined;
            if (label) label.setPosition(data.origin.x, data.origin.y);
          }
        }
      } else if (data.kind === "character") {
        if (insideRoom) {
          GameState.moveCharacter(data.payloadId, this.location.id, this.currentRoomId, {
            x: go.x,
            y: go.y,
          });
          refreshOrigin(go);
        } else {
          go.x = data.origin.x;
          go.y = data.origin.y;
          const label = go.getData?.("label") as Phaser.GameObjects.Text | undefined;
          if (label) label.setPosition(data.origin.x, data.origin.y - 70);
        }
      }
    });
  }

  private isInsideRoomView(x: number, y: number): boolean {
    return (
      x >= ROOM_VIEW.x &&
      x <= ROOM_VIEW.x + ROOM_VIEW.w &&
      y >= ROOM_VIEW.y &&
      y <= ROOM_VIEW.y + ROOM_VIEW.h
    );
  }

  private commitItemPosition(instanceId: string, x: number, y: number, source: string): void {
    if (source === "room") {
      GameState.updatePlacedItemPosition(this.location.id, this.currentRoomId, instanceId, {
        x,
        y,
      });
    }
  }

  // --- inventory bridge from UIScene ---

  private placeFromWorld(instanceId: string): void {
    const removed = GameState.removeFromWorldInventory(instanceId);
    if (!removed) return;
    GameState.placeItemInRoom(this.location.id, this.currentRoomId, removed, {
      ...this.location.defaultDropPosition,
    });
  }

  private placeFromCharacter(instanceId: string): void {
    const charId = GameState.snapshot.activeCharacterId;
    const removed = GameState.removeFromCharacterInventory(charId, instanceId);
    if (!removed) return;
    GameState.placeItemInRoom(this.location.id, this.currentRoomId, removed, {
      ...this.location.defaultDropPosition,
    });
  }

  // --- room nav ---

  private buildRoomNav(): void {
    const navY = ROOM_VIEW.y + ROOM_VIEW.h - 40;
    this.makeButton(ROOM_VIEW.x + 50, navY, "<", () => this.cycleRoom(-1));
    this.makeButton(ROOM_VIEW.x + ROOM_VIEW.w - 50, navY, ">", () => this.cycleRoom(1));
  }

  private makeButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 60, 60, COLORS.panelLight, 0.85);
    bg.setStrokeStyle(2, COLORS.accent);
    const label = this.add.text(0, 0, text, { fontSize: "30px", color: "#ffffff" }).setOrigin(0.5);
    const c = this.add.container(x, y, [bg, label]);
    c.setSize(60, 60);
    c.setInteractive({ useHandCursor: true });
    c.on("pointerdown", onClick);
    return c;
  }

  private cycleRoom(dir: number): void {
    const idx = this.location.rooms.findIndex((r) => r.id === this.currentRoomId);
    const nextIdx = (idx + dir + this.location.rooms.length) % this.location.rooms.length;
    this.currentRoomId = this.location.rooms[nextIdx]!.id;
    GameState.setActiveRoom(this.currentRoomId);
    this.renderRoom();
  }
}
