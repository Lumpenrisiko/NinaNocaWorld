import Phaser from "phaser";
import { GameState } from "../state/GameState";
import { ACTION_BEHAVIOR, type ActionId, type ItemActionConfig } from "../data/actions";
import { SpeechBubble } from "../entities/SpeechBubble";
import { Sound } from "./Sound";
import type { Character } from "../entities/Character";
import type { PlacedItem } from "../state/types";

const ACTION_SOUNDS: Record<ActionId, () => void> = {
  eat: () => Sound.munch(),
  sit: () => Sound.bounce(),
  sleep: () => Sound.zzz(),
  play: () => Sound.boing(),
  hug: () => Sound.awww(),
};

export interface ActionContext {
  scene: Phaser.Scene;
  character: Character;
  itemSprite: Phaser.GameObjects.Image;
  item: PlacedItem;
  locationId: string;
  roomId: string;
}

/**
 * Runs a single interaction:
 *   1. Speech bubble pops above the character.
 *   2. Character plays its reaction animation.
 *   3. If the action consumes the item, the item shrinks/fades during the
 *      tail of the animation, and is removed from the room state on completion
 *      (the resulting GameState event triggers a re-render).
 */
export function executeAction(ctx: ActionContext, action: ItemActionConfig): void {
  const behavior = ACTION_BEHAVIOR[action.id];

  ACTION_SOUNDS[action.id]?.();

  const head = ctx.character.headTop;
  new SpeechBubble(ctx.scene, head.x, head.y, action.emoji);

  ctx.character.playReaction(behavior.anim, behavior.durationMs);

  if (behavior.consumes) {
    const consumeDelay = Math.max(0, behavior.durationMs - 250);
    ctx.scene.tweens.add({
      targets: ctx.itemSprite,
      scale: 0,
      alpha: 0,
      duration: 250,
      delay: consumeDelay,
      ease: "Cubic.easeIn",
      onComplete: () => {
        GameState.removeItemFromRoom(ctx.locationId, ctx.roomId, ctx.item.instanceId);
      },
    });
  }
}
