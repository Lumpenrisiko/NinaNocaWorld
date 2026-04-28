# NinaNocaWorld

Browser-Sandbox-Spiel im Stil von *Toca Life World* – privat, eigenständiger Stil und Markenname.

## Status

**Phase 2 – Charakter-System.** Aufbauend auf der Engine-Schicht aus Phase 1: Composite-Charaktere mit fünf Layern (Hautton, Haar, Oberteil, Unterteil, Schuhe), Charakter-Editor mit Karussells, Item-Pickup durch Drop-auf-Charakter. Alle Layer sind weiterhin Platzhalter-Rechtecke; Phase 3 ersetzt sie durch echte Sprites.

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
- `src/systems/LocationLoader.ts` – On-Demand-Asset-Hook, in Phase 1 Stub.
- `src/systems/DragDrop.ts` – einheitliche Drag-Markierung für Items und Charaktere.
- `src/scenes/BootScene.ts` – initialisiert GameState aus Save oder Default.
- `src/scenes/PreloadScene.ts` – Progress-Bar (in Phase 1 Dummy-Tween).
- `src/scenes/LocationScene.ts` – generisch, rendert eine Location aus Daten.
- `src/scenes/UIScene.ts` – persistente Overlay-UI (Inventare, Charakter-Wahl, Editor-Button).
- `src/scenes/CharacterEditorScene.ts` – modaler Avatar-Editor, läuft als pausierende Overlay-Scene.
- `src/entities/Character.ts` – Composite-Container mit fünf Layern; `applyOutfit()` ist der einzige Mutator.
- `src/data/outfits.ts` – Katalog der Outfit-Optionen pro Layer.
- `src/data/locations/` – Location-Definitionen (rein Daten, kein Code pro Location).
- `src/data/items.ts`, `src/data/characters.ts` – Kataloge.

Phase 3 ersetzt die Layer-Rechtecke durch echte Sprites/Atlanten, ohne `Character`/`OutfitCatalog`-Schnittstelle zu ändern.

## Roadmap

Siehe `/root/.claude/plans/ich-m-chte-einen-clon-dynamic-wolf.md` für den Gesamtplan.
