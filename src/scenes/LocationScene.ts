import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { getLocation } from "../data/locations";
import { LocationLoader } from "../systems/LocationLoader";
import {
  makeDraggable,
  getDragData,
  refreshOrigin,
  makeDropZone,
  getDropData,
} from "../systems/DragDrop";
import type { DraggableData, DropZoneData } from "../systems/DragDrop";
import type { LocationDefinition } from "../data/locations/types";
import type { PlacedItem } from "../state/types";
import { Character } from "../entities/Character";
import { getCharacterDef } from "../data/characters";
import { TextureKeys } from "../data/outfits";

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

  private bg!: Phaser.GameObjects.Image;
  private bgFallback!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;

  private itemSprites: Phaser.GameObjects.GameObject[] = [];
  private characterEntities: Character[] = [];

  /** Set true by drop event so dragend skips position commit. */
  private dropHandled = new WeakSet<object>();

  constructor() {
    super("Location");
  }

  async init(data: InitData): Promise<void> {
    this.location = getLocation(data.locationId);
    this.currentRoomId = data.roomId;
    await LocationLoader.ensureLoaded(this, this.location);
  }

  create(): void {
    // Solid fallback so the room area never shows the page background even
    // for an instant if a texture is missing.
    this.bgFallback = this.add
      .rectangle(ROOM_VIEW.x, ROOM_VIEW.y, ROOM_VIEW.w, ROOM_VIEW.h, COLORS.room[0])
      .setOrigin(0, 0);

    this.bg = this.add
      .image(ROOM_VIEW.x, ROOM_VIEW.y, TextureKeys.room(this.location.id, this.currentRoomId))
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
    this.events.on("ui:open-editor", () => {
      this.scene.launch("CharacterEditor");
      this.scene.pause();
    });
    this.events.on("ui:editor-closed", () => {
      this.scene.resume();
    });
  }

  // --- room rendering ---

  private renderRoom(): void {
    const room = this.location.rooms.find((r) => r.id === this.currentRoomId);
    if (!room) return;

    this.bgFallback.fillColor = room.bgColor;
    const key = TextureKeys.room(this.location.id, this.currentRoomId);
    if (this.textures.exists(key)) this.bg.setTexture(key);
    this.label.setText(`${this.location.name} · ${room.name}`);

    this.itemSprites.forEach((s) => s.destroy());
    this.itemSprites = [];
    this.characterEntities.forEach((s) => s.destroy());
    this.characterEntities = [];

    const roomState = GameState.getRoom(this.location.id, this.currentRoomId);
    for (const placed of roomState.items) {
      this.itemSprites.push(this.spawnItemSprite(placed));
    }

    for (const charId of Object.keys(GameState.snapshot.characters)) {
      const c = GameState.snapshot.characters[charId]!;
      if (c.position.locationId === this.location.id && c.position.roomId === this.currentRoomId) {
        this.characterEntities.push(this.spawnCharacter(charId));
      }
    }
  }

  private spawnItemSprite(placed: PlacedItem): Phaser.GameObjects.Image {
    const key = TextureKeys.item(placed.defId);
    const img = this.add.image(placed.position.x, placed.position.y, key);
    makeDraggable(img, {
      kind: "item",
      source: "room",
      payloadId: placed.instanceId,
    });
    return img;
  }

  private spawnCharacter(charId: string): Character {
    const c = GameState.snapshot.characters[charId]!;
    const def = getCharacterDef(c.defId);
    const isActive = charId === GameState.snapshot.activeCharacterId;

    const entity = new Character(this, c.position.x, c.position.y, def.name);
    entity.applyOutfit(c.outfit);
    entity.showActiveMarker(isActive);

    makeDraggable(entity, {
      kind: "character",
      source: "room",
      payloadId: charId,
    });
    makeDropZone(entity, { kind: "character", characterId: charId });

    return entity;
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
        if (label) label.setPosition(dragX, dragY);
      },
    );

    // Dropped onto a registered drop zone (e.g. character).
    this.input.on(
      Phaser.Input.Events.DROP,
      (_p: Phaser.Input.Pointer, go: any, dropZone: Phaser.GameObjects.GameObject) => {
        const drag = getDragData(go) as DraggableData | undefined;
        const drop = getDropData(dropZone as any) as DropZoneData | undefined;
        if (!drag || !drop) return;

        if (drag.kind === "item" && drop.kind === "character") {
          this.transferItemToCharacter(drag, drop.characterId);
          this.dropHandled.add(go);
        }
      },
    );

    this.input.on(Phaser.Input.Events.DRAG_END, (_p: Phaser.Input.Pointer, go: any) => {
      const data = getDragData(go) as DraggableData | undefined;
      if (!data) return;

      // Drop event already moved the item into a character inventory.
      if (this.dropHandled.has(go)) {
        this.dropHandled.delete(go);
        return;
      }

      const insideRoom = this.isInsideRoomView(go.x, go.y);

      if (data.kind === "item") {
        if (insideRoom) {
          this.commitItemPosition(data.payloadId, go.x, go.y, data.source);
        } else {
          if (data.source === "room") {
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
            this.snapBack(go, data);
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
          this.snapBack(go, data);
        }
      }
    });
  }

  private snapBack(go: any, data: DraggableData): void {
    go.x = data.origin.x;
    go.y = data.origin.y;
    const label = go.getData?.("label") as Phaser.GameObjects.Text | undefined;
    if (label) label.setPosition(data.origin.x, data.origin.y);
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

  // --- pickups & placements ---

  private transferItemToCharacter(drag: DraggableData, charId: string): void {
    if (drag.source === "room") {
      const removed = GameState.removeItemFromRoom(
        this.location.id,
        this.currentRoomId,
        drag.payloadId,
      );
      if (!removed) return;
      GameState.addToCharacterInventory(charId, {
        instanceId: removed.instanceId,
        defId: removed.defId,
      });
    } else if (drag.source === "world-inventory") {
      const removed = GameState.removeFromWorldInventory(drag.payloadId);
      if (!removed) return;
      GameState.addToCharacterInventory(charId, removed);
    } else if (drag.source === "character-inventory") {
      // Cross-character transfer (Slice: also supported).
      const fromId = GameState.snapshot.activeCharacterId;
      const removed = GameState.removeFromCharacterInventory(fromId, drag.payloadId);
      if (!removed) return;
      GameState.addToCharacterInventory(charId, removed);
    }
  }

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
