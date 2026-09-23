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
