# VS Code theme coverage checklist

The full key list lives at https://code.visualstudio.com/api/references/theme-color.
This file is the shortlist: what a theme is actually judged on, and what almost
everyone forgets. Groups are ordered by how fast a user notices they're missing.

## Structural requirements

- Filename must end `-color-theme.json`.
- `"type": "dark" | "light"` — VS Code derives sensible defaults for unset keys from it.
  High contrast is *not* a `type` value; it's `uiTheme: "hc-black" | "hc-light"` in
  `package.json`. `hcDark`/`hcLight` are internal registry names, not authoring values.
- `"semanticHighlighting": true` — without it `semanticTokenColors` is ignored entirely.
- `contributes.themes[]` in `package.json`: one `{label, uiTheme, path}` per variant.
  `uiTheme` is `vs` (light), `vs-dark`, `hc-black`, `hc-light`.
- `"include": "./base.json"` lets one theme inherit another's keys — the idiomatic way to
  share a base across variants if you aren't generating them from a script.
- `tokenColors` may be a path to a `.tmTheme` file instead of an inline array.
- Users pair a light and a dark theme via `window.autoDetectColorScheme` +
  `workbench.preferredLight/DarkColorTheme`. The extension needs nothing special — but a
  family with no light variant can't be paired at all.

## Tier 1 — noticed in the first minute

Editor bg/fg, cursor, selection, line highlight, line numbers (plus
`editorLineNumber.activeForeground`), the four chrome surfaces (title bar, activity bar,
side bar, status bar), tabs (active/inactive/hover/border/`activeBorderTop`), panel,
terminal bg/fg + all 16 ANSI, find match (`editor.findMatchBackground` **and**
`findMatchHighlightBackground` — the second is the one that's usually unreadable),
`focusBorder`, `widget.border`, scrollbar slider (3 states), `editorWhitespace.foreground`,
`editorIndentGuide.background1`.

## Tier 2 — noticed in the first hour

- **Bracket pairs:** `editorBracketHighlight.foreground1`…`6` +
  `.unexpectedBracket.foreground`. Unset, VS Code picks its own colors and your theme
  suddenly has three hues it never chose.
- **Active indent guides:** `editorIndentGuide.activeBackground1`…`6`.
- **Diagnostics:** `editorError.foreground`, `editorWarning.foreground`,
  `editorInfo.foreground`, the `problems*Icon` trio, overview ruler equivalents.
- **Git:** `gitDecoration.*` (added, modified, deleted, untracked, ignored, conflicting,
  submodule, staged variants).
- **Diff:** inserted/removed text and line backgrounds, **plus** `insertedTextBorder` /
  `removedTextBorder` — the border is what makes a diff readable to a colorblind reader.
  `diffEditor.move.border` for moved blocks, `unchangedRegion*` for collapsed regions.
- **Merge:** `merge.current/incoming/commonHeaderBackground` + content backgrounds,
  `mergeEditor.conflict.*.border`.
- **Peek view:** `peekView.border`, `peekViewEditor.background`, `peekViewResult.*`,
  `peekViewTitle*`. A peek that inherits defaults looks like a different product.
- **Widgets:** `editorWidget`, `editorHoverWidget`, `editorSuggestWidget` (including
  `selectedBackground` and `highlightForeground`), `quickInput*`, `menu*`, `notifications*`.
- **Lists:** active/inactive selection, focus, hover, `list.highlightForeground`,
  `listFilterWidget.*`, `tree.indentGuidesStroke`.
- **Sticky scroll:** `editorStickyScroll.background` + `.border` + `.shadow`,
  `editorStickyScrollGutter.background`, `sideBarStickyScroll.background`.
- **Inlay hints:** `editorInlayHint.{background,foreground}` + `type*` and `parameter*`
  variants. Loud inlay hints are a top complaint on TypeScript-heavy codebases.
- **Ghost text:** `editorGhostText.foreground`. Keep it ≥3:1 or inline AI suggestions
  can't be reviewed.
- **Breadcrumbs:** `breadcrumb.foreground`, `.focusForeground`, `.activeSelectionForeground`.

## Tier 3 — the current layout (frequently missing entirely)

- **Command Center** (the title-bar pill, on by default): `commandCenter.background`,
  `.foreground`, `.border`, `.activeBackground`, `.activeForeground`, `.activeBorder`,
  `.inactiveForeground`, `.inactiveBorder`, `.debuggingBackground`.
- **Secondary side bar** (right-hand panel, where chat lives): `secondarySideBar.background`,
  `.foreground`, `.border`, plus `secondarySideBarTitle.foreground` and the section-header
  and sticky-scroll variants. Unset, it inherits sidebar defaults and looks misaligned.
- **Activity bar on top:** `activityBarTop.{background,foreground,inactiveForeground,
  activeBackground,activeBorder,dropBorder}`, `sideBarActivityBarTop.border`.
- **Chat:** `chat.requestBackground`, `.requestBorder`, `.requestBubbleBackground`,
  `.requestBubbleHoverBackground`, `.requestCodeBorder`, `.avatarBackground`,
  `.avatarForeground`, `.slashCommandBackground`, `.slashCommandForeground`,
  `.editedFileForeground`, `.linesAddedForeground`, `.linesRemovedForeground`,
  `.checkpointSeparator`, `.thinkingShimmer`, `chatManagement.sashBorder`.
- **Inline chat:** `inlineChat.{background,foreground,border,shadow}`,
  `inlineChatInput.{background,border,focusBorder,placeholderForeground}`,
  `inlineChatDiff.{inserted,removed}`.
- **Inline edits / next-edit suggestions:** `inlineEdit.originalBackground`,
  `.modifiedBackground`, the matching borders, `inlineEdit.gutterIndicator.primary*`.
- **Editor action list** (the quick-fix / refactor menu is its own widget now):
  `editorActionList.{background,foreground,focusBackground,focusForeground}`.
- **Multi-file diff** (where agent change-reviews render): `multiDiffEditor.background`,
  `.headerBackground`, `.border`.
- **Terminal command decorations** (the pass/fail dots in the gutter):
  `terminalCommandDecoration.{defaultBackground,successBackground,errorBackground}`,
  `terminalStickyScroll.*`, `terminalOverviewRuler.*`.
- **Comments/review:** `editorGutter.commentRangeForeground`, `.commentGlyphForeground`,
  `.commentUnresolvedGlyphForeground`, `editorCommentsWidget.*`, `commentsView.*`.
- **Test coverage:** `testing.covered*` / `.uncovered*` / `.coverCountBadge*`.
- **Debug inline values:** `editor.inlineValuesForeground`, `.inlineValuesBackground`.
- Cheap extras: `profileBadge.*`, `radio.*`, `notebook.*`, `charts.*`,
  `terminalSymbolIcon.*` (19 keys, safe to map wholesale).

## Token scopes worth covering beyond the basics

Doc comments and JSDoc tags; template-expression punctuation; escape characters; regex
operators vs regex body; decorators; enum members; type parameters; primitive vs user
types; CSS pseudo-classes; JSON/YAML keys including anchors; shell variables; markdown
(heading, bold, italic, link, quote, list marker, inline code, fence punctuation); diff
markup; `invalid.deprecated` (strikethrough); language-specific: Go error values and nil,
Python `self`, Rust lifetimes and macros, C preprocessor directives.

**Never color a blanket scope** like `source.go` or `source.ts` — it wins over everything
nested inside it and flattens the whole language to one color.

## Semantic tokens

Semantic highlighting overrides TextMate scopes where a language server provides it. Cover
at least: `class.declaration`, `interface`, `enumMember`, `typeParameter`,
`type.defaultLibrary`, `function.declaration`, `function.defaultLibrary`, `method`,
`macro`, `decorator`, `variable.readonly`, `variable.defaultLibrary`, `parameter`,
`property`, `selfParameter`, `event`, and the modifiers `*.deprecated` (strikethrough) and
`*.abstract` (italic).

## Verification

Open, in the theme, before shipping: a diff with adds and deletes, a merge conflict, peek
definition, the command palette, the terminal running something that fails, a JSON file, a
Markdown file, a deeply nested object (bracket colors), and a file with type errors.
