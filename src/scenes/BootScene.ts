import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { SaveSystem } from "../systems/SaveSystem";
import { createInitialSave } from "../systems/InitialState";

/**
 * Decides between fresh game and loaded save, hands over to PreloadScene.
 * Lädt selbst keine Spiel-Assets — diese kommen in der PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const loaded = SaveSystem.load();
    GameState.init(loaded ?? createInitialSave());

    // Auto-persist whenever state changes.
    GameState.subscribe(() => {
      SaveSystem.save(GameState.snapshot);
    });

    this.scene.start("Preload");
  }
}
