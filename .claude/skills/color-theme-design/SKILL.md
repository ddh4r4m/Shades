---
name: color-theme-design
description: Design and evaluate color themes, palettes, and UI color systems — editor themes (VS Code), app design tokens, dark/light mode pairs. Use when creating a theme, picking syntax colors, judging whether a palette is readable, fixing "this looks off but I can't say why", or auditing contrast and colorblind safety.
---

# Color theme design

A theme is a reading instrument, not a mood board. Someone stares at it for eight hours
and needs to find a function name in a wall of text. Everything below serves that.

## The method, in order

1. **Roles before colors.** Name what a color *means* (`string`, `keyword`, `bgElevated`,
   `error`), never where it goes. One role maps to many UI keys. Change the role, every
   key follows. Palettes that list `sidebarBlue` rot within a week.
2. **Pick the background first.** Everything else is a reaction to it.
3. **Author hues, not lightness.** Choose each syntax color for its *hue* and *chroma*.
4. **Harmonize lightness mechanically.** Pin every syntax hue to one perceived lightness
   (see below). Do this in code, not by eye.
5. **Audit.** Contrast ratios, hue separation, lightness spread, colorblind pairs.
6. **Read real code in it.** A palette that audits clean can still feel wrong. Open a
   long file in three languages before shipping.

## Perceptual lightness is the whole game

HSL lies. `#0000ff` and `#ffff00` are both "50% lightness" and nowhere near equally
bright. Use **OKLCH**, where `L` matches what the eye reports.

**The single highest-leverage rule: every syntax color in a theme should sit at the same
OKLCH `L`.** When lightness varies, a line of code flickers bright-dim-bright and the eye
gets dragged to whichever token happens to be palest — which is rarely the important one.
When lightness is flat, the eye reads *hue* as meaning and the line reads as one band of
text. This is what separates the well-regarded modern themes from the 2014 generation;
one widely-cited analysis found Dracula's syntax colors span ~23 L points, which is why
its yellow visually shouts over its red.

Targets that work:

| Theme type | Background L | Syntax L | Body text contrast |
|---|---|---|---|
| Dark | 0.18–0.26 | 0.78–0.86 | 10:1–15:1 |
| Light | 0.96–0.99 | 0.45–0.55 | 9:1–13:1 |

Keep hue and let chroma give: to hit a target `L`, convert to OKLCH, set `L`, then walk
chroma down until the color fits in sRGB. Never clamp RGB channels directly — that shifts
the hue and your careful violet lands on blue.

**Diagnostics are exempt.** `error`, `warning`, `info` are *supposed* to break out of the
band. If your red sits politely at the same lightness as everything else, it stops being
an alarm.

## Contrast floors

- **4.5:1** — every token that carries code. Non-negotiable.
- **3:1** — de-emphasized text (comments) and UI chrome, borders, icons.
- **7:1** — body text if you want to claim AAA. Most good dark themes land 10:1+ anyway.
- **Ceiling on comments:** above ~7:1 they compete with code. 3:1–5:1 is the pocket.

Check translucent colors against what the eye actually receives — flatten the alpha over
its backdrop first, then measure. A `#ffffff20` selection over a dark editor is not white.

## Backgrounds

- **Never pure black.** `#000` maximizes halation: bright glyphs bleed outward. Roughly a
  third of adults have astigmatism and are disproportionately affected. Dark backgrounds
  live in the `#121212`–`#2d2d30` band. OLED-targeted themes may go near-black (~`#0b0d13`)
  but should raise chroma slightly to compensate.
- **Never pure white either**, for the same glare reason. `#f8fafd` or a warm `#fbf7f0`.
- **Tint the neutrals.** Pin every surface and gray to *one* hue — the good themes do this
  (One Dark ≈ 264°, Dracula ≈ 277°). Untinted `#808080` grays look dead next to tinted code.
- **Dim the foreground.** Body text is never `#ffffff` on dark; `#cdd6f4`-class values
  reduce halation and leave headroom for genuine emphasis.

## The hue budget

Eight accent hues is the working maximum; five carry the weight:

| Role | Conventional hue | Why it survives |
|---|---|---|
| `keyword` | violet / magenta | Structural, frequent, needs to recede slightly |
| `string` | green | Large contiguous blocks; green is restful at size |
| `func` | blue | The thing you scan for most |
| `type` | amber / yellow | Rare, deserves to pop |
| `constant` | orange | Adjacent to type but distinguishable at a glance |

Then `property` (cyan), `tag` (coral), `operator`/`punctuation` (muted), `comment` (the
background's hue, desaturated), `parameter` (italic, low chroma).

Rules that matter more than the specific hues:
- **Two roles that appear adjacent must differ by ≥25° of hue** or by lightness. `type`
  and `constant` sitting 10° apart is the most common failure.
- **Variables usually should not have a color.** Setting `variable` to plain foreground is
  a feature: it makes the *colored* things mean something.
- **Reserve saturation.** If everything is vivid, nothing is.

## Weight and italics

Color is not the only channel, and it is the weakest one for people who can't see some of it.

- **Bold** for declarations (where a thing is *defined*), never for calls. This gives
  "jump to definition" a visual analogue.
- **Italic** for comments, parameters, language variables (`this`, `self`), builtins, and
  type parameters — things that are context rather than content.
- Ship the theme so it reads correctly with a non-italic font too. Never encode *only* in
  italic.

## Accessibility beyond contrast

- **Deuteranopia affects ~6% of men.** Red-vs-green at the same lightness is the one
  pairing they cannot resolve. This hits diff and git decorations hardest. Give added and
  deleted a **lightness gap of ≥5 OKLCH points**, and add `insertedTextBorder` /
  `removedTextBorder` so shape carries the meaning too.
- **Never encode meaning in hue alone** anywhere a decision depends on it.
- **Don't over-claim.** Dark mode is not proven to reduce eye strain physiologically — it
  reduces *subjective* fatigue in dim rooms. Say "lower glare in dark rooms", not "reduces
  eye strain". Likewise, only claim WCAG AA if you have actually measured every token.

## UI and UX layer

The editor is one surface among many; the chrome around it is where themes usually fall apart.

- **Elevation through lightness, one step at a time.** Dark: surfaces get *lighter* as they
  come forward (editor → sidebar → overlay). Light: they get *darker*. Keep adjacent
  surfaces within **1.6:1** of each other — beyond that the window reads as stripes.
- **Overlays need a border and a shadow**, not just a fill. Without them a command palette
  dissolves into the editor behind it.
- **State colors should be translucent tints of the accent**, not new opaque colors. A 10%
  accent wash for hover, ~20% for selection, ~30% for active. They then compose correctly
  over any surface and survive palette changes.
- **Focus must be visible without color perception** — use a border/outline, not a fill swap.
- **Selection must not destroy the text under it.** Test selecting a line containing every
  syntax color; if any token disappears, the selection is too opaque.
- **The chrome should be quieter than the content.** Sidebar text at `fgMuted`, inactive
  tabs at `fgSubtle`. If the file tree competes with the code, the theme is loud.
- **Naming, in a picker:** prefix every variant with the family name (`Shades Nocturne`,
  `Shades Frost`) so they group together, and let the second word carry the mood. Bare
  variant names scatter across an alphabetical list.
- **Ship a light variant.** Light-first themes hold millions of installs; "dark only" is
  the most common review complaint.

## Editor-theme specifics

A theme is judged on the ten minutes *after* the honeymoon: the first merge conflict, the
first peek-definition, the first failing test. Cover those surfaces or the theme feels
half-finished. See `references/vscode-theme-keys.md` for the full checklist of workbench
keys, including the ones almost everyone forgets, and the newer UI surfaces.

Two structural notes: set `"semanticHighlighting": true` or `semanticTokenColors` is
ignored, and give the theme file a `"type"` so VS Code can infer defaults for keys you
skipped.

## This repo

Themes are generated, not hand-edited. Editing `themes/*.json` directly is wasted work —
the next build overwrites it.

```
tools/palettes.js     one object per theme: roles -> hex. This is the creative surface.
tools/build-theme.js  palette -> full theme. Workbench keys and token scopes live here.
tools/color.js        OKLCH, contrast, mixing, gamut-safe lightness setting.
tools/build.js        builds all themes, audits them, syncs package.json.
```

To add a theme: append a palette to `tools/palettes.js`, run `npm run build:themes`, fix
whatever the audit reports. To change something for *every* theme, edit `build-theme.js`.

The audit fails the build on: any code-carrying token below 4.5:1, comments below 3:1,
identical or indistinguishable hue pairs. It warns on lightness spread above 10 points,
surfaces more than 1.6:1 apart, loud comments, and red/green pairs with no lightness gap.

## Pitfalls

- Hand-tuning one theme in a family — the others silently drift.
- Testing only on your own code. Open JSON, YAML, Markdown, a diff, and a language with
  heavy type annotations.
- Forgetting the terminal. ANSI 16 should reuse the syntax hues or the terminal looks
  like a different product.
- Coloring `source.<lang>` or another blanket scope — it overrides everything beneath it.
- Making "unnecessary code" / ghost text so faint it's invisible, or so strong it's not a hint.
- Shipping a background that looks great at 100% brightness and is unusable at 30%.
