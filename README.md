# NinaNocaWorld

Browser-Sandbox-Spiel im Stil von *Toca Life World* – privat, eigenständiger Stil und Markenname.

## Status

**Phase 1 – Skeleton & Engine-Plumbing.** Komplette Engine-Schicht ohne echte Grafiken: alle Spielobjekte sind farbige Rechtecke. Drag-and-Drop, Pro-Charakter-Inventar, Raum-Wechsel und Persistenz funktionieren.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # erzeugt dist/
npm run typecheck
```

## Was funktioniert in Phase 1

- 3 Charaktere (farbige Rechtecke), zwischen Räumen ziehbar.
- 4 Räume (Wohnzimmer, Küche, Bad, Schlafzimmer) im einen Schauplatz „Zuhause".
- Welt-Inventar in der unteren Leiste (Klick → Item erscheint im Raum).
- Charakter-Inventar in der unteren Leiste (folgt dem aktiven Charakter).
- Items im Raum frei verschiebbar (Drag).
- Items aus dem Raum nach unten ziehen → zurück ins Welt-Inventar.
- Charakter-Auswahl oben rechts (klick auf Punkt).
- Raum-Wechsel über `<` `>` unten am Spielfeldrand.
- Kompletter Zustand wird automatisch in `localStorage` gespeichert. Reload stellt alles wieder her.
- „Spielstand löschen" oben links (für Tests).

## Architektur

- `src/state/GameState.ts` – Singleton, Source of Truth über Scenes hinweg.
- `src/systems/SaveSystem.ts` – versionierte JSON-Persistenz mit Migrations-Hook.
- `src/systems/LocationLoader.ts` – On-Demand-Asset-Hook, in Phase 1 Stub.
- `src/systems/DragDrop.ts` – einheitliche Drag-Markierung für Items und Charaktere.
- `src/scenes/BootScene.ts` – initialisiert GameState aus Save oder Default.
- `src/scenes/PreloadScene.ts` – Progress-Bar (in Phase 1 Dummy-Tween).
- `src/scenes/LocationScene.ts` – generisch, rendert eine Location aus Daten.
- `src/scenes/UIScene.ts` – persistente Overlay-UI (Inventare, Charakter-Wahl).
- `src/data/locations/` – Location-Definitionen (rein Daten, kein Code pro Location).
- `src/data/items.ts`, `src/data/characters.ts` – Kataloge.

Phase 2 fügt Composite-Charakter mit Layer-System und Charakter-Editor hinzu, ohne diese Architektur zu ändern.

## Roadmap

Siehe `/root/.claude/plans/ich-m-chte-einen-clon-dynamic-wolf.md` für den Gesamtplan.
