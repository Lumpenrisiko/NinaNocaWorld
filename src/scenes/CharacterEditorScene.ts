import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, COLORS } from "../config";
import { GameState } from "../state/GameState";
import { getCharacterDef } from "../data/characters";
import {
  SKIN_TONES,
  HAIRS,
  TOPS,
  BOTTOMS,
  SHOES,
} from "../data/outfits";
import type { OutfitState } from "../state/types";
import { Character } from "../entities/Character";
import { Sound } from "../systems/Sound";

interface Carousel<T extends { id: string; label: string }> {
  options: T[];
  index: number;
  labelText: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
}

export class CharacterEditorScene extends Phaser.Scene {
  private working!: OutfitState;
  private original!: OutfitState;
  private charId!: string;
  private preview!: Character;

  constructor() {
    super("CharacterEditor");
  }

  create(): void {
    this.charId = GameState.snapshot.activeCharacterId;
    const c = GameState.snapshot.characters[this.charId]!;
    this.original = { ...c.outfit };
    this.working = { ...c.outfit };

    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setInteractive();

    const panelW = 800;
    const panelH = 580;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;

    this.add
      .rectangle(panelX, panelY, panelW, panelH, COLORS.panel, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.accent);

    const def = getCharacterDef(this.charId);
    this.add
      .text(GAME_WIDTH / 2, panelY + 28, `Charakter-Editor · ${def.name}`, {
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.preview = new Character(this, panelX + 200, panelY + 320, def.name);
    this.preview.applyOutfit(this.working);

    const carouselsX = panelX + 380;
    let row = panelY + 90;
    const rowGap = 80;

    this.makeCarousel(
      "Hautton",
      SKIN_TONES,
      this.idx(SKIN_TONES, this.working.skinTone),
      carouselsX,
      row,
      (opt) => {
        this.working.skinTone = opt.id;
        this.preview.applyOutfit(this.working);
      },
    );
    row += rowGap;

    this.makeCarousel(
      "Frisur",
      HAIRS,
      this.idx(HAIRS, this.working.hair),
      carouselsX,
      row,
      (opt) => {
        this.working.hair = opt.id;
        this.preview.applyOutfit(this.working);
      },
    );
    row += rowGap;

    this.makeCarousel(
      "Oberteil",
      TOPS,
      this.idx(TOPS, this.working.top),
      carouselsX,
      row,
      (opt) => {
        this.working.top = opt.id;
        this.preview.applyOutfit(this.working);
      },
    );
    row += rowGap;

    this.makeCarousel(
      "Unterteil",
      BOTTOMS,
      this.idx(BOTTOMS, this.working.bottom),
      carouselsX,
      row,
      (opt) => {
        this.working.bottom = opt.id;
        this.preview.applyOutfit(this.working);
      },
    );
    row += rowGap;

    this.makeCarousel(
      "Schuhe",
      SHOES,
      this.idx(SHOES, this.working.shoes),
      carouselsX,
      row,
      (opt) => {
        this.working.shoes = opt.id;
        this.preview.applyOutfit(this.working);
      },
    );

    const btnY = panelY + panelH - 60;
    this.makeBigButton(panelX + panelW - 250, btnY, "Übernehmen", COLORS.accent, () =>
      this.confirm(),
    );
    this.makeBigButton(panelX + panelW - 100, btnY, "Abbrechen", COLORS.panelLight, () =>
      this.cancel(),
    );
  }

  private idx<T extends { id: string }>(list: T[], id: string): number {
    const i = list.findIndex((o) => o.id === id);
    return i < 0 ? 0 : i;
  }

  private makeCarousel<T extends { id: string; label: string }>(
    label: string,
    options: T[],
    initialIndex: number,
    x: number,
    y: number,
    onChange: (opt: T) => void,
  ): void {
    const labelText = this.add
      .text(x, y, label, { fontSize: "16px", color: "#9aa0c0" })
      .setOrigin(0, 0);

    const valueText = this.add
      .text(x + 130, y + 44, options[initialIndex]!.label, {
        fontSize: "20px",
        color: "#f2f2f7",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const c: Carousel<T> = { options, index: initialIndex, labelText, valueText };

    this.makeArrow(x + 26, y + 44, "<", () => this.cycle(c, -1, onChange));
    this.makeArrow(x + 234, y + 44, ">", () => this.cycle(c, 1, onChange));
  }

  private cycle<T extends { id: string; label: string }>(
    c: Carousel<T>,
    dir: number,
    onChange: (opt: T) => void,
  ): void {
    c.index = (c.index + dir + c.options.length) % c.options.length;
    const opt = c.options[c.index]!;
    c.valueText.setText(opt.label);
    Sound.click();
    onChange(opt);
  }

  private makeArrow(x: number, y: number, glyph: string, onClick: () => void): void {
    // 48 px hit area = ≥44 pt Apple HIG even after FIT scales the canvas down.
    const bg = this.add.rectangle(x, y, 48, 48, COLORS.panelLight, 1).setOrigin(0.5);
    bg.setStrokeStyle(2, COLORS.accent);
    const text = this.add
      .text(x, y, glyph, { fontSize: "26px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
    bg.on("pointerover", () => bg.setFillStyle(COLORS.accent, 1));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.panelLight, 1));
    void text;
  }

  private makeBigButton(
    x: number,
    y: number,
    text: string,
    color: number,
    onClick: () => void,
  ): void {
    const bg = this.add.rectangle(x, y, 140, 52, color, 1).setOrigin(0.5);
    bg.setStrokeStyle(2, COLORS.text);
    this.add.text(x, y, text, { fontSize: "16px", color: "#1b1f3b", fontStyle: "bold" }).setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", onClick);
  }

  private confirm(): void {
    Sound.pickup();
    GameState.setCharacterOutfit(this.charId, this.working);
    this.close();
  }

  private cancel(): void {
    Sound.click();
    this.working = { ...this.original };
    this.close();
  }

  private close(): void {
    const loc = this.scene.get("Location");
    loc.events.emit("ui:editor-closed");
    this.scene.stop();
  }
}
