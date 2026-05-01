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
import { getItemActions, type ItemActionConfig } from "../data/actions";
import { getItemDef } from "../data/items";
import { executeAction } from "../systems/ActionSystem";
import { Sound } from "../systems/Sound";
import { SpeechBubble } from "../entities/SpeechBubble";

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
  private characterEntities = new Map<string, Character>();

  /** Set true by drop event so dragend skips position commit. */
  private dropHandled = new WeakSet<object>();

  private actionMenu: Phaser.GameObjects.Container | null = null;
  private actionBackdrop: Phaser.GameObjects.Rectangle | null = null;

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

    this.closeActionMenu();

    this.itemSprites.forEach((s) => s.destroy());
    this.itemSprites = [];
    this.characterEntities.forEach((s) => s.destroy());
    this.characterEntities.clear();

    const roomState = GameState.getRoom(this.location.id, this.currentRoomId);
    for (const placed of roomState.items) {
      this.itemSprites.push(this.spawnItemSprite(placed));
    }

    for (const charId of Object.keys(GameState.snapshot.characters)) {
      const c = GameState.snapshot.characters[charId]!;
      if (c.position.locationId === this.location.id && c.position.roomId === this.currentRoomId) {
        this.characterEntities.set(charId, this.spawnCharacter(charId));
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

    // Click vs drag: pointerup with no preceding dragstart = tap.
    let wasDragged = false;
    img.on(Phaser.Input.Events.POINTER_DOWN, () => {
      wasDragged = false;
    });
    img.on(Phaser.Input.Events.DRAG_START, () => {
      wasDragged = true;
    });
    img.on(Phaser.Input.Events.POINTER_UP, () => {
      if (wasDragged) return;
      this.handleItemTap(img, placed);
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
          if (data.source !== "room") Sound.drop();
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
              Sound.drop();
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
      Sound.pickup();
    } else if (drag.source === "world-inventory") {
      const removed = GameState.removeFromWorldInventory(drag.payloadId);
      if (!removed) return;
      GameState.addToCharacterInventory(charId, removed);
      Sound.pickup();
    } else if (drag.source === "character-inventory") {
      const fromId = GameState.snapshot.activeCharacterId;
      const removed = GameState.removeFromCharacterInventory(fromId, drag.payloadId);
      if (!removed) return;
      GameState.addToCharacterInventory(charId, removed);
      Sound.pickup();
    }
  }

  private placeFromWorld(instanceId: string): void {
    const removed = GameState.removeFromWorldInventory(instanceId);
    if (!removed) return;
    GameState.placeItemInRoom(this.location.id, this.currentRoomId, removed, {
      ...this.location.defaultDropPosition,
    });
    Sound.drop();
  }

  private placeFromCharacter(instanceId: string): void {
    const charId = GameState.snapshot.activeCharacterId;
    const removed = GameState.removeFromCharacterInventory(charId, instanceId);
    if (!removed) return;
    GameState.placeItemInRoom(this.location.id, this.currentRoomId, removed, {
      ...this.location.defaultDropPosition,
    });
    Sound.drop();
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
    Sound.whoosh();
    this.renderRoom();
  }

  // --- action menu ---

  private handleItemTap(itemSprite: Phaser.GameObjects.Image, placed: PlacedItem): void {
    const actions = getItemActions(placed.defId);
    if (actions.length === 0) return;

    const active = GameState.activeCharacter;
    if (
      active.position.locationId !== this.location.id ||
      active.position.roomId !== this.currentRoomId
    ) {
      // Active child is in another room — give visual + audio feedback.
      Sound.bonk();
      const itemDef = getItemDef(placed.defId);
      new SpeechBubble(
        this,
        itemSprite.x,
        itemSprite.y - itemDef.size.y / 2 - 4,
        "🤔",
      );
      return;
    }

    const charEntity = this.characterEntities.get(GameState.snapshot.activeCharacterId);
    if (!charEntity) return;

    Sound.click();
    this.openActionMenu(itemSprite, placed, charEntity, actions);
  }

  private openActionMenu(
    itemSprite: Phaser.GameObjects.Image,
    placed: PlacedItem,
    char: Character,
    actions: ItemActionConfig[],
  ): void {
    this.closeActionMenu();

    const PAD = 18;
    const BUTTON_H = 52; // ≥ Apple HIG 44pt minimum, even after FIT-down on iPad
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "20px",
      color: "#1b1f3b",
      fontStyle: "bold",
    };

    // Pre-measure button widths so we can lay them out side by side.
    const widths: number[] = actions.map((a) => {
      const probe = this.add.text(0, 0, `${a.emoji}  ${a.label}`, labelStyle);
      const w = Math.max(150, Math.ceil(probe.width) + PAD * 2);
      probe.destroy();
      return w;
    });
    const totalW = widths.reduce((s, w) => s + w + 8, -8);

    const itemDef = getItemDef(placed.defId);
    let menuY = itemSprite.y - itemDef.size.y / 2 - BUTTON_H / 2 - 16;
    if (menuY < ROOM_VIEW.y + BUTTON_H / 2 + 8) {
      menuY = itemSprite.y + itemDef.size.y / 2 + BUTTON_H / 2 + 16;
    }
    const menuX = Phaser.Math.Clamp(
      itemSprite.x,
      ROOM_VIEW.x + totalW / 2 + 8,
      ROOM_VIEW.x + ROOM_VIEW.w - totalW / 2 - 8,
    );

    // Backdrop catches outside clicks. Phaser's topOnly input means the menu
    // buttons (higher depth) still receive their own pointer events.
    this.actionBackdrop = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.001)
      .setOrigin(0, 0)
      .setDepth(1500)
      .setInteractive();
    this.actionBackdrop.on(Phaser.Input.Events.POINTER_DOWN, () => this.closeActionMenu());

    const menu = this.add.container(menuX, menuY).setDepth(1501);

    let cursorX = -totalW / 2;
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i]!;
      const bw = widths[i]!;
      const cx = cursorX + bw / 2;

      const bg = this.add
        .rectangle(cx, 0, bw, BUTTON_H, 0xffffff, 0.97)
        .setStrokeStyle(2, 0x1b1f3b, 0.95);
      const txt = this.add
        .text(cx, 0, `${a.emoji}  ${a.label}`, labelStyle)
        .setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on(Phaser.Input.Events.POINTER_OVER, () => bg.setFillStyle(COLORS.accent, 1));
      bg.on(Phaser.Input.Events.POINTER_OUT, () => bg.setFillStyle(0xffffff, 0.97));
      bg.on(Phaser.Input.Events.POINTER_UP, () => {
        this.closeActionMenu();
        executeAction(
          {
            scene: this,
            character: char,
            itemSprite,
            item: placed,
            locationId: this.location.id,
            roomId: this.currentRoomId,
          },
          a,
        );
      });

      menu.add([bg, txt]);
      cursorX += bw + 8;
    }

    this.actionMenu = menu;
  }

  private closeActionMenu(): void {
    this.actionMenu?.destroy();
    this.actionMenu = null;
    this.actionBackdrop?.destroy();
    this.actionBackdrop = null;
  }
}
