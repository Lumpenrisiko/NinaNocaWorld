import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { LocationScene } from "./scenes/LocationScene";
import { UIScene } from "./scenes/UIScene";
import { CharacterEditorScene } from "./scenes/CharacterEditorScene";
import { Sound } from "./systems/Sound";

try {
  if (window.localStorage.getItem("ninanocaworld:muted") === "1") {
    Sound.setMuted(true);
  }
} catch {
  /* localStorage unavailable */
}

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

const game = new Phaser.Game(config);

game.events.once("ready", () => {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 260);
});

// Fallback in case "ready" never fires (older Phaser/odd browser).
setTimeout(() => {
  const loader = document.getElementById("loader");
  if (loader && !loader.classList.contains("fade-out")) {
    loader.classList.add("fade-out");
    setTimeout(() => loader.remove(), 260);
  }
}, 4000);
