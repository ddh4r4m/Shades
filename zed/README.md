# Shades of Stoicism — Zed themes

Ten themes, eight dark and two light, generated from the same palettes as the
[VS Code edition](https://marketplace.visualstudio.com/items?itemName=ddh4r4m.shadesai).

Every syntax colour in a theme sits at one perceptual lightness (OKLCH), so a line of
code reads as a single band of text instead of flickering bright to dim. Every colour
that carries code clears 4.5:1 against its background — the build refuses to emit a
theme that doesn't.

| Theme | | |
|---|---|---|
| Shades | dark | The original. Deep indigo, cyan accents, tuned for Go. |
| Shades of Stoicism Nocturne | dark | Deep indigo night, vivid accents, low glare. |
| Shades of Stoicism Aurora | dark | Arctic calm. Low-chroma steel and sage. |
| Shades of Stoicism Ember | dark | Warm retro terminal. Amber and olive, no blue glare. |
| Shades of Stoicism Mocha | dark | Soft pastels on warm plum. |
| Shades of Stoicism Abyss | dark | Near-black OLED contrast. |
| Shades of Stoicism Verdant | dark | Deep forest greens with water blues. |
| Shades of Stoicism Muted | dark | Low-colour focus; colour reserved for strings and problems. |
| Shades of Stoicism Daylight | light | Warm paper, ink-grade contrast. |
| Shades of Stoicism Frost | light | Cool daylight, crisp blue-grey. |

## The themes

### Nocturne <sub>dark</sub>

Deep indigo night. Vivid accents on a low-glare base.

![Shades of Stoicism Nocturne](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/nocturne.webp)

### Aurora <sub>dark</sub>

Arctic calm. Low-chroma steel and sage.

![Shades of Stoicism Aurora](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/aurora.webp)

### Ember <sub>dark</sub>

Warm retro terminal. Amber and olive, no blue glare.

![Shades of Stoicism Ember](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/ember.webp)

### Mocha <sub>dark</sub>

Soft pastels on warm plum.

![Shades of Stoicism Mocha](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/mocha.webp)

### Abyss <sub>dark</sub>

Near-black OLED contrast for bright rooms.

![Shades of Stoicism Abyss](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/abyss.webp)

### Verdant <sub>dark</sub>

Deep forest greens with water blues.

![Shades of Stoicism Verdant](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/verdant.webp)

### Muted <sub>dark</sub>

Low-colour focus. Colour kept for strings and problems.

![Shades of Stoicism Muted](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/muted.webp)

### Daylight <sub>light</sub>

Warm paper, ink-grade contrast.

![Shades of Stoicism Daylight](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/daylight.webp)

### Frost <sub>light</sub>

Cool daylight, crisp blue-grey.

![Shades of Stoicism Frost](https://raw.githubusercontent.com/ddh4r4m/Shades/main/screenshots/frost.webp)

Images are hosted in the [source repo](https://github.com/ddh4r4m/Shades) so this
extension stays small for everyone cloning the Zed registry.

## Local install

Copy `themes/shades-of-stoicism.json` into `~/.config/zed/themes/`, then pick a variant
from the theme selector. Zed reloads user themes without a restart.

## Building

The themes are generated, not hand-edited — editing the JSON is wasted work.

```bash
node tools/build-zed.js   # from the repo root
```

Colours live in `tools/palettes.js` as named roles; `tools/build-zed.js` maps those roles
onto Zed's ~140 style keys and its syntax tokens. The same palettes drive the VS Code build.

MIT licensed.
