# Change Log

## [1.2.0]

The original theme now goes through the same generator as the rest of the family.

### Changed

- **Shades** picks up the ~550 workbench keys it was missing: bracket pair colors and
  guides, chat and inline chat, Command Center, inlay hints, sticky scroll, peek view,
  diff and merge, git decorations, test coverage, inline edits and multi-file diff.
  Its palette is preserved verbatim, so the editor looks like the theme you installed.
- Two colors moved, both for legibility: comments were `#546E7A` at 2.71:1, under the 3:1
  floor for de-emphasized text, and the line-number grey sat exactly on it. Both were
  lifted a hair at the same hue.
- The active tab now matches the editor background rather than sitting a shade off it.
- Terminal ANSI colors are derived from the theme's own syntax hues, so the terminal and
  the editor finally agree.

## [1.1.0]

Shades becomes a family.

### Added

- **Nine new themes**, seven dark and two light: Nocturne, Aurora, Ember, Mocha, Abyss,
  Verdant, Muted, Daylight and Frost.
- **A palette-driven generator** (`tools/`). Themes are built from role definitions rather
  than hand-edited JSON, so every variant covers the same surface.
- **A readability audit** that fails the build when a code-carrying token drops below
  4.5:1, comments fall below 3:1, or two syntax hues become indistinguishable. It warns on
  banding between surfaces and on red/green pairs with no lightness gap.
- **Perceptual lightness harmonization.** Each theme pins all of its syntax colors to one
  OKLCH lightness, so no token visually outshouts its neighbours.
- **Coverage for the current VS Code layout** in the new themes: chat and inline chat,
  Command Center, secondary side bar, inline edits, multi-file diff, editor action list,
  terminal command decorations and sticky scroll, test coverage, comments and review,
  notebooks, bracket pairs 1–6, active indent guides 1–6, inlay hints, peek view, merge
  conflicts, and all 16 terminal ANSI colors derived from each theme's own syntax hues.
- `npm run build:themes` and `npm run check:themes`.

### Notes

- The original **Shades** theme is unchanged. Existing users see exactly what they saw
  before; the new variants sit alongside it in the theme picker.

## [1.0.7] and earlier

- Title bar colors, TypeScript color refinements, and patch releases of the original
  Shades theme.
