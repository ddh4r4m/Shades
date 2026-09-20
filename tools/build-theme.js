// Turns a palette (a set of named roles) into a complete VS Code color theme.
// Every theme in this extension goes through here, so a fix to one workbench key
// lands in all of them and the whole family stays structurally identical.

const { mix, lighten, darken, contrast, alpha, setLightness, toOklch, hueDistance } = require('./color');

// Roles that carry code. These get pinned to one perceptual lightness so a line
// of code reads as a single band of text instead of flickering bright to dim.
const SYNTAX_ROLES = [
  'keyword', 'controlKeyword', 'string', 'func', 'type', 'constant', 'number',
  'property', 'operator', 'tag', 'parameter', 'variable', 'builtin', 'decorator',
  'regexp', 'escape', 'primitiveType', 'languageVariable', 'attribute', 'punctuation',
];

// Re-pitch every syntax hue to palette.uniformL, preserving hue and as much
// chroma as sRGB allows. Diagnostics and neutrals are left alone: an error red
// is allowed to be louder than the code around it.
function harmonize(palette) {
  if (!palette.uniformL) return palette;
  const out = { ...palette };
  for (const role of SYNTAX_ROLES) {
    // A role set to the plain foreground is deliberately plain text; re-pitching
    // it would make identifiers brighter or dimmer than the prose around them.
    if (out[role] && out[role] !== palette.fg) out[role] = setLightness(out[role], palette.uniformL);
  }
  return out;
}

// Roles every palette must define. Anything missing fails the build loudly
// rather than silently inheriting VS Code's defaults.
const REQUIRED_ROLES = [
  'bg', 'bgDim', 'bgElevated', 'bgOverlay', 'border',
  'fg', 'fgMuted', 'fgSubtle',
  'accent', 'accent2',
  'keyword', 'string', 'func', 'type', 'constant', 'variable', 'property', 'operator', 'tag', 'comment', 'parameter',
  'error', 'warning', 'info', 'success',
];

function buildTheme(rawPalette) {
  const missing = REQUIRED_ROLES.filter((role) => !rawPalette[role]);
  if (missing.length) throw new Error(`${rawPalette.id}: palette is missing roles: ${missing.join(', ')}`);

  const palette = harmonize(rawPalette);
  const dark = palette.appearance === 'dark';
  const p = palette;

  // Depth: on dark themes surfaces get lighter as they come forward, on light
  // themes they get darker. One helper keeps both directions honest.
  const raise = (hex, amount) => (dark ? lighten(hex, amount) : darken(hex, amount));
  const sink = (hex, amount) => (dark ? darken(hex, amount) : lighten(hex, amount));

  const added = p.added || p.success;
  const modified = p.modified || p.info;
  const deleted = p.deleted || p.error;
  const cursor = p.cursor || p.accent2;
  const selection = p.selection || alpha(p.accent, dark ? 0.3 : 0.22);
  const lineHighlight = p.lineHighlight || alpha(raise(p.bg, 0.5), dark ? 0.07 : 0.05);
  const shadow = alpha('#000000', dark ? 0.4 : 0.14);

  // Six bracket hues, spread across the palette so nesting depth reads at a glance.
  const brackets = p.brackets || [p.accent, p.keyword, p.type, p.func, p.string, p.constant];

  // ANSI: the syntax hues carry over so the terminal feels like the editor.
  const ansi = {
    red: p.error,
    green: p.success,
    yellow: p.warning,
    blue: p.func,
    magenta: p.keyword,
    cyan: p.operator,
    white: p.fgMuted,
    ...p.ansi,
  };
  const ansiBlack = p.ansiBlack || (dark ? raise(p.bg, 0.12) : darken(p.fg, 0.3));
  const ansiBrightBlack = dark ? p.fgSubtle : p.fg;
  const ansiBrightWhite = dark ? lighten(p.fg, 0.35) : p.fgSubtle;
  const bright = (hex) => (dark ? lighten(hex, 0.22) : darken(hex, 0.12));

  const italic = p.italics === false ? '' : 'italic';
  const boldItalic = p.italics === false ? 'bold' : 'bold italic';

  const colors = {
    // --- Base surfaces -----------------------------------------------------
    'editor.background': p.bg,
    'editor.foreground': p.fg,
    'foreground': p.fg,
    'descriptionForeground': p.fgMuted,
    'errorForeground': p.error,
    'focusBorder': alpha(p.accent, 0.6),
    'widget.border': p.border,
    'widget.shadow': shadow,
    'selection.background': selection,
    'icon.foreground': p.fgMuted,
    'sash.hoverBorder': p.accent,
    'window.activeBorder': p.border,
    'window.inactiveBorder': p.border,
    'disabledForeground': p.fgSubtle,

    // --- Title bar ---------------------------------------------------------
    'titleBar.activeBackground': p.bgDim,
    'titleBar.activeForeground': p.fg,
    'titleBar.inactiveBackground': p.bgDim,
    'titleBar.inactiveForeground': p.fgSubtle,
    'titleBar.border': p.border,

    // --- Command Center ----------------------------------------------------
    // The search pill in the middle of the title bar. It is on by default in the
    // current layout, so leaving it unstyled puts a pale capsule on every window.
    'commandCenter.background': p.bgElevated,
    'commandCenter.foreground': p.fgMuted,
    'commandCenter.border': p.border,
    'commandCenter.activeBackground': p.bgOverlay,
    'commandCenter.activeForeground': p.fg,
    'commandCenter.activeBorder': alpha(p.accent, 0.6),
    'commandCenter.inactiveForeground': p.fgSubtle,
    'commandCenter.inactiveBorder': alpha(p.border, 0.6),
    'commandCenter.debuggingBackground': alpha(p.warning, 0.2),

    // --- Activity bar ------------------------------------------------------
    'activityBar.background': p.bgDim,
    'activityBar.foreground': p.accent,
    'activityBar.inactiveForeground': p.fgSubtle,
    'activityBar.border': p.border,
    'activityBar.activeBorder': p.accent,
    'activityBar.activeBackground': alpha(p.accent, 0.1),
    'activityBarBadge.background': p.accent,
    'activityErrorBadge.background': p.error,
    'activityErrorBadge.foreground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'activityWarningBadge.background': p.warning,
    'activityWarningBadge.foreground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'activityBarBadge.foreground': p.badgeFg || (dark ? darken(p.bg, 0.3) : '#ffffff'),
    // Horizontal activity bar, for layouts that move it above the views.
    'activityBarTop.background': p.bgDim,
    'activityBarTop.foreground': p.accent,
    'activityBarTop.inactiveForeground': p.fgSubtle,
    'activityBarTop.activeBackground': alpha(p.accent, 0.1),
    'activityBarTop.activeBorder': p.accent,
    'activityBarTop.dropBorder': p.accent,
    'profileBadge.background': alpha(p.accent, 0.24),
    'profileBadge.foreground': p.fg,

    // --- Side bar ----------------------------------------------------------
    'sideBar.background': p.bgElevated,
    'sideBar.foreground': p.fgMuted,
    'sideBar.border': p.border,
    'sideBarTitle.foreground': p.fg,
    'sideBarSectionHeader.background': p.bgElevated,
    'sideBarSectionHeader.foreground': p.fg,
    'sideBarSectionHeader.border': p.border,
    'sideBarStickyScroll.background': p.bgElevated,
    'sideBarActivityBarTop.border': p.border,
    'sideBarStickyScroll.border': p.border,
    'sideBarStickyScroll.shadow': shadow,

    // --- Lists and trees ---------------------------------------------------
    'list.activeSelectionBackground': alpha(p.accent, 0.18),
    'list.activeSelectionForeground': p.fg,
    'list.activeSelectionIconForeground': p.accent,
    'list.inactiveSelectionBackground': alpha(p.accent, 0.1),
    'list.inactiveSelectionForeground': p.fg,
    'list.hoverBackground': alpha(raise(p.bgElevated, 0.4), 0.12),
    'list.hoverForeground': p.fg,
    'list.focusBackground': alpha(p.accent, 0.2),
    'list.focusForeground': p.fg,
    'list.focusOutline': alpha(p.accent, 0.5),
    'list.highlightForeground': p.accent2,
    'list.focusHighlightForeground': p.accent2,
    'list.errorForeground': p.error,
    'list.warningForeground': p.warning,
    'list.dropBackground': alpha(p.accent, 0.16),
    'listFilterWidget.background': p.bgOverlay,
    'listFilterWidget.outline': p.accent,
    'listFilterWidget.noMatchesOutline': p.error,
    'list.filterMatchBackground': alpha(p.accent2, 0.24),
    'list.filterMatchBorder': alpha(p.accent2, 0.5),
    'tree.indentGuidesStroke': alpha(p.fgSubtle, 0.5),
    'tree.inactiveIndentGuidesStroke': alpha(p.fgSubtle, 0.25),
    'tree.tableColumnsBorder': p.border,

    // --- Editor groups and tabs -------------------------------------------
    'editorGroup.border': p.border,
    'editorGroupHeader.tabsBackground': p.bgDim,
    'editorGroupHeader.tabsBorder': p.border,
    'editorGroupHeader.noTabsBackground': p.bgDim,
    'editorGroup.dropBackground': alpha(p.accent, 0.16),
    'tab.activeBackground': p.bg,
    'tab.activeForeground': p.fg,
    'tab.activeBorderTop': p.accent,
    'tab.activeBorder': p.bg,
    'tab.inactiveBackground': p.bgDim,
    'tab.inactiveForeground': p.fgSubtle,
    'tab.hoverBackground': p.bg,
    'tab.hoverForeground': p.fg,
    'tab.border': p.border,
    'tab.unfocusedActiveBorderTop': alpha(p.accent, 0.4),
    'tab.lastPinnedBorder': p.border,
    'tab.activeModifiedBorder': modified,
    'tab.inactiveModifiedBorder': alpha(modified, 0.5),
    'tab.selectedBackground': p.bg,
    'tab.selectedForeground': p.fg,
    'tab.selectedBorderTop': alpha(p.accent, 0.7),
    'tab.unfocusedActiveBackground': p.bg,
    'tab.unfocusedActiveForeground': p.fgMuted,
    'tab.unfocusedActiveBorder': '#00000000',
    'tab.unfocusedInactiveBackground': p.bgDim,
    'tab.unfocusedInactiveForeground': p.fgSubtle,
    'tab.unfocusedHoverBackground': p.bg,
    'tab.unfocusedHoverForeground': p.fgMuted,
    'tab.unfocusedActiveModifiedBorder': alpha(modified, 0.6),
    'tab.unfocusedInactiveModifiedBorder': alpha(modified, 0.35),
    'editorPane.background': p.bg,

    // --- Editor surface ----------------------------------------------------
    'editor.lineHighlightBackground': lineHighlight,
    'editor.lineHighlightBorder': '#00000000',
    'editorCursor.foreground': cursor,
    'editorCursor.background': p.bg,
    'editor.selectionBackground': selection,
    'editor.selectionHighlightBackground': alpha(p.accent, 0.16),
    'editor.selectionHighlightBorder': '#00000000',
    'editor.inactiveSelectionBackground': alpha(p.accent, 0.14),
    'editor.wordHighlightBackground': alpha(p.accent2, 0.16),
    'editor.wordHighlightStrongBackground': alpha(p.success, 0.18),
    'editor.wordHighlightTextBackground': alpha(p.accent2, 0.16),
    'editor.rangeHighlightBackground': alpha(p.accent, 0.1),
    'editor.symbolHighlightBackground': alpha(p.accent2, 0.18),
    'editor.foldBackground': alpha(p.accent, 0.08),
    'editor.foldPlaceholderForeground': p.fgSubtle,
    'editor.inactiveLineHighlightBackground': alpha(p.fgSubtle, 0.05),
    'editor.linkedEditingBackground': alpha(p.accent2, 0.14),
    'editor.hoverHighlightBackground': alpha(p.accent, 0.14),
    'editorLineNumber.foreground': p.fgSubtle,
    'editorLineNumber.activeForeground': p.accent,
    'editorLineNumber.dimmedForeground': alpha(p.fgSubtle, 0.5),
    'editorWhitespace.foreground': alpha(p.fgSubtle, 0.35),
    'editorIndentGuide.background1': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.background2': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.background3': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.background4': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.background5': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.background6': alpha(p.fgSubtle, 0.18),
    'editorIndentGuide.activeBackground1': alpha(brackets[0], 0.55),
    'editorIndentGuide.activeBackground2': alpha(brackets[1], 0.55),
    'editorIndentGuide.activeBackground3': alpha(brackets[2], 0.55),
    'editorIndentGuide.activeBackground4': alpha(brackets[3], 0.55),
    'editorIndentGuide.activeBackground5': alpha(brackets[4], 0.55),
    'editorIndentGuide.activeBackground6': alpha(brackets[5], 0.55),
    'editorBracketPairGuide.background1': alpha(brackets[0], 0.3),
    'editorBracketPairGuide.background2': alpha(brackets[1], 0.3),
    'editorBracketPairGuide.background3': alpha(brackets[2], 0.3),
    'editorBracketPairGuide.background4': alpha(brackets[3], 0.3),
    'editorBracketPairGuide.background5': alpha(brackets[4], 0.3),
    'editorBracketPairGuide.background6': alpha(brackets[5], 0.3),
    'editorBracketPairGuide.activeBackground1': alpha(brackets[0], 0.7),
    'editorBracketPairGuide.activeBackground2': alpha(brackets[1], 0.7),
    'editorBracketPairGuide.activeBackground3': alpha(brackets[2], 0.7),
    'editorBracketPairGuide.activeBackground4': alpha(brackets[3], 0.7),
    'editorBracketPairGuide.activeBackground5': alpha(brackets[4], 0.7),
    'editorBracketPairGuide.activeBackground6': alpha(brackets[5], 0.7),
    'editorRuler.foreground': alpha(p.fgSubtle, 0.25),
    'editorCodeLens.foreground': p.fgSubtle,
    'editorBracketMatch.background': alpha(p.accent, 0.16),
    'editorBracketMatch.border': alpha(p.accent, 0.6),
    'editorLink.activeForeground': p.accent,
    'editorLightBulb.foreground': p.warning,
    'editorLightBulbAutoFix.foreground': p.success,
    'editorUnnecessaryCode.opacity': '#0000007f',
    'editorStickyScroll.background': p.bgDim,
    'editorStickyScroll.border': p.border,
    'editorStickyScroll.shadow': shadow,
    'editorStickyScrollGutter.background': p.bgDim,
    'editorStickyScrollHover.background': p.bgElevated,

    // Bracket pair colorization — depth 1..6.
    'editorBracketHighlight.foreground1': brackets[0],
    'editorBracketHighlight.foreground2': brackets[1],
    'editorBracketHighlight.foreground3': brackets[2],
    'editorBracketHighlight.foreground4': brackets[3],
    'editorBracketHighlight.foreground5': brackets[4],
    'editorBracketHighlight.foreground6': brackets[5],
    'editorBracketHighlight.unexpectedBracket.foreground': p.error,

    // --- Diagnostics -------------------------------------------------------
    'editorError.foreground': p.error,
    'editorWarning.foreground': p.warning,
    'editorInfo.foreground': p.info,
    'editorHint.foreground': p.accent2,
    'editorGutter.background': p.bg,
    'editorGutter.modifiedBackground': modified,
    'editorGutter.addedBackground': added,
    'editorGutter.deletedBackground': deleted,
    'editorGutter.foldingControlForeground': p.fgMuted,
    'editorOverviewRuler.border': '#00000000',
    'editorOverviewRuler.findMatchForeground': alpha(p.accent2, 0.6),
    'editorOverviewRuler.errorForeground': p.error,
    'editorOverviewRuler.warningForeground': p.warning,
    'editorOverviewRuler.infoForeground': p.info,
    'editorOverviewRuler.addedForeground': alpha(added, 0.8),
    'editorOverviewRuler.modifiedForeground': alpha(modified, 0.8),
    'editorOverviewRuler.deletedForeground': alpha(deleted, 0.8),
    'editorOverviewRuler.selectionHighlightForeground': alpha(p.accent, 0.5),
    'editorOverviewRuler.wordHighlightForeground': alpha(p.accent2, 0.5),
    'editorOverviewRuler.bracketMatchForeground': alpha(p.accent, 0.5),
    'problemsErrorIcon.foreground': p.error,
    'problemsWarningIcon.foreground': p.warning,
    'problemsInfoIcon.foreground': p.info,

    // --- Find / search -----------------------------------------------------
    'editor.findMatchBackground': alpha(p.accent2, 0.36),
    'editor.findMatchBorder': p.accent2,
    'editor.findMatchForeground': p.fg,
    'editor.findMatchHighlightForeground': p.fg,
    'editor.findMatchHighlightBackground': alpha(p.accent, 0.24),
    'editor.findMatchHighlightBorder': alpha(p.accent, 0.5),
    'editor.findRangeHighlightBackground': alpha(p.accent, 0.12),
    'searchEditor.findMatchBackground': alpha(p.accent2, 0.3),
    'search.resultsInfoForeground': p.fgMuted,
    'minimap.findMatchHighlight': p.accent2,
    'minimap.selectionHighlight': alpha(p.accent, 0.7),
    'minimap.errorHighlight': p.error,
    'minimap.warningHighlight': p.warning,
    'minimap.background': alpha(p.bg, 0.8),
    'minimapGutter.addedBackground': added,
    'minimapGutter.modifiedBackground': modified,
    'minimapGutter.deletedBackground': deleted,
    'minimapSlider.background': alpha(p.fgSubtle, 0.16),
    'minimapSlider.hoverBackground': alpha(p.fgSubtle, 0.24),
    'minimapSlider.activeBackground': alpha(p.fgSubtle, 0.32),

    // --- Inlay hints, suggestions, hovers ----------------------------------
    'editorInlayHint.background': alpha(p.accent, 0.1),
    'editorInlayHint.foreground': p.fgSubtle,
    'editorInlayHint.typeBackground': alpha(p.type, 0.1),
    'editorInlayHint.typeForeground': alpha(p.type, 0.8),
    'editorInlayHint.parameterBackground': alpha(p.parameter, 0.1),
    'editorInlayHint.parameterForeground': alpha(p.parameter, 0.8),
    // Inline AI suggestions: quiet enough to read as "not yours yet", solid
    // enough to actually read. Fading this below 3:1 makes it unreviewable.
    'editorGhostText.foreground': p.fgSubtle,
    'editorWidget.background': p.bgOverlay,
    'editorWidget.foreground': p.fg,
    'editorWidget.border': p.border,
    'editorHoverWidget.background': p.bgOverlay,
    'editorHoverWidget.foreground': p.fg,
    'editorHoverWidget.border': p.border,
    'editorSuggestWidget.background': p.bgOverlay,
    'editorSuggestWidget.foreground': p.fg,
    'editorSuggestWidget.border': p.border,
    'editorSuggestWidget.selectedBackground': alpha(p.accent, 0.2),
    'editorSuggestWidget.selectedForeground': p.fg,
    'editorSuggestWidget.highlightForeground': p.accent2,
    'editorSuggestWidget.focusHighlightForeground': p.accent2,
    'editorSuggestWidgetStatus.foreground': p.fgSubtle,

    // --- Peek view ---------------------------------------------------------
    'peekView.border': p.accent,
    'peekViewEditor.background': dark ? sink(p.bg, 0.2) : p.bgDim,
    'peekViewEditor.matchHighlightBackground': alpha(p.accent2, 0.3),
    'peekViewEditor.matchHighlightBorder': alpha(p.accent2, 0.6),
    'peekViewEditorGutter.background': dark ? sink(p.bg, 0.2) : p.bgDim,
    'peekViewResult.background': p.bgOverlay,
    'peekViewResult.fileForeground': p.fg,
    'peekViewResult.lineForeground': p.fgMuted,
    'peekViewResult.matchHighlightBackground': alpha(p.accent2, 0.3),
    'peekViewResult.selectionBackground': alpha(p.accent, 0.2),
    'peekViewResult.selectionForeground': p.fg,
    'peekViewTitle.background': p.bgOverlay,
    'peekViewTitleLabel.foreground': p.fg,
    'peekViewTitleDescription.foreground': p.fgMuted,

    // --- Diff and merge ----------------------------------------------------
    'diffEditor.insertedTextBackground': alpha(added, 0.14),
    'diffEditor.insertedLineBackground': alpha(added, 0.1),
    'diffEditor.removedTextBackground': alpha(deleted, 0.16),
    'diffEditor.removedLineBackground': alpha(deleted, 0.1),
    // Diff carries a border as well as a fill: red/green alone is invisible to
    // roughly one in twelve men.
    'diffEditor.insertedTextBorder': alpha(added, 0.35),
    'diffEditor.removedTextBorder': alpha(deleted, 0.35),
    'diffEditor.move.border': alpha(p.accent2, 0.5),
    'diffEditor.moveActive.border': p.accent2,
    'diffEditor.unchangedRegionBackground': p.bgDim,
    'diffEditor.unchangedRegionForeground': p.fgMuted,
    'diffEditor.unchangedCodeBackground': alpha(p.fgSubtle, 0.06),
    'diffEditor.unchangedRegionShadow': shadow,
    'diffEditor.diagonalFill': alpha(p.fgSubtle, 0.25),
    'diffEditor.border': p.border,
    'diffEditorGutter.insertedLineBackground': alpha(added, 0.16),
    'diffEditorGutter.removedLineBackground': alpha(deleted, 0.16),
    'diffEditorOverview.insertedForeground': alpha(added, 0.6),
    'diffEditorOverview.removedForeground': alpha(deleted, 0.6),
    'merge.currentHeaderBackground': alpha(p.accent2, 0.3),
    'merge.currentContentBackground': alpha(p.accent2, 0.14),
    'merge.incomingHeaderBackground': alpha(p.info, 0.3),
    'merge.incomingContentBackground': alpha(p.info, 0.14),
    'merge.commonHeaderBackground': alpha(p.fgSubtle, 0.3),
    'merge.commonContentBackground': alpha(p.fgSubtle, 0.12),
    'merge.border': '#00000000',
    'mergeEditor.change.background': alpha(added, 0.14),
    'mergeEditor.change.word.background': alpha(added, 0.24),
    'mergeEditor.conflict.unhandledUnfocused.border': alpha(p.warning, 0.6),
    'mergeEditor.conflict.unhandledFocused.border': p.warning,
    'mergeEditor.conflict.handledUnfocused.border': alpha(p.success, 0.4),
    'mergeEditor.conflict.handledFocused.border': alpha(p.success, 0.7),

    // --- Git decorations ---------------------------------------------------
    'gitDecoration.addedResourceForeground': added,
    'gitDecoration.untrackedResourceForeground': added,
    'gitDecoration.modifiedResourceForeground': modified,
    'gitDecoration.deletedResourceForeground': deleted,
    'gitDecoration.renamedResourceForeground': p.info,
    'gitDecoration.stageModifiedResourceForeground': modified,
    'gitDecoration.stageDeletedResourceForeground': deleted,
    'gitDecoration.ignoredResourceForeground': p.fgSubtle,
    'gitDecoration.conflictingResourceForeground': p.warning,
    'gitDecoration.submoduleResourceForeground': p.accent2,

    // --- Status bar --------------------------------------------------------
    'statusBar.background': p.bgDim,
    'statusBar.foreground': p.fgMuted,
    'statusBar.border': p.border,
    'statusBar.noFolderBackground': p.bgDim,
    'statusBar.noFolderForeground': p.fgMuted,
    'statusBar.debuggingBackground': p.warning,
    'statusBar.debuggingForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'statusBar.debuggingBorder': '#00000000',
    'statusBarItem.hoverBackground': alpha(p.fgSubtle, 0.16),
    'statusBarItem.activeBackground': alpha(p.fgSubtle, 0.24),
    'statusBarItem.prominentBackground': alpha(p.accent, 0.24),
    'statusBarItem.prominentForeground': p.fg,
    'statusBarItem.prominentHoverBackground': alpha(p.accent, 0.35),
    'statusBarItem.remoteBackground': p.accent,
    'statusBarItem.remoteForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'statusBarItem.errorBackground': p.error,
    'statusBarItem.errorForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'statusBarItem.warningBackground': p.warning,
    'statusBarItem.warningForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'statusBarItem.hoverForeground': p.fg,
    'statusBarItem.prominentHoverForeground': p.fg,
    'statusBarItem.errorHoverBackground': alpha(p.error, 0.3),
    'statusBarItem.errorHoverForeground': p.fg,
    'statusBarItem.warningHoverBackground': alpha(p.warning, 0.3),
    'statusBarItem.warningHoverForeground': p.fg,
    'statusBarItem.remoteHoverBackground': alpha(p.accent, 0.3),
    'statusBarItem.remoteHoverForeground': p.fg,
    'statusBarItem.offlineBackground': p.error,
    'statusBarItem.offlineForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'statusBarItem.offlineHoverBackground': alpha(p.error, 0.3),
    'statusBarItem.offlineHoverForeground': p.fg,
    'statusBarItem.focusBorder': p.accent,
    'statusBarItem.compactHoverBackground': alpha(p.fgSubtle, 0.24),

    // --- Panel and terminal ------------------------------------------------
    'panel.background': p.bgDim,
    'panel.border': p.border,
    'panelTitle.activeBorder': p.accent,
    'panelTitle.activeForeground': p.fg,
    'panelTitle.inactiveForeground': p.fgSubtle,
    'panelSection.border': p.border,
    'panelSectionHeader.background': p.bgElevated,
    'panelSectionHeader.foreground': p.fg,
    'panelTitle.border': p.border,
    'panelTitleBadge.background': alpha(p.accent, 0.24),
    'panelTitleBadge.foreground': p.fg,
    'panelStickyScroll.background': p.bgDim,
    'panelStickyScroll.border': p.border,
    'panelStickyScroll.shadow': shadow,
    'outputView.background': p.bgDim,
    'panelInput.border': p.border,
    'terminal.background': p.bgDim,
    'terminal.foreground': p.fg,
    'terminal.border': p.border,
    'terminalCursor.foreground': cursor,
    'terminalCursor.background': p.bgDim,
    'terminal.selectionBackground': selection,
    'terminal.selectionForeground': p.fg,
    'terminal.findMatchBorder': p.accent2,
    'terminal.findMatchHighlightBorder': alpha(p.accent, 0.5),
    'terminal.tab.activeBorder': p.accent,
    'terminal.inactiveSelectionBackground': alpha(p.accent, 0.14),
    'terminal.findMatchBackground': alpha(p.accent2, 0.36),
    'terminal.findMatchHighlightBackground': alpha(p.accent, 0.22),
    'terminal.ansiBlack': ansiBlack,
    'terminal.ansiRed': ansi.red,
    'terminal.ansiGreen': ansi.green,
    'terminal.ansiYellow': ansi.yellow,
    'terminal.ansiBlue': ansi.blue,
    'terminal.ansiMagenta': ansi.magenta,
    'terminal.ansiCyan': ansi.cyan,
    'terminal.ansiWhite': ansi.white,
    'terminal.ansiBrightBlack': ansiBrightBlack,
    'terminal.ansiBrightRed': bright(ansi.red),
    'terminal.ansiBrightGreen': bright(ansi.green),
    'terminal.ansiBrightYellow': bright(ansi.yellow),
    'terminal.ansiBrightBlue': bright(ansi.blue),
    'terminal.ansiBrightMagenta': bright(ansi.magenta),
    'terminal.ansiBrightCyan': bright(ansi.cyan),
    'terminal.ansiBrightWhite': ansiBrightWhite,
    'terminalStickyScroll.background': p.bgElevated,
    'terminalStickyScroll.border': p.border,
    'terminalStickyScrollHover.background': p.bgOverlay,
    // The gutter dots beside each command: the fastest read on whether the last
    // thing you ran actually worked.
    'terminalCommandDecoration.defaultBackground': p.fgSubtle,
    'terminalCommandDecoration.successBackground': p.success,
    'terminalCommandDecoration.errorBackground': p.error,
    'terminalCommandGuide.foreground': alpha(p.fgSubtle, 0.4),
    'terminalOverviewRuler.cursorForeground': cursor,
    'terminalOverviewRuler.findMatchForeground': p.accent2,
    'terminalOverviewRuler.border': p.border,

    // --- Debug -------------------------------------------------------------
    'debugToolBar.background': p.bgOverlay,
    'debugToolBar.border': p.border,
    'debugIcon.breakpointForeground': p.error,
    'debugIcon.breakpointDisabledForeground': alpha(p.error, 0.5),
    'debugIcon.breakpointCurrentStackframeForeground': p.warning,
    'debugIcon.breakpointStackframeForeground': p.fgMuted,
    'debugIcon.startForeground': p.success,
    'debugIcon.pauseForeground': p.warning,
    'debugIcon.stopForeground': p.error,
    'debugIcon.restartForeground': p.success,
    'debugIcon.continueForeground': p.success,
    'debugIcon.stepOverForeground': p.accent,
    'debugIcon.stepIntoForeground': p.accent,
    'debugIcon.stepOutForeground': p.accent,
    'debugIcon.stepBackForeground': p.accent,
    'editor.stackFrameHighlightBackground': alpha(p.warning, 0.16),
    'editor.focusedStackFrameHighlightBackground': alpha(p.success, 0.18),
    'debugTokenExpression.name': p.property,
    'debugTokenExpression.value': p.fgMuted,
    'debugTokenExpression.string': p.string,
    'debugTokenExpression.boolean': p.constant,
    'debugTokenExpression.number': p.constant,
    'debugTokenExpression.error': p.error,
    'debugTokenExpression.type': p.type,
    'debugConsole.infoForeground': p.info,
    'debugConsole.warningForeground': p.warning,
    'debugConsole.errorForeground': p.error,
    'debugConsole.sourceForeground': p.fgMuted,
    'debugConsoleInputIcon.foreground': p.accent,
    'debugExceptionWidget.background': alpha(p.error, 0.2),
    'debugExceptionWidget.border': p.error,

    // --- Inputs, dropdowns, buttons ---------------------------------------
    'input.background': dark ? sink(p.bgElevated, 0.25) : p.bgOverlay,
    'input.foreground': p.fg,
    'input.border': p.border,
    'input.placeholderForeground': p.fgSubtle,
    'inputOption.activeBackground': alpha(p.accent, 0.24),
    'inputOption.activeForeground': p.fg,
    'inputOption.activeBorder': alpha(p.accent, 0.6),
    'inputValidation.errorBackground': mix(p.bgOverlay, p.error, 0.25),
    'inputValidation.errorBorder': p.error,
    'inputValidation.errorForeground': p.fg,
    'inputValidation.warningBackground': mix(p.bgOverlay, p.warning, 0.25),
    'inputValidation.warningBorder': p.warning,
    'inputValidation.warningForeground': p.fg,
    'inputValidation.infoBackground': mix(p.bgOverlay, p.info, 0.25),
    'inputValidation.infoBorder': p.info,
    'inputValidation.infoForeground': p.fg,
    'dropdown.background': p.bgOverlay,
    'dropdown.listBackground': p.bgOverlay,
    'dropdown.foreground': p.fg,
    'dropdown.border': p.border,
    'button.background': p.accent,
    'button.foreground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'button.hoverBackground': raise(p.accent, 0.12),
    'button.secondaryBackground': p.bgOverlay,
    'button.secondaryForeground': p.fg,
    'button.secondaryHoverBackground': raise(p.bgOverlay, 0.08),
    'button.border': '#00000000',
    'checkbox.background': p.bgOverlay,
    'checkbox.foreground': p.fg,
    'checkbox.border': p.border,
    'badge.background': alpha(p.accent, 0.24),
    'badge.foreground': p.fg,
    'progressBar.background': p.accent,
    'scrollbar.shadow': shadow,
    'scrollbarSlider.background': alpha(p.fgSubtle, 0.25),
    'scrollbarSlider.hoverBackground': alpha(p.fgSubtle, 0.4),
    'scrollbarSlider.activeBackground': alpha(p.fgSubtle, 0.55),
    'textLink.foreground': p.accent,
    'textLink.activeForeground': p.accent2,
    'textPreformat.foreground': p.string,
    'textBlockQuote.background': p.bgElevated,
    'textBlockQuote.border': p.accent,
    'textCodeBlock.background': p.bgElevated,
    'textSeparator.foreground': p.border,

    // --- Command palette, notifications, menus -----------------------------
    'quickInput.background': p.bgOverlay,
    'quickInput.foreground': p.fg,
    'quickInputTitle.background': p.bgOverlay,
    'quickInputList.focusBackground': alpha(p.accent, 0.2),
    'quickInputList.focusForeground': p.fg,
    'quickInputList.focusIconForeground': p.accent,
    'pickerGroup.border': p.border,
    'pickerGroup.foreground': p.accent2,
    'keybindingLabel.background': alpha(p.fgSubtle, 0.16),
    'keybindingLabel.foreground': p.fg,
    'keybindingLabel.border': p.border,
    'keybindingLabel.bottomBorder': p.border,
    'notifications.background': p.bgOverlay,
    'notifications.foreground': p.fg,
    'notifications.border': p.border,
    'notificationLink.foreground': p.accent,
    'notificationCenterHeader.background': p.bgElevated,
    'notificationCenterHeader.foreground': p.fg,
    'notificationsErrorIcon.foreground': p.error,
    'notificationsWarningIcon.foreground': p.warning,
    'notificationsInfoIcon.foreground': p.info,
    'menu.background': p.bgOverlay,
    'menu.foreground': p.fg,
    'menu.border': p.border,
    'menu.selectionBackground': alpha(p.accent, 0.24),
    'menu.selectionForeground': p.fg,
    'menu.separatorBackground': p.border,
    'menubar.selectionBackground': alpha(p.accent, 0.2),
    'menubar.selectionForeground': p.fg,
    'toolbar.hoverBackground': alpha(p.fgSubtle, 0.16),
    'toolbar.activeBackground': alpha(p.fgSubtle, 0.24),
    'breadcrumb.background': p.bg,
    'breadcrumb.foreground': p.fgSubtle,
    'breadcrumb.focusForeground': p.fg,
    'breadcrumb.activeSelectionForeground': p.accent,
    'breadcrumbPicker.background': p.bgOverlay,
    'banner.background': p.bgElevated,
    'banner.foreground': p.fg,
    'banner.iconForeground': p.accent,

    // --- Editor extras -----------------------------------------------------
    'welcomePage.background': p.bg,
    'welcomePage.progress.background': alpha(p.fgSubtle, 0.25),
    'welcomePage.progress.foreground': p.accent,
    'welcomePage.tileBackground': p.bgElevated,
    'welcomePage.tileHoverBackground': p.bgOverlay,
    'walkThrough.embeddedEditorBackground': p.bgDim,
    'extensionButton.prominentBackground': p.accent,
    'extensionButton.prominentForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'extensionButton.prominentHoverBackground': raise(p.accent, 0.12),
    'extensionBadge.remoteBackground': p.accent,
    'extensionBadge.remoteForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'extensionIcon.starForeground': p.warning,
    'extensionIcon.verifiedForeground': p.success,
    'extensionIcon.preReleaseForeground': p.accent2,
    'settings.headerForeground': p.fg,
    'settings.modifiedItemIndicator': p.accent,
    'settings.dropdownBackground': p.bgOverlay,
    'settings.dropdownBorder': p.border,
    'settings.checkboxBackground': p.bgOverlay,
    'settings.checkboxBorder': p.border,
    'settings.textInputForeground': p.fg,
    'settings.numberInputForeground': p.fg,
    'settings.dropdownForeground': p.fg,
    'settings.checkboxForeground': p.fg,
    'settings.textInputBackground': p.bgOverlay,
    'settings.textInputBorder': p.border,
    'settings.numberInputBackground': p.bgOverlay,
    'settings.numberInputBorder': p.border,
    'settings.focusedRowBackground': alpha(p.accent, 0.08),
    'settings.rowHoverBackground': alpha(p.fgSubtle, 0.08),
    'settings.focusedRowBorder': alpha(p.accent, 0.4),

    // --- Notebooks and charts ---------------------------------------------
    'notebook.editorBackground': p.bg,
    'notebook.cellEditorBackground': p.bgDim,
    'notebook.cellBorderColor': p.border,
    'notebook.focusedCellBorder': p.accent,
    'notebook.cellHoverBackground': alpha(p.bgElevated, 0.5),
    'notebook.selectedCellBackground': alpha(p.accent, 0.08),
    'notebook.inactiveFocusedCellBorder': p.border,
    'notebook.inactiveSelectedCellBorder': alpha(p.accent, 0.4),
    'notebook.focusedCellBackground': alpha(p.accent, 0.06),
    'notebook.selectedCellBorder': alpha(p.accent, 0.6),
    'notebook.cellInsertionIndicator': p.accent,
    'notebook.outputContainerBackgroundColor': p.bgDim,
    'notebook.outputContainerBorderColor': p.border,
    'notebook.cellToolbarSeparator': p.border,
    'notebookScrollbarSlider.background': alpha(p.fgSubtle, 0.25),
    'notebookScrollbarSlider.hoverBackground': alpha(p.fgSubtle, 0.4),
    'notebookScrollbarSlider.activeBackground': alpha(p.fgSubtle, 0.55),
    'notebookStatusSuccessIcon.foreground': p.success,
    'notebookStatusErrorIcon.foreground': p.error,
    'notebookStatusRunningIcon.foreground': p.accent,
    'charts.foreground': p.fg,
    'charts.lines': alpha(p.fgSubtle, 0.5),
    'charts.red': p.error,
    'charts.blue': p.func,
    'charts.yellow': p.warning,
    'charts.orange': p.constant,
    'charts.green': p.success,
    'charts.purple': p.keyword,

    // --- Ports, testing, SCM ----------------------------------------------
    'ports.iconRunningProcessForeground': p.success,
    'testing.iconFailed': p.error,
    'testing.iconErrored': p.error,
    'testing.iconPassed': p.success,
    'testing.iconQueued': p.warning,
    'testing.iconSkipped': p.fgSubtle,
    'testing.iconUnset': p.fgSubtle,
    'testing.runAction': p.success,
    'testing.message.error.lineBackground': alpha(p.error, 0.12),
    'testing.message.error.badgeBackground': p.error,
    'testing.message.error.badgeBorder': alpha(p.error, 0.5),
    'testing.message.error.badgeForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'testing.message.info.decorationForeground': p.info,
    'scmGraph.historyItemRefColor': p.accent,
    'scmGraph.historyItemRemoteRefColor': p.accent2,
    'scmGraph.historyItemBaseRefColor': p.success,
    'testing.coveredBackground': alpha(p.success, 0.14),
    'testing.coveredBorder': alpha(p.success, 0.3),
    'testing.coveredGutterBackground': alpha(p.success, 0.5),
    'testing.uncoveredBackground': alpha(p.warning, 0.12),
    'testing.uncoveredBorder': alpha(p.warning, 0.28),
    'testing.uncoveredGutterBackground': alpha(p.warning, 0.45),
    'testing.uncoveredBranchBackground': alpha(p.error, 0.2),
    'testing.coverCountBadgeBackground': p.bgOverlay,
    'testing.coverCountBadgeForeground': p.fg,

    // --- Chat and inline chat ----------------------------------------------
    // The chat view is a first-class surface now; unstyled it falls back to
    // defaults that clash with everything else here.
    'chat.requestBackground': p.bgElevated,
    'chat.requestBorder': p.border,
    'chat.requestBubbleBackground': p.bgElevated,
    'chat.requestBubbleHoverBackground': p.bgOverlay,
    'chat.requestCodeBorder': p.border,
    'chat.avatarBackground': p.bgOverlay,
    'chat.avatarForeground': p.accent,
    'chat.slashCommandBackground': alpha(p.accent, 0.2),
    'chat.slashCommandForeground': p.accent,
    'chat.editedFileForeground': p.warning,
    'chat.linesAddedForeground': added,
    'chat.linesRemovedForeground': deleted,
    'chat.checkpointSeparator': p.border,
    'chat.thinkingShimmer': p.accent2,
    'chatManagement.sashBorder': p.border,
    'aiCustomizationManagement.sashBorder': p.border,
    'agentStatusIndicator.background': alpha(p.accent, 0.2),
    'agentSessionReadIndicator.foreground': p.accent,
    'agentSessionSelectedBadge.border': p.accent,
    'agentSessionSelectedUnfocusedBadge.border': alpha(p.accent, 0.5),
    'inlineChat.background': p.bgOverlay,
    'inlineChat.foreground': p.fg,
    'inlineChat.border': p.border,
    'inlineChat.shadow': shadow,
    'inlineChatInput.background': dark ? sink(p.bgElevated, 0.25) : p.bgOverlay,
    'inlineChatInput.border': p.border,
    'inlineChatInput.focusBorder': alpha(p.accent, 0.6),
    'inlineChatInput.placeholderForeground': p.fgSubtle,
    'inlineChatDiff.inserted': alpha(added, 0.14),
    'inlineChatDiff.removed': alpha(deleted, 0.14),

    // --- Inline edits and inline values -------------------------------------
    'editor.inlineValuesForeground': p.fgSubtle,
    'editor.inlineValuesBackground': alpha(p.accent, 0.1),
    'inlineEdit.originalBackground': alpha(deleted, 0.14),
    'inlineEdit.modifiedBackground': alpha(added, 0.14),
    'inlineEdit.originalBorder': alpha(deleted, 0.35),
    'inlineEdit.modifiedBorder': alpha(added, 0.35),
    'inlineEdit.gutterIndicator.primaryBackground': p.accent,
    'inlineEdit.gutterIndicator.primaryForeground': p.onAccentFg || (dark ? darken(p.bg, 0.4) : '#ffffff'),
    'inlineEdit.gutterIndicator.secondaryBackground': p.fgSubtle,
    'inlineEdit.gutterIndicator.secondaryForeground': p.bg,

    // --- Editor action list (the refactor / quick fix menu) ----------------
    'editorActionList.background': p.bgOverlay,
    'editorActionList.foreground': p.fg,
    'editorActionList.focusBackground': alpha(p.accent, 0.24),
    'editorActionList.focusForeground': p.fg,
    'menu.selectionBorder': '#00000000',
    'menubar.selectionBorder': '#00000000',
    'radio.activeForeground': p.fg,
    'radio.activeBackground': alpha(p.accent, 0.2),
    'radio.activeBorder': p.accent,
    'radio.inactiveForeground': p.fgMuted,
    'radio.inactiveBackground': '#00000000',
    'radio.inactiveBorder': p.border,
    'radio.inactiveHoverBackground': alpha(p.fgSubtle, 0.12),

    // --- Multi-file diff (agent change reviews land here) ------------------
    'multiDiffEditor.background': p.bgDim,
    'multiDiffEditor.headerBackground': p.bgElevated,
    'multiDiffEditor.border': p.border,

    // --- Comments and review ------------------------------------------------
    'editorGutter.commentRangeForeground': alpha(p.fgSubtle, 0.5),
    'editorGutter.commentGlyphForeground': p.fgMuted,
    'editorGutter.commentUnresolvedGlyphForeground': p.warning,
    'editorCommentsWidget.resolvedBorder': alpha(p.fgSubtle, 0.6),
    'editorCommentsWidget.unresolvedBorder': p.warning,
    'editorCommentsWidget.rangeBackground': alpha(p.accent, 0.1),
    'editorCommentsWidget.rangeActiveBackground': alpha(p.accent, 0.16),
    'editorCommentsWidget.replyInputBackground': p.bgOverlay,
    'commentsView.resolvedIcon': p.fgSubtle,
    'commentsView.unresolvedIcon': p.warning,
  };

  // A palette may pin individual keys verbatim. Used by the original theme to
  // keep the exact chrome its users already know.
  Object.assign(colors, p.overrides || {});

  const tokenColors = buildTokenColors(p, { italic, boldItalic, dark });
  const semanticTokenColors = buildSemanticTokens(p, { dark });

  return {
    $schema: 'vscode://schemas/color-theme',
    name: p.label,
    type: p.appearance,
    semanticHighlighting: true,
    colors,
    tokenColors,
    semanticTokenColors,
  };
}

function buildTokenColors(p, { italic, boldItalic }) {
  const t = (name, scope, settings) => ({ name, scope, settings });

  return [
    t('Comment', ['comment', 'punctuation.definition.comment', 'string.comment'], {
      foreground: p.comment,
      fontStyle: italic,
    }),
    t('Documentation comment', ['comment.block.documentation', 'comment.line.documentation'], {
      foreground: p.docComment || p.comment,
      fontStyle: italic,
    }),
    t('Doc comment tag', ['storage.type.class.jsdoc', 'punctuation.definition.block.tag.jsdoc', 'entity.name.type.instance.jsdoc'], {
      foreground: p.accent2,
      fontStyle: italic,
    }),

    t('Variable', ['variable', 'variable.other.readwrite', 'meta.definition.variable variable.other', 'string constant.other.placeholder'], {
      foreground: p.variable,
    }),
    t('Language variable (this, self, super)', ['variable.language', 'variable.language.this', 'variable.language.self', 'variable.language.super', 'keyword.other.this'], {
      foreground: p.languageVariable || p.constant,
      fontStyle: italic,
    }),
    t('Parameter', ['variable.parameter', 'meta.parameter', 'meta.function.parameters variable'], {
      foreground: p.parameter,
      fontStyle: italic,
    }),
    t('Property / member access', ['variable.other.property', 'variable.other.object.property', 'meta.property-name', 'support.variable.property', 'variable.other.member'], {
      foreground: p.property,
    }),
    t('Object / namespace', ['variable.other.object', 'variable.other.constant.object', 'meta.object-literal.key'], {
      foreground: p.property,
    }),
    t('Constant', ['constant', 'variable.other.constant', 'constant.other.caps', 'support.constant'], {
      foreground: p.constant,
    }),
    t('Number', ['constant.numeric', 'constant.numeric.integer', 'constant.numeric.float', 'keyword.other.unit'], {
      foreground: p.number || p.constant,
    }),
    t('Boolean / null / undefined', ['constant.language', 'constant.language.boolean', 'constant.language.null', 'constant.language.undefined', 'constant.language.nil'], {
      foreground: p.constant,
      fontStyle: italic,
    }),

    t('String', ['string', 'string.quoted', 'string.template', 'constant.other.symbol', 'constant.other.key'], {
      foreground: p.string,
    }),
    t('String punctuation', ['punctuation.definition.string'], {
      foreground: p.stringPunctuation || mix(p.string, p.comment, 0.35),
    }),
    t('Template expression punctuation', ['punctuation.definition.template-expression', 'punctuation.section.embedded', 'meta.embedded', 'keyword.other.substitution'], {
      foreground: p.operator,
    }),
    t('Escape character', ['constant.character.escape', 'constant.character', 'constant.escape'], {
      foreground: p.escape || p.accent2,
    }),
    t('Regular expression', ['string.regexp', 'string.regexp punctuation.definition.string'], {
      foreground: p.regexp || p.accent2,
    }),
    t('Regex operators and groups', ['keyword.operator.or.regexp', 'keyword.control.anchor.regexp', 'punctuation.definition.group.regexp', 'constant.other.character-class.regexp'], {
      foreground: p.operator,
    }),

    t('Keyword', ['keyword', 'keyword.other', 'storage', 'storage.type', 'storage.modifier'], {
      foreground: p.keyword,
    }),
    t('Control keyword', ['keyword.control', 'keyword.control.flow', 'keyword.control.import', 'keyword.control.from', 'keyword.control.conditional', 'keyword.control.loop', 'keyword.control.return', 'keyword.control.trycatch'], {
      foreground: p.controlKeyword || p.keyword,
      fontStyle: italic,
    }),
    t('Operator', ['keyword.operator', 'keyword.operator.assignment', 'keyword.operator.arithmetic', 'keyword.operator.comparison', 'keyword.operator.logical', 'keyword.operator.ternary', 'keyword.operator.spread'], {
      foreground: p.operator,
    }),
    t('New / instanceof / typeof', ['keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.instanceof', 'keyword.operator.typeof', 'keyword.operator.void'], {
      foreground: p.keyword,
      fontStyle: italic,
    }),
    t('Punctuation', ['punctuation', 'punctuation.separator', 'punctuation.terminator', 'punctuation.accessor', 'meta.brace', 'punctuation.definition.parameters', 'punctuation.section'], {
      foreground: p.punctuation || p.operator,
    }),

    t('Function declaration', ['entity.name.function', 'meta.function entity.name.function', 'meta.definition.function entity.name.function'], {
      foreground: p.func,
      fontStyle: 'bold',
    }),
    t('Function call', ['meta.function-call', 'meta.function-call entity.name.function', 'variable.function', 'support.function', 'entity.name.function.call'], {
      foreground: p.func,
    }),
    t('Method', ['entity.name.method', 'meta.method entity.name.function', 'keyword.other.special-method', 'meta.class-method entity.name.function'], {
      foreground: p.func,
    }),
    t('Builtin / library function', ['support.function.builtin', 'support.function.magic', 'support.function.construct'], {
      foreground: p.builtin || p.func,
      fontStyle: italic,
    }),
    t('Decorator', ['meta.decorator', 'entity.name.function.decorator', 'punctuation.decorator', 'tag.decorator.js entity.name.tag.js', 'tag.decorator.js punctuation.definition.tag.js', 'meta.attribute', 'meta.annotation'], {
      foreground: p.decorator || p.accent2,
      fontStyle: italic,
    }),

    t('Class / type', ['entity.name.type', 'entity.name.class', 'entity.name.namespace', 'entity.name.scope-resolution', 'support.type', 'support.class', 'entity.other.inherited-class', 'meta.type.annotation entity.name.type'], {
      foreground: p.type,
    }),
    t('Type declaration', ['entity.name.type.declaration', 'entity.name.type.class', 'entity.name.type.interface', 'entity.name.type.struct', 'entity.name.type.enum'], {
      foreground: p.type,
      fontStyle: 'bold',
    }),
    t('Primitive type', ['support.type.primitive', 'support.type.builtin', 'keyword.type'], {
      foreground: p.primitiveType || p.type,
      fontStyle: italic,
    }),
    t('Enum member', ['variable.other.enummember', 'entity.name.variable.enum-member'], {
      foreground: p.constant,
    }),
    t('Module / import name', ['entity.name.module', 'entity.name.import', 'support.other.namespace', 'meta.import entity.name'], {
      foreground: p.type,
    }),

    t('Markup tag', ['entity.name.tag', 'meta.tag.sgml', 'punctuation.definition.tag', 'punctuation.definition.tag.begin', 'punctuation.definition.tag.end'], {
      foreground: p.tag,
    }),
    t('Tag attribute', ['entity.other.attribute-name', 'meta.tag entity.other.attribute-name'], {
      foreground: p.attribute || p.constant,
      fontStyle: italic,
    }),
    t('Component / custom element', ['support.class.component', 'entity.name.tag.custom', 'meta.tag.custom entity.name.tag'], {
      foreground: p.type,
    }),

    t('CSS property', ['support.type.property-name.css', 'support.type.property-name.scss', 'support.type.property-name.less', 'meta.property-name'], {
      foreground: p.property,
    }),
    t('CSS selector class', ['entity.other.attribute-name.class.css', 'entity.other.attribute-name.class'], {
      foreground: p.type,
    }),
    t('CSS selector id', ['entity.other.attribute-name.id.css', 'entity.other.attribute-name.id'], {
      foreground: p.func,
    }),
    t('CSS pseudo', ['entity.other.attribute-name.pseudo-class', 'entity.other.attribute-name.pseudo-element'], {
      foreground: p.accent2,
      fontStyle: italic,
    }),
    t('CSS value / unit', ['support.constant.property-value', 'support.constant.font-name', 'constant.other.color', 'constant.other.rgb-value'], {
      foreground: p.constant,
    }),
    t('CSS at-rule', ['keyword.control.at-rule', 'punctuation.definition.keyword.css'], {
      foreground: p.keyword,
    }),

    t('JSON key', ['support.type.property-name.json', 'source.json meta.structure.dictionary.json support.type.property-name.json'], {
      foreground: p.property,
    }),
    t('JSON nested key', ['source.json meta.structure.dictionary.json meta.structure.dictionary.value.json support.type.property-name.json'], {
      foreground: p.accent2,
    }),
    t('YAML / TOML key', ['entity.name.tag.yaml', 'entity.name.tag.toml', 'support.type.property-name.toml'], {
      foreground: p.property,
    }),
    t('YAML anchor / alias', ['entity.name.type.anchor.yaml', 'variable.other.alias.yaml', 'punctuation.definition.anchor.yaml'], {
      foreground: p.accent2,
      fontStyle: italic,
    }),

    t('Shell variable', ['variable.other.normal.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell'], {
      foreground: p.variable,
    }),
    t('Shell builtin', ['support.function.builtin.shell', 'keyword.other.shell'], {
      foreground: p.func,
    }),
    t('SQL keyword', ['keyword.other.DML', 'keyword.other.DDL'], {
      foreground: p.keyword,
    }),

    t('Markdown heading', ['markup.heading', 'markup.heading entity.name', 'punctuation.definition.heading'], {
      foreground: p.func,
      fontStyle: 'bold',
    }),
    t('Markdown bold', ['markup.bold', 'markup.bold string'], {
      foreground: p.type,
      fontStyle: 'bold',
    }),
    t('Markdown italic', ['markup.italic', 'markup.italic string'], {
      foreground: p.keyword,
      fontStyle: 'italic',
    }),
    t('Markdown strikethrough', ['markup.strikethrough'], {
      foreground: p.comment,
      fontStyle: 'strikethrough',
    }),
    t('Markdown link', ['string.other.link', 'markup.underline.link', 'constant.other.reference.link'], {
      foreground: p.accent,
      fontStyle: 'underline',
    }),
    t('Markdown link title', ['string.other.link.title', 'string.other.link.description'], {
      foreground: p.accent2,
      fontStyle: '',
    }),
    t('Markdown quote', ['markup.quote', 'punctuation.definition.quote.begin'], {
      foreground: p.comment,
      fontStyle: 'italic',
    }),
    t('Markdown list marker', ['punctuation.definition.list.begin', 'markup.list punctuation.definition.list_item'], {
      foreground: p.accent2,
    }),
    t('Markdown inline code', ['markup.inline.raw', 'markup.fenced_code.block', 'markup.raw.block'], {
      foreground: p.string,
    }),
    t('Markdown code fence punctuation', ['punctuation.definition.raw.markdown', 'punctuation.definition.markdown', 'fenced_code.block.language'], {
      foreground: p.comment,
    }),
    t('Markdown separator / table', ['meta.separator', 'markup.table', 'punctuation.definition.table'], {
      foreground: p.comment,
    }),

    t('Diff inserted', ['markup.inserted', 'markup.inserted.diff', 'punctuation.definition.inserted'], {
      foreground: p.added || p.success,
    }),
    t('Diff deleted', ['markup.deleted', 'markup.deleted.diff', 'punctuation.definition.deleted'], {
      foreground: p.deleted || p.error,
    }),
    t('Diff changed', ['markup.changed', 'markup.changed.diff', 'punctuation.definition.changed'], {
      foreground: p.modified || p.info,
    }),
    t('Diff header', ['meta.diff.header', 'meta.diff.range'], {
      foreground: p.accent2,
    }),

    t('Invalid', ['invalid', 'invalid.illegal'], {
      foreground: p.error,
    }),
    t('Deprecated', ['invalid.deprecated'], {
      foreground: p.warning,
      fontStyle: 'strikethrough',
    }),

    // --- Go: the language this theme family was originally tuned for -------
    t('Go package and import', ['entity.name.package.go', 'entity.name.import.go', 'keyword.package.go', 'keyword.import.go'], {
      foreground: p.type,
      fontStyle: italic,
    }),
    t('Go function declaration', ['source.go entity.name.function'], {
      foreground: p.func,
      fontStyle: 'bold',
    }),
    t('Go type declaration', ['source.go entity.name.type', 'entity.name.type.go'], {
      foreground: p.type,
      fontStyle: 'bold',
    }),
    t('Go struct field', ['variable.other.property.go', 'variable.other.member.go'], {
      foreground: p.property,
    }),
    t('Go method receiver', ['variable.parameter.receiver.go'], {
      foreground: p.parameter,
      fontStyle: italic,
    }),
    t('Go error value', ['variable.other.error.go', 'support.type.error.go'], {
      foreground: p.error,
      fontStyle: italic,
    }),
    t('Go nil', ['constant.language.nil.go'], {
      foreground: p.error,
      fontStyle: italic,
    }),
    t('Go builtin', ['support.function.builtin.go', 'keyword.function.go'], {
      foreground: p.builtin || p.func,
      fontStyle: italic,
    }),
    t('Go interface and struct keywords', ['keyword.interface.go', 'keyword.struct.go', 'keyword.type.go', 'keyword.var.go', 'keyword.const.go'], {
      foreground: p.keyword,
      fontStyle: boldItalic,
    }),

    // --- TypeScript / JavaScript -------------------------------------------
    t('TS type annotation', ['meta.type.annotation entity.name.type.ts', 'meta.return.type.ts entity.name.type.ts'], {
      foreground: p.type,
    }),
    t('TS interface member', ['meta.interface.ts variable.object.property.ts', 'meta.field.declaration.ts variable.object.property.ts'], {
      foreground: p.property,
    }),
    t('JS/TS import/export binding', ['meta.import variable.other.readwrite', 'meta.export variable.other.readwrite', 'variable.other.readwrite.alias'], {
      foreground: p.variable,
    }),
    t('JSX text', ['meta.jsx.children', 'JSXNested'], {
      foreground: p.fg,
    }),

    // --- Python / Rust / others --------------------------------------------
    t('Python self / cls', ['variable.language.special.self.python', 'variable.parameter.function.language.special.self.python'], {
      foreground: p.languageVariable || p.constant,
      fontStyle: italic,
    }),
    t('Python f-string', ['meta.fstring.python', 'string.interpolated.python'], {
      foreground: p.string,
    }),
    t('Rust lifetime', ['storage.modifier.lifetime.rust', 'entity.name.lifetime.rust'], {
      foreground: p.accent2,
      fontStyle: italic,
    }),
    t('Rust macro', ['support.function.macro.rust', 'entity.name.function.macro.rust'], {
      foreground: p.builtin || p.func,
      fontStyle: italic,
    }),
    t('C/C++ preprocessor', ['keyword.control.directive', 'punctuation.definition.directive', 'entity.name.function.preprocessor'], {
      foreground: p.accent2,
    }),

    t('URL', ['*url*', '*link*', '*uri*'], {
      fontStyle: 'underline',
    }),
  ];
}

function buildSemanticTokens(p) {
  const italic = p.italics !== false;
  return {
    namespace: { foreground: p.type },
    class: { foreground: p.type },
    'class.declaration': { foreground: p.type, bold: true },
    struct: { foreground: p.type },
    interface: { foreground: p.type, italic },
    enum: { foreground: p.type },
    enumMember: { foreground: p.constant },
    typeParameter: { foreground: p.primitiveType || p.type, italic },
    type: { foreground: p.type },
    'type.defaultLibrary': { foreground: p.primitiveType || p.type, italic },

    function: { foreground: p.func },
    'function.declaration': { foreground: p.func, bold: true },
    'function.defaultLibrary': { foreground: p.builtin || p.func, italic },
    method: { foreground: p.func },
    'method.declaration': { foreground: p.func, bold: true },
    macro: { foreground: p.builtin || p.func, italic },
    decorator: { foreground: p.decorator || p.accent2, italic },

    variable: { foreground: p.variable },
    'variable.declaration': { foreground: p.variable },
    'variable.readonly': { foreground: p.constant },
    'variable.readonly.defaultLibrary': { foreground: p.languageVariable || p.constant, italic },
    'variable.defaultLibrary': { foreground: p.languageVariable || p.constant, italic },
    parameter: { foreground: p.parameter, italic },
    property: { foreground: p.property },
    'property.readonly': { foreground: p.property },
    'property.declaration': { foreground: p.property },
    selfParameter: { foreground: p.languageVariable || p.constant, italic },
    event: { foreground: p.accent2 },

    keyword: { foreground: p.keyword },
    operator: { foreground: p.operator },
    string: { foreground: p.string },
    number: { foreground: p.number || p.constant },
    regexp: { foreground: p.regexp || p.accent2 },
    comment: { foreground: p.comment, italic },
    label: { foreground: p.accent2 },

    // Go-specific semantic tokens emitted by gopls.
    'variable.readonly.go': { foreground: p.constant },
    'type.defaultLibrary.go': { foreground: p.primitiveType || p.type, italic },
    'namespace.go': { foreground: p.type, italic },

    '*.deprecated': { strikethrough: true },
    '*.abstract': { italic },
  };
}

// Readability gate. Any theme that trips this fails the build.
function auditTheme(theme, palette) {
  const problems = [];
  const warnings = [];
  const bg = palette.bg;

  const textRoles = ['fg', 'keyword', 'string', 'func', 'type', 'constant', 'variable', 'property', 'operator', 'tag', 'parameter', 'error', 'warning', 'info', 'success'];
  for (const role of textRoles) {
    const ratio = contrast(palette[role], bg);
    if (ratio < 4.5) problems.push(`${role} (${palette[role]}) has ${ratio.toFixed(2)}:1 on the editor background, below the 4.5:1 body-text floor`);
  }

  // Chrome text: quieter than code, still above the 3:1 floor for UI text.
  for (const [role, floor] of [['fgMuted', 4.5], ['fgSubtle', 3]]) {
    const ratio = contrast(palette[role], bg);
    if (ratio < floor) problems.push(`${role} (${palette[role]}) has ${ratio.toFixed(2)}:1, below its ${floor}:1 floor`);
  }

  // Comments are deliberately quieter, but still have to be legible.
  const commentRatio = contrast(palette.comment, bg);
  if (commentRatio < 3) problems.push(`comment (${palette.comment}) has ${commentRatio.toFixed(2)}:1, below the 3:1 floor for de-emphasized text`);
  if (commentRatio > 7) warnings.push(`comment (${palette.comment}) has ${commentRatio.toFixed(2)}:1 — loud enough to compete with code`);

  // Chrome has to separate from the editor without turning into stripes.
  for (const surface of ['bgDim', 'bgElevated', 'bgOverlay']) {
    const ratio = contrast(palette[surface], bg);
    if (ratio > 1.6) warnings.push(`${surface} (${palette[surface]}) is ${ratio.toFixed(2)}:1 against the editor — surfaces this far apart read as banding`);
  }

  // Syntax hues have to be told apart from each other, not just from the background.
  const hues = ['keyword', 'string', 'func', 'type', 'constant', 'tag', 'property'];
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const a = palette[hues[i]];
      const b = palette[hues[j]];
      if (a.toLowerCase() === b.toLowerCase()) {
        problems.push(`${hues[i]} and ${hues[j]} are the same color (${a})`);
        continue;
      }
      // Near-neutral roles are deliberately colorless; hue is noise down there.
      if (toOklch(a).C < 0.04 || toOklch(b).C < 0.04) continue;
      const dh = hueDistance(a, b);
      if (dh < 12 && contrast(a, b) < 1.25) {
        problems.push(`${hues[i]} (${a}) and ${hues[j]} (${b}) sit ${dh.toFixed(0)}° apart with no lightness gap — they will not be distinguishable`);
      }
    }
  }

  // The family trait: one perceived brightness across all syntax colors, so the
  // eye reads structure from hue instead of being yanked around by lightness.
  const lightnesses = SYNTAX_ROLES
    .filter((role) => palette[role] && palette[role] !== palette.fg)
    .map((role) => ({ role, L: toOklch(palette[role]).L }));
  const min = lightnesses.reduce((a, b) => (a.L < b.L ? a : b));
  const max = lightnesses.reduce((a, b) => (a.L > b.L ? a : b));
  const spread = max.L - min.L;
  if (spread > 0.1) {
    warnings.push(`syntax lightness spreads ${(spread * 100).toFixed(1)} L points (${min.role} ${min.L.toFixed(2)} to ${max.role} ${max.L.toFixed(2)}) — set uniformL to flatten it`);
  }

  // Red/green alone is the one pairing a colorblind reader cannot resolve.
  const rg = hueDistance(palette.error, palette.success);
  const rgLightness = Math.abs(toOklch(palette.error).L - toOklch(palette.success).L);
  if (rg > 60 && rgLightness < 0.04 && contrast(palette.error, palette.success) < 1.2) {
    warnings.push('error and success differ only in hue — deuteranopic readers will see one color; the diff borders carry the fallback');
  }

  return { problems, warnings, spread };
}

module.exports = { buildTheme, auditTheme, harmonize, REQUIRED_ROLES, SYNTAX_ROLES };
