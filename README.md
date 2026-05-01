# NinaNocaWorld

Browser-Sandbox-Spiel im Stil von *Toca Life World* – privat, eigenständiger Stil und Markenname.

## Status

**Phase 5 + Visual-Polish + iPad-Tuning.** Veröffentlichungsreif (Sound, Mute-Toggle, Loading-Screen, Bundle-Split, Favicon), mit aufgewertetem Look (Toca-Boca-Proportionen, Schatten, Highlights, Wand-Deko, Tapeten- und Boden-Varianten pro Raum) und für **iPad / iPadOS** optimiert: alle Touch-Targets ≥ 44 pt, Safe-Area-Inset für Notch und Home-Indicator, `100dvh` statt `100vh` (Safari-Adressleiste), warmer Cream-Letterbox-Hintergrund passend zur UI, Hochformat-Hinweis, Apple-Touch-Icon und ein proaktiver AudioContext-Unlock auf den ersten Touch. **Optionaler SVG-Pfad**: prozedurales Drawing dient als Fallback; pro Asset kann eine Vector-SVG hinterlegt werden (`public/assets/svg/`, `src/data/assetManifest.ts`). Demo: der Apfel wird bereits aus einer SVG mit Radial-Gradient gerendert. AI-Prompts für Asset-Generation in `docs/ai-prompts.md`.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # erzeugt dist/
npm run typecheck
```

## Was funktioniert

- 3 Charaktere als Composite-Sprites (Hautton, Haar, Oberteil, Unterteil, Schuhe – einzeln per Layer austauschbar), zwischen Räumen ziehbar.
- 4 Räume (Wohnzimmer, Küche, Bad, Schlafzimmer) im einen Schauplatz „Zuhause".
- Welt-Inventar in der unteren Leiste (Klick → Item erscheint im Raum).
- Charakter-Inventar in der unteren Leiste (folgt dem aktiven Charakter).
- Items im Raum frei verschiebbar (Drag).
- Items aus dem Raum nach unten ziehen → zurück ins Welt-Inventar.
- **Item auf einen Charakter ziehen → wandert ins Inventar dieses Charakters und reist mit, wenn er den Raum wechselt.**
- **Tap auf ein Item im Raum** öffnet ein kontextuelles Aktions-Menü für das aktive Kind: essen (verschwindet), hinsetzen, schlafen, spielen, knuddeln — mit Sprechblase, Mini-Animation (Hüpfen, Drehen, Wackeln, Schräglage) und passendem prozeduralen Sound.
- **Sound-Feedback** für jede Aktion, Item-Pickup/-Drop, Raumwechsel und Buttons. Mute-Toggle 🔊/🔇 oben rechts (persistiert).
- **Hinweis-Feedback** wenn man ein Item antippt und das aktive Kind in einem anderen Raum ist (🤔-Bubble + leiser Bonk).
- **Charakter-Editor (Button oben links):** Karussells für jede Layer-Kategorie, Live-Preview, Übernehmen/Abbrechen.
- Charakter-Auswahl oben rechts (Punkt = Top-Farbe des Charakters).
- Raum-Wechsel über `<` `>` unten am Spielfeldrand.
- Kompletter Zustand wird automatisch in `localStorage` gespeichert. Reload stellt alles wieder her – inklusive Outfits und Pro-Charakter-Inventaren.
- „Spielstand löschen" oben links (für Tests).

## Architektur

- `src/state/GameState.ts` – Singleton, Source of Truth über Scenes hinweg.
- `src/systems/SaveSystem.ts` – versionierte JSON-Persistenz mit Migrations-Hook.
- `src/systems/LocationLoader.ts` – On-Demand-Asset-Hook (Stub bis externe Assets dazukommen).
- `src/systems/DragDrop.ts` – einheitliche Drag-Markierung + Drop-Zone-Helper.
- `src/systems/ActionSystem.ts` – `executeAction(ctx, action)`: Sound, Sprechblase, Charakter-Tween, Item-Konsum.
- `src/systems/Sound.ts` – prozedurale Web-Audio-SFX (Oszillator + Hüllkurve, kein externes Sample). Mute-Toggle.
- `src/data/actions.ts` – `ITEM_ACTIONS` (per Item: erlaubte Aktionen + Emoji + Label) und `ACTION_BEHAVIOR` (per Aktion: Animation + Konsum).
- `src/entities/SpeechBubble.ts` – einmalige Pop-up-Bubble mit Pop-in/Hold/Float-up-Tween.
- `src/scenes/BootScene.ts` – initialisiert GameState aus Save oder Default.
- `src/scenes/PreloadScene.ts` – bakt alle Texturen über Phaser Graphics, mit Progress-Bar.
- `src/scenes/LocationScene.ts` – generisch, rendert eine Location aus Daten.
- `src/scenes/UIScene.ts` – persistente Overlay-UI (Inventare, Charakter-Wahl, Editor-Button).
- `src/scenes/CharacterEditorScene.ts` – modaler Avatar-Editor, pausierende Overlay-Scene.
- `src/entities/Character.ts` – Composite-Container mit fünf Image-Layern; `applyOutfit()` tauscht Texturen, `playReaction(anim, ms)` spielt Tween.
- `src/graphics/drawCharacter.ts` – Zeichenfunktionen + Texture-Baking pro Layer-Option.
- `src/graphics/drawItems.ts` – Zeichenfunktionen + Texture-Baking pro Item.
- `src/graphics/drawRoom.ts` – Zeichenfunktionen + Texture-Baking pro Raum.
- `src/graphics/textureFactory.ts` – `bakeTexture(scene, key, w, h, draw)` Helper. Überspringt jeden Key, der bereits als Textur existiert — daher gewinnt SVG immer gegen Procedural.
- `src/data/assetManifest.ts` – Liste der per-SVG-überschriebenen Texturen. Helfer `assetEntry(category, id, path)` löst Texture-Key + Größe automatisch auf.
- `public/assets/svg/` – Drop-Folder für Vector-Sprites; siehe README dort.
- `docs/ai-prompts.md` – copy-paste-fertige Prompt-Templates pro Asset für Recraft / DALL·E / Stable Diffusion / Midjourney, inkl. Style-Bibel, Größen-Tabellen und Post-Processing-Checkliste.
- `src/data/outfits.ts` – Outfit-Katalog inkl. Style-Felder + Texture-Key-Konvention.
- `src/data/locations/` – Location-Definitionen (Daten, kein Code pro Location).
- `src/data/items.ts`, `src/data/characters.ts` – Kataloge.

Wenn später echte Sprite-Assets reinkommen, ändert sich nur der Inhalt von `src/graphics/draw*.ts` — Aufrufer nutzen weiter `TextureKeys.*`. Eine neue Aktion = ein Eintrag in `ACTION_BEHAVIOR` plus Zuordnung in `ITEM_ACTIONS`. Eine neue Location = ein Eintrag in `src/data/locations/`, eine Draw-Funktion in `drawRoom.ts` und Default-Items im SaveSystem.

## Build / Deploy

`npm run build` erzeugt `dist/` mit `index.html`, einem App-Chunk (~44 KB gz) und einem Phaser-Chunk (~340 KB gz, separat cacheable). Inhalt von `dist/` lässt sich auf jedem statischen Hoster (GitHub Pages, Netlify, Vercel, S3+CloudFront) ausliefern – `vite.config.ts` setzt `base: "./"`, das Bundle ist relativ-pfad-tauglich.

## Roadmap

Siehe `/root/.claude/plans/ich-m-chte-einen-clon-dynamic-wolf.md` für den Gesamtplan.
