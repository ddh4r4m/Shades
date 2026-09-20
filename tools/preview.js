#!/usr/bin/env node
// Renders every theme into a single self-contained HTML specimen sheet, painted
// with the real generated colors rather than hand-copied ones.
//
//   node tools/preview.js [outfile]

const fs = require('fs');
const path = require('path');
const palettes = require('./palettes');
const { harmonize } = require('./build-theme');
const { contrast, toOklch, flatten } = require('./color');

const ROOT = path.join(__dirname, '..');
const out = process.argv[2] || path.join(ROOT, 'preview.html');

// The original theme predates the palette system, so its roles are read back
// out of the file it ships rather than generated.
const CLASSIC = {
  id: 'classic',
  label: 'Shades',
  file: 'Shades-color-theme.json',
  appearance: 'dark',
  description: 'The original, hand-tuned. Deep indigo with cyan accents, built around Go.',
  bg: '#25273d', fg: '#E2E8F0', comment: '#546E7A',
  keyword: '#C792EA', string: '#C3E88D', func: '#82AAFF', type: '#FFCB6B',
  constant: '#F78C6C', variable: '#EEFFFF', property: '#B2CCD6', operator: '#89DDFF',
  tag: '#f07178', parameter: '#F78C6C', error: '#FF5370', warning: '#FFCB6B',
  info: '#89DDFF', success: '#C3E88D', accent: '#63B3ED', accent2: '#B794F4',
  fgMuted: '#A0AEC0', fgSubtle: '#65737E',
};

const SYNTAX = ['keyword', 'string', 'func', 'type', 'constant', 'property', 'operator', 'tag', 'parameter', 'variable'];

// Theme files are JSONC — the original hand-written one is full of comments.
function stripComments(text) {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inLine) {
      if (c === '\n') { inLine = false; out += c; }
    } else if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i++; }
    } else if (inString) {
      out += c;
      if (c === '\\') { out += next; i++; } else if (c === '"') inString = false;
    } else if (c === '/' && next === '/') { inLine = true; i++; }
    else if (c === '/' && next === '*') { inBlock = true; i++; }
    else { if (c === '"') inString = true; out += c; }
  }
  return out;
}

function readTheme(file) {
  return JSON.parse(stripComments(fs.readFileSync(path.join(ROOT, 'themes', file), 'utf8')));
}

function spec(rawPalette) {
  const p = rawPalette.uniformL ? harmonize(rawPalette) : rawPalette;
  const theme = readTheme(p.file);
  const c = theme.colors;
  // The classic theme leaves many keys unset; fall back to its palette roles.
  const pick = (key, fallback) => c[key] || fallback;

  const ls = SYNTAX.map((role) => toOklch(p[role]).L);
  const spread = Math.max(...ls) - Math.min(...ls);

  return {
    id: p.id,
    label: p.label,
    appearance: p.appearance,
    description: p.description,
    textContrast: contrast(p.fg, p.bg),
    spread,
    dots: SYNTAX.map((role) => ({ role, L: toOklch(p[role]).L, hex: p[role] })),
    vars: {
      '--bg': p.bg,
      '--fg': p.fg,
      '--kw': p.keyword,
      '--st': p.string,
      '--fn': p.func,
      '--ty': p.type,
      '--nu': p.constant,
      '--pr': p.property,
      '--op': p.operator,
      '--pa': p.parameter,
      '--va': p.variable,
      '--cm': p.comment,
      '--er': p.error,
      '--title-bg': pick('titleBar.activeBackground', p.bg),
      '--title-fg': pick('titleBar.activeForeground', p.fg),
      '--cc-bg': pick('commandCenter.background', pick('editorGroupHeader.tabsBackground', p.bg)),
      '--cc-fg': pick('commandCenter.foreground', p.fgMuted),
      '--cc-bd': pick('commandCenter.border', p.fgSubtle),
      '--act-bg': pick('activityBar.background', p.bg),
      '--act-fg': pick('activityBar.foreground', p.accent),
      '--act-off': pick('activityBar.inactiveForeground', p.fgSubtle),
      '--side-bg': pick('sideBar.background', p.bg),
      '--side-fg': pick('sideBar.foreground', p.fgMuted),
      '--side-title': pick('sideBarTitle.foreground', p.fg),
      '--sel-bg': flatten(pick('list.activeSelectionBackground', '#ffffff18'), pick('sideBar.background', p.bg)),
      '--sel-fg': pick('list.activeSelectionForeground', p.fg),
      '--tabs-bg': pick('editorGroupHeader.tabsBackground', p.bg),
      '--tab-bg': pick('tab.activeBackground', p.bg),
      '--tab-fg': pick('tab.activeForeground', p.fg),
      '--tab-off': pick('tab.inactiveForeground', p.fgSubtle),
      '--tab-top': pick('tab.activeBorderTop', p.accent),
      '--line-no': pick('editorLineNumber.foreground', p.fgSubtle),
      '--line-on': pick('editorLineNumber.activeForeground', p.accent),
      '--line-hl': flatten(pick('editor.lineHighlightBackground', '#ffffff0d'), p.bg),
      '--ghost': pick('editorGhostText.foreground', p.fgSubtle),
      '--hint-fg': pick('editorInlayHint.foreground', p.fgSubtle),
      '--hint-bg': flatten(pick('editorInlayHint.background', '#ffffff14'), p.bg),
      '--term-bg': pick('terminal.background', p.bg),
      '--term-fg': pick('terminal.foreground', p.fg),
      '--ansi-green': pick('terminal.ansiGreen', p.success),
      '--ansi-red': pick('terminal.ansiRed', p.error),
      '--ansi-yellow': pick('terminal.ansiYellow', p.warning),
      '--ansi-blue': pick('terminal.ansiBlue', p.func),
      '--ansi-cyan': pick('terminal.ansiCyan', p.operator),
      '--ansi-dim': pick('terminal.ansiBrightBlack', p.fgSubtle),
      '--status-bg': pick('statusBar.background', p.bg),
      '--status-fg': pick('statusBar.foreground', p.fgMuted),
      '--remote-bg': pick('statusBarItem.remoteBackground', p.accent),
      '--remote-fg': pick('statusBarItem.remoteForeground', p.bg),
      '--brk1': pick('editorBracketHighlight.foreground1', p.accent),
      '--brk2': pick('editorBracketHighlight.foreground2', p.keyword),
      '--brk3': pick('editorBracketHighlight.foreground3', p.type),
    },
  };
}

const specs = [spec(CLASSIC), ...palettes.map(spec)];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// One sample, rendered ten times. Each window only re-points the CSS variables.
const CODE = `<span class="cm">// pricing.go — totals round half-up, see RFC-118</span>
<span class="kw">package</span> <span class="ty">billing</span>

<span class="kw i">import</span> <span class="st">"math"</span>

<span class="kw">type</span> <span class="ty b">Plan</span> <span class="kw">struct</span> <span class="b1">{</span>
    <span class="pr">Name</span>     <span class="ty i">string</span>
    <span class="pr">Seats</span>    <span class="ty i">int</span>
    <span class="pr">Monthly</span>  <span class="ty i">float64</span>
<span class="b1">}</span>

<span class="kw">func</span> <span class="b2">(</span><span class="pa">p</span> <span class="ty">Plan</span><span class="b2">)</span> <span class="fn b">Total</span><span class="b2">(</span><span class="pa">months</span> <span class="ty i">int</span><span class="b2">)</span> <span class="b2">(</span><span class="ty i">float64</span><span class="op">,</span> <span class="ty i">error</span><span class="b2">)</span> <span class="b1">{</span>
    <span class="kw i">if</span> <span class="pa">months</span> <span class="op">&lt;=</span> <span class="nu">0</span> <span class="b3">{</span>
        <span class="kw i">return</span> <span class="nu">0</span><span class="op">,</span> <span class="squiggle va">ErrBadPeriod</span>
    <span class="b3">}</span>
<span class="hl">    <span class="va">gross</span><span class="hint">float64</span> <span class="op">:=</span> <span class="pa">p</span><span class="op">.</span><span class="pr">Monthly</span> <span class="op">*</span> <span class="ty i">float64</span><span class="b3">(</span><span class="pa">p</span><span class="op">.</span><span class="pr">Seats</span> <span class="op">*</span> <span class="pa">months</span><span class="b3">)</span></span>
    <span class="kw i">return</span> <span class="ty">math</span><span class="op">.</span><span class="fn">Round</span><span class="b3">(</span><span class="va">gross</span><span class="op">*</span><span class="nu">100</span><span class="b3">)</span> <span class="op">/</span> <span class="nu">100</span><span class="op">,</span> <span class="nu i">nil</span>
<span class="b1">}</span>
<span class="ghost">    // returns cents, never a negative total</span>`;

const TERMINAL = `<span class="dot ok"></span><span class="tdim">~/billing $</span> go test ./...
<span class="tgreen">ok</span>  <span class="tdim">github.com/acme/billing</span>  <span class="tcyan">0.184s</span>
<span class="dot err"></span><span class="tdim">~/billing $</span> go vet ./...
<span class="tred">pricing.go:18:2</span> <span class="tyellow">unreachable code</span>`;

const FILES = [
  ['pricing.go', true],
  ['plan.go', false],
  ['invoice_test.go', false],
  ['README.md', false],
];

function windowMarkup(s) {
  const style = Object.entries(s.vars).map(([k, v]) => `${k}:${v}`).join(';');
  const files = FILES.map(([name, active]) =>
    `<li class="${active ? 'on' : ''}">${esc(name)}</li>`).join('');
  const dots = s.dots.map((d) =>
    `<i style="left:${(d.L * 100).toFixed(1)}%;background:${d.hex}" title="${d.role} · L ${d.L.toFixed(2)}"></i>`).join('');

  return `<section class="theme" id="${s.id}">
  <header class="meta">
    <div class="meta-head">
      <h2>${esc(s.label)}</h2>
      <span class="chip ${s.appearance}">${s.appearance}</span>
    </div>
    <p>${esc(s.description)}</p>
    <dl class="stats">
      <div><dt>Text contrast</dt><dd>${s.textContrast.toFixed(1)}<span class="unit">:1</span></dd></div>
      <div><dt>Lightness spread</dt><dd>${(s.spread * 100).toFixed(1)}<span class="unit">L</span></dd></div>
    </dl>
    <figure class="ruler">
      <div class="track">${dots}</div>
      <figcaption>Syntax hues on the OKLCH lightness scale — darker <span>0</span> to <span>1</span> lighter</figcaption>
    </figure>
  </header>

  <div class="window" style="${style}">
    <div class="titlebar">
      <span class="lights"><i></i><i></i><i></i></span>
      <span class="cc">billing — Plan.Total</span>
      <span class="tspace"></span>
    </div>
    <div class="body">
      <nav class="activity"><i class="on"></i><i></i><i></i><i></i><i></i></nav>
      <aside class="side">
        <p class="side-title">Explorer</p>
        <ul>${files}</ul>
      </aside>
      <div class="main">
        <div class="tabs">
          <span class="tab on">pricing.go</span>
          <span class="tab">plan.go</span>
        </div>
        <pre class="code"><span class="gutter">15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30</span><code>${CODE}</code></pre>
        <pre class="term"><code>${TERMINAL}</code></pre>
      </div>
    </div>
    <div class="statusbar">
      <span class="remote">SSH</span>
      <span>main*</span>
      <span>0 errors, 1 warning</span>
      <span class="push">Go 1.23</span>
      <span>UTF-8</span>
    </div>
  </div>
</section>`;
}

const nav = specs.map((s) => `<a href="#${s.id}">${esc(s.label.replace(/^Shades of Stoicism /, '').replace(/^Shades$/, 'Classic'))}</a>`).join('');

const html = `<title>Shades Specimen</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap">
<style>
:root {
  --page: #f4f3f7;
  --card: #ffffff;
  --ink: #17161d;
  --ink-2: #565266;
  --ink-3: #8b8699;
  --rule: #e2dfe9;
  --accent: #4b3bd1;
  --shadow: 0 1px 2px rgba(20,16,40,.06), 0 8px 24px -12px rgba(20,16,40,.18);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --page: #100f15;
    --card: #17161e;
    --ink: #eceaf3;
    --ink-2: #a5a0b5;
    --ink-3: #6f6a80;
    --rule: #272531;
    --accent: #a396ff;
    --shadow: 0 1px 2px rgba(0,0,0,.5), 0 10px 30px -14px rgba(0,0,0,.7);
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --page: #100f15;
  --card: #17161e;
  --ink: #eceaf3;
  --ink-2: #a5a0b5;
  --ink-3: #6f6a80;
  --rule: #272531;
  --accent: #a396ff;
  --shadow: 0 1px 2px rgba(0,0,0,.5), 0 10px 30px -14px rgba(0,0,0,.7);
  color-scheme: dark;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: Archivo, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1120px; margin: 0 auto; padding-inline: 16px; padding-block: 0 72px; }

/* --- Masthead ---------------------------------------------------------- */
.masthead { padding-block: 56px 28px; border-bottom: 1px solid var(--rule); }
.eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
  color: var(--accent); margin: 0 0 14px;
}
h1 {
  font-size: clamp(34px, 6vw, 58px); line-height: 1.02; letter-spacing: -.028em;
  font-weight: 700; margin: 0 0 18px; text-wrap: balance; max-width: 16ch;
}
.lede { font-size: clamp(16px, 2.1vw, 19px); color: var(--ink-2); margin: 0; max-width: 58ch; }
.claims { display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 26px 0 0; padding: 0; list-style: none; }
.claims li { font-size: 13.5px; color: var(--ink-2); display: flex; align-items: baseline; gap: 8px; }
.claims b { color: var(--ink); font-variant-numeric: tabular-nums; font-weight: 600; }

/* --- Sticky jump nav ---------------------------------------------------- */
.jump {
  position: sticky; top: env(safe-area-inset-top, 0px); z-index: 10;
  background: color-mix(in srgb, var(--page) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--rule);
  margin-inline: -16px; padding: 10px 16px;
  display: flex; gap: 4px; overflow-x: auto; scrollbar-width: thin;
}
.jump a {
  flex: 0 0 auto; color: var(--ink-2); text-decoration: none;
  font-size: 12.5px; font-weight: 500; padding: 5px 11px; border-radius: 999px;
  border: 1px solid transparent; white-space: nowrap;
}
.jump a:hover, .jump a:focus-visible { color: var(--ink); border-color: var(--rule); background: var(--card); }

/* --- Theme block -------------------------------------------------------- */
.theme { padding-block: 52px; border-bottom: 1px solid var(--rule); scroll-margin-top: 64px; }
.meta { display: grid; gap: 14px; margin-bottom: 24px; }
.meta-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.meta h2 { font-size: clamp(22px, 3.4vw, 30px); letter-spacing: -.02em; margin: 0; font-weight: 600; }
.chip {
  font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px; border: 1px solid var(--rule); color: var(--ink-3);
}
.meta p { margin: 0; color: var(--ink-2); max-width: 62ch; }
.stats { display: flex; gap: 30px; margin: 4px 0 0; }
.stats dt { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); margin: 0 0 2px; }
.stats dd { margin: 0; font-size: 21px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.stats .unit { font-size: 12px; color: var(--ink-3); font-weight: 500; margin-left: 2px; }

/* The proof: every dot should land on the same spot. */
.ruler { margin: 6px 0 0; }
.ruler .track {
  position: relative; height: 22px; border-radius: 3px;
  background: linear-gradient(90deg, #000 0%, #7d7d7d 50%, #fff 100%);
  border: 1px solid var(--rule);
}
.ruler i {
  position: absolute; top: 50%; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px;
  border-radius: 50%; box-shadow: 0 0 0 1.5px rgba(0,0,0,.45);
}
.ruler figcaption { font-size: 11.5px; color: var(--ink-3); margin-top: 7px; }
.ruler figcaption span { font-variant-numeric: tabular-nums; }

/* --- Editor mock -------------------------------------------------------- */
.window {
  border-radius: 10px; overflow: hidden; box-shadow: var(--shadow);
  border: 1px solid var(--rule);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--bg);
}
.titlebar {
  background: var(--title-bg); color: var(--title-fg);
  display: flex; align-items: center; gap: 12px; padding: 7px 12px; font-size: 11.5px;
}
.lights { display: flex; gap: 6px; }
.lights i { width: 10px; height: 10px; border-radius: 50%; background: currentColor; opacity: .32; }
.cc {
  flex: 0 1 300px; margin-inline: auto; text-align: center;
  background: var(--cc-bg); color: var(--cc-fg); border: 1px solid var(--cc-bd);
  border-radius: 6px; padding: 3px 12px; font-size: 11px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tspace { flex: 0 0 52px; }
.body { display: flex; min-height: 0; }
.activity { background: var(--act-bg); padding: 10px 8px; display: flex; flex-direction: column; gap: 14px; }
.activity i { width: 16px; height: 16px; border-radius: 3px; background: var(--act-off); opacity: .55; }
.activity i.on { background: var(--act-fg); opacity: 1; }
.side { background: var(--side-bg); color: var(--side-fg); width: 168px; padding: 10px 0; flex: 0 0 auto; }
.side-title {
  margin: 0 0 8px; padding-inline: 12px; font-size: 10px; letter-spacing: .12em;
  text-transform: uppercase; color: var(--side-title);
}
.side ul { list-style: none; margin: 0; padding: 0; font-size: 12px; }
.side li { padding: 3px 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.side li.on { background: var(--sel-bg); color: var(--sel-fg); }
.main { flex: 1 1 auto; min-width: 0; background: var(--bg); }
.tabs { background: var(--tabs-bg); display: flex; font-size: 12px; }
.tab { padding: 7px 14px; color: var(--tab-off); border-top: 2px solid transparent; }
.tab.on { background: var(--tab-bg); color: var(--tab-fg); border-top-color: var(--tab-top); }

.code, .term {
  margin: 0; padding: 12px 0 14px; font-size: 12.5px; line-height: 1.62;
  overflow-x: auto; color: var(--fg); background: var(--bg);
  display: flex; gap: 14px;
}
.code code, .term code { display: block; padding-right: 16px; }
.gutter {
  flex: 0 0 auto; padding-left: 14px; color: var(--line-no); text-align: right;
  white-space: pre; user-select: none; font-variant-numeric: tabular-nums;
}
.hl { display: inline-block; width: 100%; background: var(--line-hl); }
.kw { color: var(--kw); } .st { color: var(--st); } .fn { color: var(--fn); }
.ty { color: var(--ty); } .nu { color: var(--nu); } .pr { color: var(--pr); }
.op { color: var(--op); } .pa { color: var(--pa); } .va { color: var(--va); }
.cm { color: var(--cm); font-style: italic; }
.b1 { color: var(--brk1); } .b2 { color: var(--brk2); } .b3 { color: var(--brk3); }
.i { font-style: italic; } .b { font-weight: 700; }
.squiggle { text-decoration: underline wavy var(--er); text-underline-offset: 3px; }
.ghost { color: var(--ghost); }
.hint {
  color: var(--hint-fg); background: var(--hint-bg); border-radius: 3px;
  font-size: 10.5px; padding: 0 4px; margin: 0 3px;
}
.term { background: var(--term-bg); color: var(--term-fg); border-top: 1px solid rgba(127,127,127,.22); padding-left: 14px; }
.tdim { color: var(--ansi-dim); } .tgreen { color: var(--ansi-green); }
.tred { color: var(--ansi-red); } .tyellow { color: var(--ansi-yellow); } .tcyan { color: var(--ansi-cyan); }
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
.dot.ok { background: var(--ansi-green); } .dot.err { background: var(--ansi-red); }
.statusbar {
  background: var(--status-bg); color: var(--status-fg);
  display: flex; align-items: center; gap: 16px; padding: 4px 12px; font-size: 11px;
}
.statusbar .remote { background: var(--remote-bg); color: var(--remote-fg); padding: 1px 7px; border-radius: 3px; font-weight: 500; }
.statusbar .push { margin-left: auto; }

.outro { padding-block: 44px 0; color: var(--ink-2); max-width: 62ch; }
.outro h2 { font-size: 20px; margin: 0 0 12px; color: var(--ink); letter-spacing: -.015em; }
.outro code {
  font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12.5px;
  background: var(--card); border: 1px solid var(--rule); border-radius: 4px; padding: 1px 5px;
}

@media (max-width: 720px) {
  .side { display: none; }
  .stats { gap: 22px; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">VS Code · ten themes, one system</p>
    <h1>Shades, measured in daylight</h1>
    <p class="lede">
      Every theme below is generated from a palette of named roles, then audited before it
      ships. Each one is painted here with its real colors — the same JSON VS Code loads.
    </p>
    <ul class="claims">
      <li><b>${specs.length}</b> themes</li>
      <li><b>592</b> interface colors each</li>
      <li><b>4.5:1</b> contrast floor, enforced at build</li>
      <li><b>OKLCH</b> lightness harmonized</li>
    </ul>
  </header>

  <nav class="jump">${nav}</nav>

  ${specs.map(windowMarkup).join('\n')}

  <footer class="outro">
    <h2>Reading the lightness ruler</h2>
    <p>
      Each dot is one syntax color, placed by its perceived lightness. When the dots cluster,
      a line of code reads as a single band of text and your eye is pulled by meaning rather
      than by whichever token happens to be palest. The generated themes pin their hues to one
      target; the original <b>Shades</b> was tuned by hand, so its dots spread out — which is
      exactly the measurement the build now enforces.
    </p>
    <p>
      Add a palette to <code>tools/palettes.js</code> and run <code>npm run build:themes</code>
      to put a new theme through the same audit.
    </p>
  </footer>
</div>
`;

fs.writeFileSync(out, html);
console.log(`preview written to ${out} (${(html.length / 1024).toFixed(0)} KB, ${specs.length} themes)`);
