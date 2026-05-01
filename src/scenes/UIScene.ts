import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { getItemDef } from "../data/items";
import { CHARACTERS, getCharacterDef } from "../data/characters";
import { OutfitCatalog, TextureKeys } from "../data/outfits";
import { Sound } from "../systems/Sound";
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
    this.makeEditorButton();
    this.makeMuteButton();

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
      `Aktiv: ${def.name}  ·  Inventar-Klick = ablegen · Drag → Charakter = mitnehmen · Tap auf Item im Raum = Aktion`,
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

      const slotBg = this.add
        .rectangle(x, y, SLOT_W, SLOT_H, COLORS.panelLight, 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, COLORS.textDim);

      const preview = this.add
        .image(x + SLOT_W / 2, y + SLOT_H / 2 - 6, TextureKeys.item(item.defId))
        .setOrigin(0.5);
      // Fit largest dimension into ~SLOT-22 px so previews share visual scale.
      const fit = (SLOT_W - 22) / Math.max(def.size.x, def.size.y);
      preview.setScale(Math.min(1, fit));

      const label = this.add
        .text(x + SLOT_W / 2, y + SLOT_H - 12, def.name, {
          fontSize: "11px",
          color: "#f2f2f7",
        })
        .setOrigin(0.5);

      slotBg.setInteractive({ useHandCursor: true });
      slotBg.on("pointerdown", () => {
        Sound.click();
        const loc = this.scene.get("Location") as Phaser.Scene;
        if (pool === "world") {
          loc.events.emit("ui:request-place-from-world", item.instanceId);
        } else {
          loc.events.emit("ui:request-pickup-active-character-item", item.instanceId);
        }
      });

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
      const charState = GameState.snapshot.characters[id];
      const topColor = charState
        ? OutfitCatalog.top(charState.outfit.top).color
        : 0xcccccc;
      const isActive = id === GameState.snapshot.activeCharacterId;
      xOffset -= 60;
      const dot = this.add.circle(xOffset, 6, 26, topColor, 1);
      dot.setStrokeStyle(isActive ? 4 : 2, isActive ? 0xffffff : 0x000000, isActive ? 1 : 0.4);
      dot.setInteractive({ useHandCursor: true });
      dot.on("pointerdown", () => {
        if (id !== GameState.snapshot.activeCharacterId) Sound.click();
        GameState.setActiveCharacter(id);
      });
      const label = this.add
        .text(xOffset, 38, def.name, { fontSize: "13px", color: "#f2f2f7" })
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

  private makeEditorButton(): void {
    const x = 160;
    const y = 14;
    const w = 170;
    const h = 48;
    const bg = this.add
      .rectangle(x, y, w, h, COLORS.accent, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.text);
    const text = this.add
      .text(x + w / 2, y + h / 2, "Charakter-Editor", {
        fontSize: "15px",
        color: "#1b1f3b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      Sound.click();
      const loc = this.scene.get("Location") as Phaser.Scene;
      loc.events.emit("ui:open-editor");
    });
    bg.on("pointerover", () => bg.setFillStyle(0xffd99a, 1));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.accent, 0.95));
    void text;
  }

  private makeMuteButton(): void {
    const x = GAME_WIDTH - 36;
    const y = 78;
    // Tappable circle behind the emoji = real touch target (≥44 px on iPad).
    const hit = this.add
      .circle(x, y, 26, COLORS.panelLight, 0.6)
      .setStrokeStyle(2, COLORS.textDim);
    const btn = this.add
      .text(x, y, Sound.isMuted() ? "🔇" : "🔊", { fontSize: "28px" })
      .setOrigin(0.5);
    hit.setInteractive({ useHandCursor: true });
    const toggle = (): void => {
      const next = !Sound.isMuted();
      Sound.setMuted(next);
      btn.setText(next ? "🔇" : "🔊");
      if (!next) Sound.click();
      try {
        window.localStorage.setItem("ninanocaworld:muted", next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
    };
    hit.on("pointerdown", toggle);
    hit.on("pointerover", () => hit.setFillStyle(COLORS.accent, 0.7));
    hit.on("pointerout", () => hit.setFillStyle(COLORS.panelLight, 0.6));
  }

  private makeResetButton(): void {
    const x = 14;
    const y = 14;
    const w = 130;
    const h = 48;
    const bg = this.add
      .rectangle(x, y, w, h, COLORS.panelLight, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.textDim);
    const text = this.add
      .text(x + w / 2, y + h / 2, "Spielstand löschen", {
        fontSize: "12px",
        color: "#f2f2f7",
      })
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
