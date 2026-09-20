# Change Log

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
