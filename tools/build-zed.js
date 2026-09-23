#!/usr/bin/env node
// Builds the Zed edition of the family from the same palettes as the VS Code one.
// Zed takes a different shape — one file holding every variant, ~140 flat style
// keys, free-form syntax tokens — but the colors come from tools/palettes.js, so
// the two editors stay in sync by construction.
//
//   node tools/build-zed.js

const fs = require('fs');
const path = require('path');
const palettes = require('./palettes');
const { harmonize } = require('./build-theme');
const { mix, lighten, darken, alpha, contrast } = require('./color');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'zed');
const THEME_FILE = path.join(OUT_DIR, 'themes', 'shades-of-stoicism.json');

function buildStyle(rawPalette) {
  const p = harmonize(rawPalette);
  const dark = p.appearance === 'dark';
  const raise = (hex, amount) => (dark ? lighten(hex, amount) : darken(hex, amount));

  const added = p.added || p.success;
  const modified = p.modified || p.info;
  const deleted = p.deleted || p.error;
  const lineHighlight = p.lineHighlight || alpha(raise(p.bg, 0.5), dark ? 0.07 : 0.05);

  // Zed asks for dim and bright variants of every ANSI color, where VS Code only
  // wanted bright. Same syntax hues drive all three rows.
  const ansi = {
    black: dark ? raise(p.bg, 0.12) : darken(p.fg, 0.3),
    red: p.error,
    green: p.success,
    yellow: p.warning,
    blue: p.func,
    magenta: p.keyword,
    cyan: p.operator,
    white: p.fgMuted,
  };
  const bright = (hex) => (dark ? lighten(hex, 0.22) : darken(hex, 0.12));
  const dim = (hex) => (dark ? darken(hex, 0.22) : lighten(hex, 0.22));

  // A status color, its wash, and its edge — Zed wants all three for each.
  const status = (color) => ({
    base: color,
    background: alpha(color, 0.12),
    border: alpha(color, 0.3),
  });
  const statusKeys = (name, color) => {
    const s = status(color);
    return {
      [name]: s.base,
      [`${name}.background`]: s.background,
      [`${name}.border`]: s.border,
    };
  };

  return {
    background: p.bgDim,
    border: p.border,
    'border.variant': alpha(p.border, 0.6),
    'border.focused': alpha(p.accent, 0.6),
    'border.selected': alpha(p.accent, 0.5),
    'border.transparent': '#00000000',
    'border.disabled': alpha(p.border, 0.4),

    'elevated_surface.background': p.bgOverlay,
    'surface.background': p.bgElevated,
    'drop_target.background': alpha(p.accent, 0.16),

    'element.background': p.bgElevated,
    'element.hover': alpha(p.fgSubtle, 0.14),
    'element.active': alpha(p.accent, 0.22),
    'element.selected': alpha(p.accent, 0.18),
    'element.disabled': alpha(p.fgSubtle, 0.06),
    'ghost_element.background': '#00000000',
    'ghost_element.hover': alpha(p.fgSubtle, 0.12),
    'ghost_element.active': alpha(p.accent, 0.2),
    'ghost_element.selected': alpha(p.accent, 0.16),
    'ghost_element.disabled': alpha(p.fgSubtle, 0.06),

    text: p.fg,
    'text.muted': p.fgMuted,
    'text.placeholder': p.fgSubtle,
    'text.disabled': p.fgSubtle,
    'text.accent': p.accent,
    icon: p.fgMuted,
    'icon.muted': p.fgSubtle,
    'icon.disabled': p.fgSubtle,
    'icon.placeholder': p.fgSubtle,
    'icon.accent': p.accent,
    'link_text.hover': p.accent2,

    'status_bar.background': p.bgDim,
    'title_bar.background': p.bgDim,
    'title_bar.inactive_background': p.bgDim,
    'toolbar.background': p.bg,
    'tab_bar.background': p.bgDim,
    'tab.active_background': p.bg,
    'tab.inactive_background': p.bgDim,
    'panel.background': p.bgElevated,
    'panel.focused_border': alpha(p.accent, 0.6),
    'panel.indent_guide': alpha(p.fgSubtle, 0.18),
    'panel.indent_guide_active': alpha(p.fgSubtle, 0.55),
    'panel.indent_guide_hover': alpha(p.fgSubtle, 0.35),
    'pane.focused_border': alpha(p.accent, 0.6),
    'pane_group.border': p.border,

    'editor.background': p.bg,
    'editor.foreground': p.fg,
    'editor.gutter.background': p.bg,
    'editor.subheader.background': p.bgElevated,
    'editor.active_line.background': lineHighlight,
    'editor.highlighted_line.background': alpha(p.accent, 0.12),
    'editor.line_number': p.fgSubtle,
    'editor.active_line_number': p.accent,
    'editor.invisible': alpha(p.fgSubtle, 0.35),
    'editor.wrap_guide': alpha(p.fgSubtle, 0.2),
    'editor.active_wrap_guide': alpha(p.fgSubtle, 0.45),
    'editor.indent_guide': alpha(p.fgSubtle, 0.18),
    'editor.indent_guide_active': alpha(p.fgSubtle, 0.55),
    'editor.document_highlight.read_background': alpha(p.accent2, 0.16),
    'editor.document_highlight.write_background': alpha(p.success, 0.18),
    'editor.document_highlight.bracket_background': alpha(p.accent, 0.18),

    'search.match_background': alpha(p.accent2, 0.36),
    'scrollbar.track.background': '#00000000',
    'scrollbar.track.border': '#00000000',
    'scrollbar.thumb.background': alpha(p.fgSubtle, 0.25),
    'scrollbar.thumb.hover_background': alpha(p.fgSubtle, 0.4),
    'scrollbar.thumb.border': '#00000000',

    ...statusKeys('error', p.error),
    ...statusKeys('warning', p.warning),
    ...statusKeys('info', p.info),
    ...statusKeys('success', p.success),
    ...statusKeys('created', added),
    ...statusKeys('modified', modified),
    ...statusKeys('deleted', deleted),
    ...statusKeys('conflict', p.warning),
    ...statusKeys('renamed', p.info),
    ...statusKeys('hidden', p.fgSubtle),
    ...statusKeys('ignored', p.fgSubtle),
    ...statusKeys('unreachable', p.fgSubtle),
    // Inline AI predictions and inlay hints: quiet, but never below readable.
    ...statusKeys('predictive', p.fgSubtle),
    ...statusKeys('hint', p.fgSubtle),

    'terminal.background': p.bgDim,
    'terminal.foreground': p.fg,
    'terminal.bright_foreground': dark ? lighten(p.fg, 0.3) : darken(p.fg, 0.3),
    'terminal.dim_foreground': p.fgMuted,
    'terminal.ansi.background': p.bgDim,
    'terminal.ansi.black': ansi.black,
    'terminal.ansi.red': ansi.red,
    'terminal.ansi.green': ansi.green,
    'terminal.ansi.yellow': ansi.yellow,
    'terminal.ansi.blue': ansi.blue,
    'terminal.ansi.magenta': ansi.magenta,
    'terminal.ansi.cyan': ansi.cyan,
    'terminal.ansi.white': ansi.white,
    'terminal.ansi.bright_black': p.fgSubtle,
    'terminal.ansi.bright_red': bright(ansi.red),
    'terminal.ansi.bright_green': bright(ansi.green),
    'terminal.ansi.bright_yellow': bright(ansi.yellow),
    'terminal.ansi.bright_blue': bright(ansi.blue),
    'terminal.ansi.bright_magenta': bright(ansi.magenta),
    'terminal.ansi.bright_cyan': bright(ansi.cyan),
    'terminal.ansi.bright_white': dark ? lighten(p.fg, 0.35) : darken(p.fg, 0.4),
    'terminal.ansi.dim_black': dim(ansi.black),
    'terminal.ansi.dim_red': dim(ansi.red),
    'terminal.ansi.dim_green': dim(ansi.green),
    'terminal.ansi.dim_yellow': dim(ansi.yellow),
    'terminal.ansi.dim_blue': dim(ansi.blue),
    'terminal.ansi.dim_magenta': dim(ansi.magenta),
    'terminal.ansi.dim_cyan': dim(ansi.cyan),
    'terminal.ansi.dim_white': p.fgSubtle,

    // Collaboration cursors. First entry is you, so it gets the brand accent.
    players: [p.accent, p.accent2, p.string, p.type, p.constant, p.tag, p.property, p.func].map((c) => ({
      cursor: c,
      selection: alpha(c, 0.24),
      background: c,
    })),
    accents: [p.accent, p.accent2, p.string, p.type, p.constant, p.tag, p.property, p.func],

    syntax: buildSyntax(p),
  };
}

function buildSyntax(p) {
  const italic = p.italics === false ? 'normal' : 'italic';
  const t = (color, extra = {}) => ({ color, font_style: null, font_weight: null, ...extra });

  return {
    comment: t(p.comment, { font_style: italic }),
    'comment.doc': t(p.docComment || p.comment, { font_style: italic }),

    keyword: t(p.keyword),
    operator: t(p.operator),
    punctuation: t(p.punctuation || p.operator),
    'punctuation.bracket': t(p.punctuation || p.operator),
    'punctuation.delimiter': t(p.punctuation || p.operator),
    'punctuation.special': t(p.escape || p.accent2),
    'punctuation.list_marker': t(p.accent2),

    string: t(p.string),
    'string.escape': t(p.escape || p.accent2),
    'string.regex': t(p.regexp || p.accent2),
    'string.special': t(p.escape || p.accent2),
    'string.special.symbol': t(p.constant),

    function: t(p.func),
    'function.method': t(p.func),
    'function.definition': t(p.func, { font_weight: 700 }),
    'function.special.definition': t(p.func, { font_weight: 700 }),
    constructor: t(p.type),

    type: t(p.type),
    'type.super': t(p.type, { font_style: italic }),
    enum: t(p.type),
    variant: t(p.constant),
    attribute: t(p.attribute || p.constant, { font_style: italic }),
    property: t(p.property),
    constant: t(p.constant),
    number: t(p.number || p.constant),
    boolean: t(p.constant, { font_style: italic }),

    variable: t(p.variable),
    'variable.special': t(p.languageVariable || p.constant, { font_style: italic }),
    'variable.member': t(p.property),
    'variable.parameter': t(p.parameter, { font_style: italic }),

    tag: t(p.tag),
    'tag.attribute': t(p.attribute || p.constant, { font_style: italic }),
    label: t(p.accent2),

    // CSS selectors and markdown punctuation — One Dark sets these, and without
    // them stylesheets fall back to plain foreground.
    selector: t(p.type),
    'selector.pseudo': t(p.accent2, { font_style: italic }),
    'punctuation.markup': t(p.comment),

    // Diff views inside the editor.
    'diff.plus': t(p.added || p.success),
    'diff.minus': t(p.deleted || p.error),

    // Tree-sitter captures that finer-grained grammars emit. Unknown tokens are
    // ignored by Zed, so these cost nothing where a language doesn't use them.
    'variable.builtin': t(p.languageVariable || p.constant, { font_style: italic }),
    'function.builtin': t(p.builtin || p.func, { font_style: italic }),
    'function.call': t(p.func),
    'function.decorator': t(p.decorator || p.accent2, { font_style: italic }),
    'function.macro': t(p.builtin || p.func, { font_style: italic }),
    'constant.builtin': t(p.constant, { font_style: italic }),
    'type.builtin': t(p.primitiveType || p.type, { font_style: italic }),
    'type.definition': t(p.type, { font_weight: 700 }),
    'type.interface': t(p.type, { font_style: italic }),
    'keyword.import': t(p.controlKeyword || p.keyword, { font_style: italic }),
    'keyword.return': t(p.controlKeyword || p.keyword, { font_style: italic }),
    'keyword.conditional': t(p.controlKeyword || p.keyword, { font_style: italic }),
    'keyword.repeat': t(p.controlKeyword || p.keyword, { font_style: italic }),
    'keyword.exception': t(p.controlKeyword || p.keyword, { font_style: italic }),
    'keyword.function': t(p.keyword),
    'keyword.operator': t(p.operator),
    parameter: t(p.parameter, { font_style: italic }),
    field: t(p.property),
    module: t(p.type),
    'comment.documentation': t(p.docComment || p.comment, { font_style: italic }),
    'string.documentation': t(p.string, { font_style: italic }),
    'string.regexp': t(p.regexp || p.accent2),
    'number.float': t(p.number || p.constant),
    namespace: t(p.type),
    embedded: t(p.fg),
    preproc: t(p.accent2),
    primary: t(p.fg),
    predictive: t(p.fgSubtle, { font_style: italic }),
    hint: t(p.fgSubtle, { font_style: italic }),

    title: t(p.func, { font_weight: 700 }),
    emphasis: t(p.keyword, { font_style: italic }),
    'emphasis.strong': t(p.type, { font_weight: 700 }),
    link_text: t(p.accent, { font_style: italic }),
    link_uri: t(p.accent2),
    'text.literal': t(p.string),
  };
}

function build() {
  const themes = palettes.map((raw) => {
    const p = harmonize(raw);
    return {
      name: p.label,
      appearance: p.appearance,
      style: buildStyle(raw),
    };
  });

  const family = {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Shades of Stoicism',
    author: 'Dharam Dhurandhar',
    themes,
  };

  fs.mkdirSync(path.dirname(THEME_FILE), { recursive: true });
  fs.writeFileSync(THEME_FILE, `${JSON.stringify(family, null, 2)}\n`);

  const styleKeys = Object.keys(themes[0].style).length;
  const syntaxKeys = Object.keys(themes[0].style.syntax).length;
  for (const theme of themes) {
    const s = theme.style;
    const ratio = contrast(s['editor.foreground'], s['editor.background']).toFixed(2);
    console.log(`  ${theme.name.padEnd(29)} ${theme.appearance.padEnd(5)} text ${ratio}:1`);
  }
  console.log(`\n${themes.length} Zed themes written to ${path.relative(ROOT, THEME_FILE)}`);
  console.log(`${styleKeys} style keys · ${syntaxKeys} syntax tokens each`);
}

build();
