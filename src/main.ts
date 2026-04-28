import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { LocationScene } from "./scenes/LocationScene";
import { UIScene } from "./scenes/UIScene";
import { CharacterEditorScene } from "./scenes/CharacterEditorScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, PreloadScene, LocationScene, UIScene, CharacterEditorScene],
};

new Phaser.Game(config);
