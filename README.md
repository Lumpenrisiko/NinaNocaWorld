# NinaNocaWorld

Browser-Sandbox-Spiel im Stil von *Toca Life World* – privat, eigenständiger Stil und Markenname.

## Status

**Phase 3 – Asset-Pipeline & Cartoon-Look.** Alle Sprites werden zur Laufzeit aus Phaser-Graphics-Primitiven gezeichnet und in der `PreloadScene` zu Texturen gebacken — Charaktere mit Gesicht, Möbel/Spielzeug mit Form-Details, jedes Zimmer mit Wand-/Boden-/Fenster-Look. Keine externen Asset-Dateien. Phase 4 füllt mehr Räume und Interaktionen, Phase 5 macht es veröffentlichungsfähig.

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
- `src/scenes/BootScene.ts` – initialisiert GameState aus Save oder Default.
- `src/scenes/PreloadScene.ts` – bakt alle Texturen über Phaser Graphics, mit Progress-Bar.
- `src/scenes/LocationScene.ts` – generisch, rendert eine Location aus Daten.
- `src/scenes/UIScene.ts` – persistente Overlay-UI (Inventare, Charakter-Wahl, Editor-Button).
- `src/scenes/CharacterEditorScene.ts` – modaler Avatar-Editor, pausierende Overlay-Scene.
- `src/entities/Character.ts` – Composite-Container mit fünf Image-Layern; `applyOutfit()` tauscht Texturen.
- `src/graphics/drawCharacter.ts` – Zeichenfunktionen + Texture-Baking pro Layer-Option.
- `src/graphics/drawItems.ts` – Zeichenfunktionen + Texture-Baking pro Item.
- `src/graphics/drawRoom.ts` – Zeichenfunktionen + Texture-Baking pro Raum.
- `src/graphics/textureFactory.ts` – `bakeTexture(scene, key, w, h, draw)` Helper.
- `src/data/outfits.ts` – Outfit-Katalog inkl. Style-Felder + Texture-Key-Konvention.
- `src/data/locations/` – Location-Definitionen (Daten, kein Code pro Location).
- `src/data/items.ts`, `src/data/characters.ts` – Kataloge.

Phase 4 füllt weitere Räume mit Detail und ergänzt 5+ Interaktionen (essen, schlafen, Lampen, etc.). Wenn später echte Sprite-Assets reinkommen, ändert sich nur der Inhalt von `src/graphics/draw*.ts` — Aufrufer nutzen weiter `TextureKeys.*`.

## Roadmap

Siehe `/root/.claude/plans/ich-m-chte-einen-clon-dynamic-wolf.md` für den Gesamtplan.
