# SVG-Asset-Verzeichnis

Hier werden Vector-Sprites abgelegt, die das prozedurale Drawing aus `src/graphics/draw*.ts` ersetzen sollen. Pro abgelegter Datei ein Eintrag in `src/data/assetManifest.ts`. Alles andere bleibt prozedural — du kannst Asset für Asset migrieren.

## Verzeichnisstruktur

```
public/assets/svg/
├── character/
│   ├── skin/        # light.svg, warm.svg, tan.svg, deep.svg, cool.svg
│   ├── hair/        # short.svg, long.svg, curly.svg, spiky.svg, ponytail.svg
│   ├── top/         # redshirt.svg, blueshirt.svg, …
│   ├── bottom/      # jeans.svg, shorts.svg, skirt.svg, khaki.svg
│   └── shoes/       # sneakers.svg, boots.svg, sandals.svg
├── items/           # apple.svg, bread.svg, sofa.svg, …
└── rooms/           # living.svg, kitchen.svg, bath.svg, bedroom.svg
```

## Format-Regeln

Damit ein SVG sich nahtlos einfügt, gilt:

| Asset-Klasse | viewBox / Größe | Origin / Anker |
|---|---|---|
| Charakter-Layer | `viewBox="0 0 100 190"` | Mittelpunkt der Figur ist `(50, 95)` — Kopf oben, Füße unten |
| Item | `viewBox="0 0 W H"` mit W/H = `def.size` aus `src/data/items.ts` | Mittelpunkt = `(W/2, H/2)`; sichtbarer Schwerpunkt zentriert |
| Raum | `viewBox="0 0 1200 460"` | Top-left ist die Ecke des Raum-Views; Boden bei `y ≈ 253` |

Alle Layer eines Charakters müssen exakt dieselbe `viewBox` haben, sonst rutschen Hut, Hose und Schuhe gegeneinander.

## Eine SVG aktivieren

1. Datei unter den passenden Ordner legen, z. B. `items/apple.svg`.
2. In `src/data/assetManifest.ts` ergänzen:

   ```ts
   import { assetEntry } from "./assetManifest"; // zirkulär? — siehe unten
   export const ASSET_MANIFEST: AssetEntry[] = [
     assetEntry("item", "apple", "assets/svg/items/apple.svg"),
   ];
   ```

   `assetEntry` löst den Texture-Key und die Größe automatisch aus den Daten-Katalogen auf. Du brauchst die Größen nicht von Hand zu kennen.

3. Reload — der `PreloadScene`-Loader rastert die SVG, das prozedurale Drawing für genau diesen Key wird übersprungen.

Falls eine SVG fehlt oder nicht lädt, fällt die Engine still auf das Procedural-Asset zurück; das Spiel ist immer spielbar.

## SVGs erzeugen

Drei Wege je nach Vorliebe / Budget:

- **Selbst zeichnen** in Figma / Inkscape / Affinity Designer. Setze das Canvas auf die Größe aus der Tabelle oben.
- **AI-Generation** (Midjourney/DALL·E/Stable Diffusion) → PNG → vektorisieren (z. B. `vectorizer.ai`, `recraft.ai` oder Inkscape "Bitmap nachzeichnen").
- **Fertige Asset-Packs** (itch.io, OpenGameArt, Kenney). Lizenz prüfen.

Achte auf konsistenten Stil: gleiche Linienstärke, gleiche Sättigung, gleiche Schattierungsrichtung — sonst wirkt das Bild „zusammengewürfelt".

## Tipps für gleichmäßiges Aussehen

- Outlines: ~2 px breit (Inkscape: 2px Stroke), gleiche Farbe wie `OUTLINE` aus `colorUtils.ts` (`#2a2233`).
- Schatten: weicher, leicht transparenter Ellipsen-Schatten unter jedem Element.
- Highlights: 2-3 helle Flecken, eher links-oben, suggerieren Sonnenlicht.
- Farben: gesättigt, aber nicht knallig. Toca-Boca-typische Pastell-Sättigung.
