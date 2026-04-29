/**
 * Action catalog. Per-item: which actions exist, with localized label and
 * emoji. Per-action: behavioural defaults (does it consume the item, which
 * character animation runs, how long).
 *
 * Adding a new interaction = new ItemActionConfig in ITEM_ACTIONS
 * (and, if the action id is new, an entry in ACTION_BEHAVIOR).
 */

export type ActionId = "eat" | "sit" | "sleep" | "play" | "hug";

export type ReactionAnim = "bounce" | "bob" | "rest" | "spin" | "wiggle";

export interface ItemActionConfig {
  id: ActionId;
  label: string;
  /** Shown in the speech bubble that pops above the character. */
  emoji: string;
}

export interface ActionBehavior {
  /** True → the item disappears from the room after the action. */
  consumes: boolean;
  anim: ReactionAnim;
  /** How long the character animation runs (ms). */
  durationMs: number;
}

export const ACTION_BEHAVIOR: Record<ActionId, ActionBehavior> = {
  eat: { consumes: true, anim: "bounce", durationMs: 600 },
  sit: { consumes: false, anim: "bob", durationMs: 600 },
  sleep: { consumes: false, anim: "rest", durationMs: 1400 },
  play: { consumes: false, anim: "spin", durationMs: 800 },
  hug: { consumes: false, anim: "wiggle", durationMs: 700 },
};

export const ITEM_ACTIONS: Record<string, ItemActionConfig[]> = {
  apple: [{ id: "eat", label: "Essen", emoji: "🍎" }],
  bread: [{ id: "eat", label: "Essen", emoji: "🍞" }],
  sofa: [{ id: "sit", label: "Hinsetzen", emoji: "😌" }],
  bed: [{ id: "sleep", label: "Schlafen", emoji: "💤" }],
  ball: [{ id: "play", label: "Spielen", emoji: "⚽" }],
  teddy: [{ id: "hug", label: "Knuddeln", emoji: "🤗" }],
};

export function getItemActions(defId: string): ItemActionConfig[] {
  return ITEM_ACTIONS[defId] ?? [];
}
