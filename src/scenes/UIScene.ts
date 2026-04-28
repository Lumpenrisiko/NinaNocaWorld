import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { getItemDef } from "../data/items";
import { CHARACTERS, getCharacterDef } from "../data/characters";
import type { ItemInstance } from "../state/types";

const PANEL_HEIGHT = 180;
const PANEL_TOP = GAME_HEIGHT - PANEL_HEIGHT;

const SLOT_W = 80;
const SLOT_H = 80;
const SLOT_GAP = 12;

/**
 * Persistente UI-Scene über der LocationScene.
 * Untere Leiste: Welt-Inventar (links) und Aktiver-Charakter-Inventar (rechts).
 * Oben rechts: Charakter-Wahl + Reset-Button.
 */
export class UIScene extends Phaser.Scene {
  private panelGfx!: Phaser.GameObjects.Rectangle;
  private worldSlotsContainer!: Phaser.GameObjects.Container;
  private charSlotsContainer!: Phaser.GameObjects.Container;
  private charSelector!: Phaser.GameObjects.Container;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super("UI");
  }

  create(): void {
    this.panelGfx = this.add
      .rectangle(0, PANEL_TOP, GAME_WIDTH, PANEL_HEIGHT, COLORS.panel, 0.92)
      .setOrigin(0, 0);
    this.panelGfx.setStrokeStyle(2, COLORS.panelLight);

    this.add
      .text(20, PANEL_TOP + 12, "Welt-Inventar", {
        fontSize: "16px",
        color: "#9aa0c0",
      })
      .setOrigin(0, 0);

    this.add
      .text(GAME_WIDTH / 2 + 20, PANEL_TOP + 12, "Charakter-Inventar", {
        fontSize: "16px",
        color: "#9aa0c0",
      })
      .setOrigin(0, 0);

    this.worldSlotsContainer = this.add.container(20, PANEL_TOP + 40);
    this.charSlotsContainer = this.add.container(GAME_WIDTH / 2 + 20, PANEL_TOP + 40);

    // Divider
    this.add
      .line(0, 0, GAME_WIDTH / 2, PANEL_TOP + 6, GAME_WIDTH / 2, GAME_HEIGHT - 6, COLORS.panelLight)
      .setOrigin(0, 0)
      .setLineWidth(1);

    this.charSelector = this.add.container(GAME_WIDTH - 20, 20);
    this.buildCharSelector();

    this.makeResetButton();

    this.hint = this.add
      .text(GAME_WIDTH / 2, PANEL_TOP - 22, "", {
        fontSize: "14px",
        color: "#9aa0c0",
      })
      .setOrigin(0.5);

    this.render();
    GameState.subscribe(() => this.render());
  }

  private render(): void {
    this.renderInventory(this.worldSlotsContainer, GameState.snapshot.worldInventory, "world");

    const active = GameState.activeCharacter;
    this.renderInventory(this.charSlotsContainer, active.inventory, "character");

    // Refresh char selector ring.
    this.buildCharSelector();

    const def = getCharacterDef(active.defId);
    this.hint.setText(
      `Aktiv: ${def.name}  ·  klicke ein Item um es im Raum abzulegen, ziehe Items im Raum zum Bewegen`,
    );
  }

  private renderInventory(
    container: Phaser.GameObjects.Container,
    items: ItemInstance[],
    pool: "world" | "character",
  ): void {
    container.removeAll(true);

    items.forEach((item, i) => {
      const def = getItemDef(item.defId);
      const x = i * (SLOT_W + SLOT_GAP);
      const y = 0;
      const color =
        def.category === "furniture"
          ? COLORS.itemFurniture
          : def.category === "food"
            ? COLORS.itemFood
            : COLORS.itemToy;

      const slotBg = this.add
        .rectangle(x, y, SLOT_W, SLOT_H, COLORS.panelLight, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, COLORS.textDim);

      const previewW = Math.min(def.size.x * 0.4, SLOT_W - 18);
      const previewH = Math.min(def.size.y * 0.4, SLOT_H - 28);
      const preview = this.add
        .rectangle(x + SLOT_W / 2, y + SLOT_H / 2 - 6, previewW, previewH, color)
        .setStrokeStyle(2, 0x000000, 0.25);

      const label = this.add
        .text(x + SLOT_W / 2, y + SLOT_H - 12, def.name, {
          fontSize: "11px",
          color: "#f2f2f7",
        })
        .setOrigin(0.5);

      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on("pointerdown", () => {
        const loc = this.scene.get("Location") as Phaser.Scene;
        if (pool === "world") {
          loc.events.emit("ui:request-place-from-world", item.instanceId);
        } else {
          loc.events.emit("ui:request-pickup-active-character-item", item.instanceId);
        }
      });

      // Hover-Tint
      slotBg.on("pointerover", () => slotBg.setFillStyle(COLORS.dropZoneHover, 1));
      slotBg.on("pointerout", () => slotBg.setFillStyle(COLORS.panelLight, 1));

      container.add([slotBg, preview, label]);
    });

    if (items.length === 0) {
      const empty = this.add.text(0, 30, "(leer)", {
        fontSize: "13px",
        color: "#9aa0c0",
        fontStyle: "italic",
      });
      container.add(empty);
    }
  }

  private buildCharSelector(): void {
    this.charSelector.removeAll(true);
    const ids = Object.keys(CHARACTERS);
    let xOffset = 0;
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i]!;
      const def = getCharacterDef(id);
      const isActive = id === GameState.snapshot.activeCharacterId;
      xOffset -= 50;
      const dot = this.add.circle(xOffset, 0, 22, def.color, 1);
      dot.setStrokeStyle(isActive ? 4 : 2, isActive ? 0xffffff : 0x000000, isActive ? 1 : 0.4);
      dot.setInteractive({ useHandCursor: true });
      dot.on("pointerdown", () => GameState.setActiveCharacter(id));
      const label = this.add
        .text(xOffset, 28, def.name, { fontSize: "12px", color: "#f2f2f7" })
        .setOrigin(0.5);
      this.charSelector.add([dot, label]);
    }
    const heading = this.add.text(xOffset - 24, -10, "Charakter:", {
      fontSize: "13px",
      color: "#9aa0c0",
    });
    heading.setOrigin(1, 0);
    this.charSelector.add(heading);
  }

  private makeResetButton(): void {
    const x = 20;
    const y = 20;
    const bg = this.add
      .rectangle(x, y, 110, 32, COLORS.panelLight, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLORS.textDim);
    const text = this.add
      .text(x + 55, y + 16, "Spielstand löschen", { fontSize: "11px", color: "#f2f2f7" })
      .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      window.localStorage.removeItem("ninanocaworld:save:v1");
      window.location.reload();
    });
    bg.on("pointerover", () => bg.setFillStyle(COLORS.accent, 0.9));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.panelLight, 0.9));
    void text;
  }
}
