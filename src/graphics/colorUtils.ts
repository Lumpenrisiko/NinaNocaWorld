/** Multiplies each RGB channel by `amount` (0 = black, 1 = unchanged). */
export function shade(color: number, amount: number): number {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) * amount));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) * amount));
  const b = Math.max(0, Math.min(255, (color & 0xff) * amount));
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

/** Mix `color` toward `target` by `t` (0..1). */
export function mix(color: number, target: number, t: number): number {
  const r1 = (color >> 16) & 0xff;
  const g1 = (color >> 8) & 0xff;
  const b1 = color & 0xff;
  const r2 = (target >> 16) & 0xff;
  const g2 = (target >> 8) & 0xff;
  const b2 = target & 0xff;
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

export const OUTLINE = 0x2a2233;
