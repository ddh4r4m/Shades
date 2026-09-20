#!/usr/bin/env node
// Generates every theme in the family from tools/palettes.js, audits each one
// for readability, and keeps package.json's theme list in sync.
//
//   node tools/build.js          build, audit, write
//   node tools/build.js --check  audit only, fail on problems, write nothing

const fs = require('fs');
const path = require('path');
const palettes = require('./palettes');
const { buildTheme, auditTheme, harmonize } = require('./build-theme');
const { contrast, toOklch } = require('./color');

const ROOT = path.join(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');
const checkOnly = process.argv.includes('--check');

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let failed = 0;
const generated = [];

for (const raw of palettes) {
  const palette = harmonize(raw);
  const theme = buildTheme(palette);
  const { problems, warnings } = auditTheme(theme, palette);

  const fgRatio = contrast(palette.fg, palette.bg).toFixed(2);
  const L = toOklch(palette.keyword).L.toFixed(2);
  const status = problems.length ? red('FAIL') : warnings.length ? yellow('warn') : green(' ok ');
  console.log(`${status} ${bold(palette.label.padEnd(29))} ${dim(`text ${fgRatio}:1 · syntax L ${L} · ${Object.keys(theme.colors).length} keys · ${theme.tokenColors.length} scopes`)}`);

  for (const problem of problems) console.log(`      ${red('x')} ${problem}`);
  for (const warning of warnings) console.log(`      ${yellow('!')} ${warning}`);
  if (problems.length) failed++;

  if (!checkOnly) {
    fs.writeFileSync(path.join(THEMES_DIR, palette.file), `${JSON.stringify(theme, null, 2)}\n`);
  }
  generated.push({ label: palette.label, uiTheme: palette.appearance === 'light' ? 'vs' : 'vs-dark', path: `./themes/${palette.file}` });
}

if (!checkOnly) {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const generatedPaths = new Set(generated.map((entry) => entry.path));
  const handWritten = (pkg.contributes.themes || []).filter((entry) => !generatedPaths.has(entry.path));
  pkg.contributes.themes = [...handWritten, ...generated];
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(dim(`\n${generated.length} themes written · package.json lists ${pkg.contributes.themes.length}`));
}

if (failed) {
  console.error(red(`\n${failed} theme(s) failed the readability audit.`));
  process.exit(1);
}
