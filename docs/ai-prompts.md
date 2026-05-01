# AI-Prompt-Templates für NinaNocaWorld-Assets

Diese Datei sammelt copy-paste-fertige Prompts, mit denen du SVG-Assets im **Toca-Boca-nahen Stil** über Recraft, DALL·E / GPT-4o, Stable Diffusion oder Midjourney generieren kannst. Jedes generierte Asset landet anschließend unter `public/assets/svg/<kategorie>/` und bekommt einen Eintrag in `src/data/assetManifest.ts`.

Die Datei ist als Werkzeug gedacht — Änderungen daran beeinflussen nichts am Code.

---

## 1. Workflow

1. **Style-Bibel** (Abschnitt 2) einmal lesen, einmal merken. Jeder Asset-Prompt enthält sie, du kannst sie dort entweder so lassen oder bei besseren Resultaten verfeinern und in alle Prompts zurückkopieren.
2. **Erstes Test-Asset generieren** (z. B. „Apfel" — Abschnitt 4). Iterieren bis dir der Look gefällt.
3. **Style-Reference** speichern: bei Recraft mit „Save as style"; bei anderen Tools speicherst du den ersten Output als Bild und referenzierst ihn als Style-Anker (img2img, IP-Adapter, „in the style of attached image").
4. **Restliche Assets** in Serie mit derselben Style-Reference. Pro Asset 2-4 Generierungen, beste auswählen.
5. **Post-Processing** (Abschnitt 6): SVG normalisieren, viewBox setzen, in das Repo-Verzeichnis legen, Manifest-Eintrag hinzufügen.

**Wenn du nur eine Stunde hast:** Generiere die 7 Items + 4 Räume und ignoriere Charaktere — die Layer-Trennung ist der teuerste Schritt.

---

## 2. Style-Bibel (in jedem Prompt wiederverwenden)

**Positiv (immer mit dranhängen):**

```
soft hand-drawn cartoon style, friendly children's mobile game aesthetic
similar to Toca Boca, Sago Mini and Hey Duggee illustrations
slightly imperfect dark navy outlines (~2 px), gentle organic linework
warm pastel color palette, slightly desaturated, cheerful but not neon
flat color blocks with one soft highlight and one soft shadow per shape
no realistic photo gradients, no metallic surfaces, no 3D shading
matte finish, paper-like texture feel, rounded corners on every shape
isolated subject, transparent background, no scenery, no text, no watermark
```

**Negativ (für Recraft/SD/Midjourney als Negative-Prompt — bei DALL·E in Worten:
„avoid X, no Y …" einsetzen):**

```
photorealistic, realistic, 3D render, octane, unreal engine, hyperrealistic
anime, manga, pixel art, voxel, low-poly, blocky
sharp angular edges, metallic highlights, chrome, glossy plastic
thick black outlines, harsh shadows, perfect gradients, neon
text, letters, watermark, signature, logo, ui elements
background, scenery, sky, environment, gradient sky
deformed, extra limbs, disfigured, blurry, low quality
```

**Farbreferenz-Werte** (aus unserem Code, halte sie ein, wenn du den Look „lokal" hältst):

| Rolle | Hex | Verwendung |
|---|---|---|
| Outline | `#2a2233` | Linien |
| Hauttöne | `#f6d8b5 #e5b48a #c99565 #8b5a3c #d9b896` | Charaktere |
| Akzent-Gelb | `#f6c177` | UI, Lampen |
| Akzent-Rot | `#d9534f` | Apfel, rote Shirts |
| Akzent-Blau | `#4a7fc1 #6e9bd4` | Blaue Shirts, Wasser |
| Akzent-Grün | `#6abf69` | Pflanzen, Hügel |
| Hintergrund | `#0d0f24` | Spiel-Außenrand |

---

## 3. Charaktere

### Wichtige Vorbemerkung

Unser Charakter ist ein **5-Layer-Composite** mit gemeinsamer `viewBox="0 0 100 190"`:

```
skin (base) → bottom → top → shoes → hair
```

Alle Layer müssen pixelgenau übereinanderliegen. AI ist beim **per-Layer-Generieren** (z. B. „nur Haar, schwebend") unsicher und unsauber. **Empfohlener Workflow:**

1. Mit `prompt: full character` einen kompletten Charakter generieren (idealerweise mit explizit „neutral pose, arms slightly spread, front view, full body").
2. In Inkscape öffnen, in fünf Dateien zerlegen:
   - `skin/<name>.svg` — alles Hautfarben (Kopf + Gesicht + Hände + Beine + Torso) ohne Kleidung & Frisur
   - `hair/<name>.svg` — nur das Haar
   - `top/<name>.svg` — nur das Oberteil (inkl. Ärmel-Teile, die über die Arme gehen)
   - `bottom/<name>.svg` — nur Hose / Rock (Hüfte + Beine wenn lang)
   - `shoes/<name>.svg` — nur die Schuhe

   Alle fünf Dateien teilen sich die gleiche `viewBox="0 0 100 190"` mit der Figur an gleicher Position. Achtung: beim Speichern der Sub-Layer in Inkscape **niemals** die viewBox croppen!

3. Anatomie-Anker (entspricht `src/graphics/drawCharacter.ts`):
   - Kopfmitte bei (50, 43) — also ungefähr `cy - 52` von Mitte (95)
   - Schulter-Linie bei y = 64
   - Hüfte bei y = 102
   - Knie bei y = 132
   - Schuhsohle bei y = 167

### Master-Prompt: kompletter Charakter (zum Zerlegen)

**Use-Case:** Du willst einen vollständigen Charakter generieren und manuell aufteilen.

**Variablen:** `{SKIN}` `{HAIR}` `{TOP}` `{BOTTOM}` `{SHOES}` aus den Listen unten ersetzen.

```
A cute cartoon kid character, full body, front view, standing neutral pose
with arms slightly spread, oversized round head about 40% of body height,
chunky compact body, very large expressive eyes with white shine, soft
visible cheek blush, thin curved eyebrows, small smile

Skin: {SKIN}
Hair: {HAIR}
Top: {TOP}
Bottom: {BOTTOM}
Shoes: {SHOES}

[+ Style-Bibel Abschnitt 2]

aspect ratio 10:19, character vertically centered with feet near bottom
edge and hair near top edge, equal small margin all around
```

Aspekt-Hinweis: Wenn das Tool kein 10:19 unterstützt, generiere bei 1:1 quadratisch mit dem Charakter mittig, croppe danach.

### Skin-Tone-Variablen `{SKIN}`

| ID | Prompt-Phrase |
|---|---|
| `light` | `light peach skin tone (#f6d8b5)` |
| `warm` | `warm beige skin tone (#e5b48a)` |
| `tan` | `sun-kissed tan skin tone (#c99565)` |
| `deep` | `deep rich brown skin tone (#8b5a3c)` |
| `cool` | `cool light olive skin tone (#d9b896)` |

### Hair-Variablen `{HAIR}`

| ID | Prompt-Phrase |
|---|---|
| `short` | `short tousled hair, dark espresso brown (#3a2818), softly framing the face, small forehead fringe` |
| `long` | `long shoulder-length hair, warm chestnut brown (#6b4226), parted side fringe, slight wave` |
| `curly` | `bouncy curly hair forming a soft halo around the head, copper-orange (#c46a3a)` |
| `spiky` | `playful spiky hair sticking upward in even tufts, bright lemon yellow (#fddc5c)` |
| `ponytail` | `cheerful side ponytail tied with a small white band, jet black (#222222)` |

### Top-Variablen `{TOP}`

| ID | Prompt-Phrase |
|---|---|
| `redshirt` | `simple short-sleeve t-shirt in friendly red (#d9534f), soft round neckline` |
| `blueshirt` | `simple short-sleeve t-shirt in calm cornflower blue (#4a7fc1)` |
| `greenshirt` | `simple short-sleeve t-shirt in mint green (#6abf69)` |
| `yellowshirt` | `simple short-sleeve t-shirt in soft sunshine yellow (#f6c177)` |
| `purpleshirt` | `simple short-sleeve t-shirt in lavender purple (#9b6ec1)` |

### Bottom-Variablen `{BOTTOM}`

| ID | Style-Phrase |
|---|---|
| `jeans` | `long denim jeans in dark indigo (#2e4a7a), simple, no pockets visible` |
| `shorts` | `knee-length shorts in mint green (#6abf69)` |
| `skirt` | `flared mini skirt in pink (#d96bb1), gentle a-line shape` |
| `khaki` | `long khaki cargo-style trousers in muted tan (#a68a5b)` |

### Shoes-Variablen `{SHOES}`

| ID | Style-Phrase |
|---|---|
| `sneakers` | `chunky white sneakers (#ffffff) with simple sole accent` |
| `boots` | `dark brown ankle boots (#3a2818) with rounded toes` |
| `sandals` | `light tan sandals (#c99565) with two cross straps` |

### Verbleibend: einzelne Layer als reine SVG (Erfahrungs-Sache)

Wenn du es trotzdem layer-weise versuchen willst — typische Phrasen, die für die meisten Tools funktionieren, ohne dass plötzlich ein ganzer Körper drin steht:

```
just the {LAYER} of a cartoon character, isolated on transparent background,
correctly positioned as if it were on the body
```

- `{LAYER} = "T-shirt with short sleeves"` für tops
- `{LAYER} = "long jeans"` für bottoms
- `{LAYER} = "curly hair"` für hair (braucht hier oft eine kleine Kopf-Silhouette als Anker, sonst „schwebt das Haar")

In der Praxis ist die Zerlege-Strategie zuverlässiger.

---

## 4. Items

### General-Tipps für alle Items

- Subjekt **vertikal mittig + leicht nach unten verschoben**, sodass unten Platz für den Boden-Schatten bleibt.
- Quadratisch generieren (1:1) und nachher in Inkscape croppen / zur Ziel-Aspekt-Ratio padden.
- Output sollte sichtbar **auf einer Standfläche stehen** (kleiner weicher Schatten unten). Falls das Tool dazu neigt, alles zu zentrieren, expliziert: „with soft shadow ellipse below the object".

### Apfel — `items/apple.svg`

- viewBox: `0 0 50 50`, Aspekt 1:1

```
A cute cartoon red apple, plump round body, glossy soft highlight on the
upper left, small brown stem on top, single bright green leaf with a vein,
tiny soft shadow ellipse beneath it on a transparent floor

[+ Style-Bibel Abschnitt 2]

centered, square 1:1 composition, plenty of margin around the apple
```

### Brot — `items/bread.svg`

- viewBox: `0 0 70 50`, Aspekt 7:5

```
A cute cartoon loaf of bread, plump oval shape with three or four diagonal
crust score lines, golden-brown top color (#d6a86a), slightly lighter floury
underside, gentle soft highlight on the upper-left, small soft shadow
ellipse below

[+ Style-Bibel Abschnitt 2]

horizontal 7:5 composition, the loaf takes about 80% of the width, centered
```

### Ball — `items/ball.svg`

- viewBox: `0 0 55 55`, Aspekt 1:1

```
A bouncy cartoon kids' ball, round, vivid coral red (#ff6b6b) top and bottom,
a teal mint band (#4ecdc4) running horizontally across the middle, single
white highlight on the upper-left, soft shadow ellipse below

[+ Style-Bibel Abschnitt 2]

centered square 1:1, the ball at about 80% of canvas size
```

### Sofa — `items/sofa.svg`

- viewBox: `0 0 140 70`, Aspekt 2:1

```
A friendly cartoon two-seater sofa, viewed straight from the front, two or
three plush cushions on the seat, two padded armrests slightly wider than
the seat sides, low backrest with a top sheen, two short visible wooden
legs at the bottom corners, body color warm coral (#e07a5f)

[+ Style-Bibel Abschnitt 2]

horizontal 2:1 composition, sofa fills about 90% of canvas width and 95%
of canvas height, soft shadow ellipse below the legs, transparent background
```

### Bett — `items/bed.svg`

- viewBox: `0 0 160 90`, Aspekt 16:9

```
A cute cartoon child's bed, side-front 3/4 view, tall warm-brown wooden
headboard on the left side (#8a5a2c), cream mattress (#faeed7), single
white pillow at the head end, blue striped blanket folded over the foot
end (#6e9bd4 with darker stripes)

[+ Style-Bibel Abschnitt 2]

horizontal 16:9 composition, bed fills 95% of width, soft shadow ellipse
below, transparent background
```

### Tisch — `items/table.svg`

- viewBox: `0 0 110 70`, Aspekt 11:7

```
A round-cornered cartoon kids' table, viewed from the front-front, warm
honey-wood top (#c99a6b) with subtle grain hints, four short wooden legs
in darker tone (#6b4e2c), tiny top sheen, soft shadow ellipse below

[+ Style-Bibel Abschnitt 2]

horizontal 11:7 composition, table centered, transparent background
```

### Teddy — `items/teddy.svg`

- viewBox: `0 0 60 70`, Aspekt 6:7

```
A cute cartoon teddy bear, sitting upright facing forward, plump rounded
body in tan brown (#b78a55), softer beige belly patch (#cba07a), round
head with two small round ears, lighter inner ear circles, big black dot
eyes with single white shine, small dark nose, tiny smile, two short stubby
arms with paw pads, single belly stitch line down the middle

[+ Style-Bibel Abschnitt 2]

vertical 6:7 composition, teddy fills about 85% of canvas height, soft
shadow ellipse below, transparent background
```

---

## 5. Räume

### Wichtige Vorbemerkung

**Räume in NinaNocaWorld sind LEER** — nur die festen Gebäude-Elemente:

- Wände mit Tapete / Muster
- Boden mit Bodenbelag
- Optional: Fenster, Tür, eingebaute Theke (Küche), Wanne (Bad), Spiegel (Bad), Wand-Deko (Bild, Uhr, Regal), Pflanze in der Ecke

Die beweglichen Möbel werden separat als Items darübergelegt. Generiere **niemals** Sofa, Bett oder Stühle ins Raum-SVG hinein.

### Allgemeiner Raum-Prompt (Variablen ersetzen)

- viewBox: `0 0 1200 460`, Aspekt ~26:10 (sehr breit)

Tools wie DALL·E können extreme Breitseiten nicht direkt — Workaround: bei 16:9 generieren, dann in Inkscape die linke und rechte Hälfte als zwei separate Generierungen mit „extend left / extend right"-Prompt zusammenstückeln, oder generierte 16:9-Szene croppen + seitlich mit gleichem Wandmuster auffüllen.

```
A cute cartoon empty room interior, frontal flat orthographic view, the upper
60% of the image is the back wall, the lower 40% is the floor, baseboard
strip along the wall-floor line. NO furniture, NO movable objects, NO people.

Wall: {WALL_DESCRIPTION}
Floor: {FLOOR_DESCRIPTION}
Built-in features: {BUILTINS}

[+ Style-Bibel Abschnitt 2]

very wide 26:10 horizontal composition, child-friendly children's app
illustration aesthetic, transparent background outside the room (or solid
pure white if transparent isn't supported)
```

### Wohnzimmer — `rooms/living.svg`

```
{WALL_DESCRIPTION} =
warm cream beige wall (#f6dfbe) decorated with vertical wainscoting
panels — three or four tall outlined rectangles forming a feature wall

{FLOOR_DESCRIPTION} =
warm honey wooden plank floor (#c99a6b) with visible vertical plank
seams every ~110 px and a few horizontal stagger seams, gentle wood grain

{BUILTINS} =
on the left third a tall window with sky and rolling green hills inside,
red curtains on either side; in the middle-upper area a small framed
picture; right side a closed wooden door with two panel insets; small
ceiling lamp with a glowing shade hanging at the top center
```

### Küche — `rooms/kitchen.svg`

```
{WALL_DESCRIPTION} =
mint-green wall (#c8e1d4) covered in pale subway-tile pattern (small
horizontal rectangles in offset rows)

{FLOOR_DESCRIPTION} =
cream-and-tan checkered floor tiles (~70 px squares, alternating
#eae3cd and #c7c2a8 ish)

{BUILTINS} =
on the left a tall window with sky scenery; on the right side, two-thirds
of the wall is a built-in row of warm-tan kitchen cabinets with door
inset panels and tiny knobs, with a cream stone countertop on top of them,
and a white sink with chrome faucet sitting in the middle of the
counter; small wall clock on the upper right
```

### Bad — `rooms/bath.svg`

```
{WALL_DESCRIPTION} =
soft baby-blue wall (#bcd8e8) with regular small darker dots in a hex
grid pattern

{FLOOR_DESCRIPTION} =
pale grey-blue tile floor (#eaeef3) with thin grout lines forming a
60×60 px grid

{BUILTINS} =
on the left a square mirror with a metallic frame and visible reflection
streaks; in the middle-bottom area a freestanding white bathtub with
soapy blue water and a few large round bubbles floating above; on the
right wall a metallic towel rail with a folded yellow towel; tiny potted
plant in the lower-left corner
```

### Schlafzimmer — `rooms/bedroom.svg`

```
{WALL_DESCRIPTION} =
soft lavender wall (#e9c8e5) with small repeating darker-mauve dots
arranged in an offset grid

{FLOOR_DESCRIPTION} =
warm honey-brown wooden floor (#b38a5a) with vertical plank seams
and gentle horizontal grain hints

{BUILTINS} =
in the middle-upper area a tall window with sky and hills, red curtains
on either side; small ceiling lamp at the top right; a small framed
picture on the upper left; a wooden wall-mounted shelf with two or three
tiny decorative items; tiny round wall clock upper right
```

---

## 6. Post-Processing-Checkliste pro Asset

Bevor du eine generierte SVG ins Repo legst:

1. **Format**: ist es echtes SVG? (Rechtsklick → „Source anzeigen" — wenn ein `<svg>`-Tag drin ist, gut. Falls PNG → vektorisieren mit Inkscape „Bitmap nachzeichnen" oder vectorizer.ai.)
2. **viewBox**: in der `<svg>`-Tag-Zeile `viewBox="0 0 W H"` setzen (W/H aus den Tabellen oben). Inkscape: Datei → Eigenschaften → User-Einheiten anpassen.
3. **Hintergrund entfernen**: weiße Rechtecke löschen, falls vorhanden (Inkscape: weiße Rechtecke per Klick auswählen → Entf).
4. **Outlines normalisieren**: alle dicken/dunklen Outlines auf `#2a2233` setzen (Find&Replace oder Stroke-Farbe ändern).
5. **Anker prüfen** (Charaktere): Kopf, Schultern, Füße passen zur Anatomie aus Abschnitt 3.
6. **Datei speichern unter** `public/assets/svg/<kategorie>/<id>.svg`.
7. **Manifest-Eintrag** in `src/data/assetManifest.ts`:

   ```ts
   import { TextureKeys } from "./outfits";
   import { ITEMS } from "./items";

   export const ASSET_MANIFEST: AssetEntry[] = [
     { key: TextureKeys.item("apple"), path: "assets/svg/items/apple.svg",
       width: 50, height: 50 },
   ];
   ```

   Oder mit dem Helper:

   ```ts
   import { assetEntry } from "./assetManifest";
   export const ASSET_MANIFEST: AssetEntry[] = [
     assetEntry("item", "apple", "assets/svg/items/apple.svg"),
     assetEntry("hair", "curly", "assets/svg/character/hair/curly.svg"),
     assetEntry("room", "home", "assets/svg/rooms/living.svg", "living"),
   ];
   ```

8. **Seite neu laden** — fertig. Falls Asset nicht erscheint: Browser-Konsole prüfen, Pfad-Tippfehler oder SVG-Parse-Fehler.

---

## 7. Tool-spezifische Tipps

### Recraft.ai

- **„Vector"-Modus** wählen, nicht „Image" — der Vector-Modus liefert direkt SVG.
- **Style-Reference**: Erstes gutes Asset speichern. Beim nächsten Generieren als „Style" referenzieren, dann übernimmt Recraft Linienstärke, Farb-Palette und Schattierung.
- Recraft mag explizite Aspekt-Ratios nicht immer — generiere 1024×1024 und croppe nach.

### DALL·E 3 / GPT-4o (ChatGPT)

- Output ist **immer Raster (PNG)** — du musst danach mit Inkscape oder vectorizer.ai vektorisieren. Verlierst Linien-Schärfe; ggf. nachzeichnen.
- **Negative-Prompts** kennt es nicht — formuliere sie positiv um („on a clean transparent background, with no other objects in the scene, with no text or watermarks").
- Geht maximal 1024×1024 oder 1792×1024. Für extra-breite Räume nicht ideal.

### Stable Diffusion (lokal oder via Replicate)

- **SDXL + LineArt-LoRA** (z. B. „Flat Cartoon" oder „Children's Book Style") — das matcht den Toca-Look am besten.
- Bei img2img den ersten Asset als „control image" nutzen (IP-Adapter bei SDXL), das hält Style-Konsistenz besser als jeder Prompt allein.
- Output ist Raster → vektorisieren.

### Midjourney

- `--style raw` setzen, sonst wird's zu fotografisch.
- `--ar 1:1` für Items, `--ar 26:10` für Räume (geht bei v6).
- Output ist Raster → vektorisieren.

---

## 8. Konsistenz-Checkliste über die Sammlung

Sobald du 3-4 Assets fertig hast: alle nebeneinander legen und prüfen, dass **gleichbleibt**:

- Linienstärke (Outline-Weite optisch identisch)
- Linienfarbe (möglichst alle exakt `#2a2233`)
- Sättigungs-Niveau (kein Asset deutlich knalliger oder blasser)
- Schatten-Richtung (alle Highlights z. B. oben-links, alle Schatten unten-rechts)
- „Wobble"-Niveau der Linien (alle gleich präzise oder gleich krakelig)

Wenn ein Asset rausfällt → neu generieren oder per Hand nachjustieren. **Lieber 7 stilkonsistente Items als 12 mit Bruch.**
