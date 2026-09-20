// Color math helpers shared by the theme generator.
// sRGB in, sRGB out. Mixing happens in OKLab: mixing 10% white into a near-black
// in linear light jumps it to mid-grey, while in OKLab 10% means 10% to the eye.

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

function parse(hex) {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`Not a 6- or 8-digit hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

const toLinear = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (v) => {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return s * 255;
};

function mix(a, b, amount) {
  const x = toOklab(a);
  const y = toOklab(b);
  return fromOklab({
    L: x.L * (1 - amount) + y.L * amount,
    a: x.a * (1 - amount) + y.a * amount,
    b: x.b * (1 - amount) + y.b * amount,
  });
}

const lighten = (hex, amount) => mix(hex, '#ffffff', amount);
const darken = (hex, amount) => mix(hex, '#000000', amount);

function luminance(hex) {
  const { r, g, b } = parse(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Opaque preview of a translucent color over a backdrop, so contrast can be
// checked on what the eye actually receives rather than on the raw hex.
function flatten(hex, backdrop) {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`Not a hex color: ${hex}`);
  if (!m[2]) return toHex(parse(hex));
  return mix(backdrop, `#${m[1]}`, parseInt(m[2], 16) / 255);
}

// "#rrggbb" + 0..1 -> "#rrggbbaa"
function alpha(hex, a) {
  const v = Math.max(0, Math.min(255, Math.round(a * 255)));
  return `${toHex(parse(hex))}${v.toString(16).padStart(2, '0')}`;
}

// Nudge a foreground toward white (on dark) or black (on light) until it clears
// a contrast target against its background. Returns the original if already fine.
function ensureContrast(fg, bg, target, isDark) {
  if (contrast(fg, bg) >= target) return fg;
  const toward = isDark ? '#ffffff' : '#000000';
  let best = fg;
  for (let step = 0.02; step <= 1; step += 0.02) {
    best = mix(fg, toward, step);
    if (contrast(best, bg) >= target) return best;
  }
  return best;
}

// --- OKLab / OKLCH ---------------------------------------------------------
// HSL lightness lies: #0000ff and #ffff00 are both "50%" but nowhere near
// equally bright. OKLCH's L matches what the eye reports, which is what lets a
// palette hold every syntax hue at one perceived brightness.

function toOklab(hex) {
  const { r, g, b } = parse(hex);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function toOklch(hex) {
  const { L, a, b } = toOklab(hex);
  return {
    L,
    C: Math.hypot(a, b),
    h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}

function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

const inGamut = ({ r, g, b }) => [r, g, b].every((v) => v >= -0.5 && v <= 255.5);

// Walk chroma down until the color is representable in sRGB. Hue and lightness
// are the perceptual promises; saturation is the part that gets to give.
function fromOklab({ L, a, b }) {
  let rgb = oklabToRgb({ L, a, b });
  if (inGamut(rgb)) return toHex(rgb);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    rgb = oklabToRgb({ L, a: a * mid, b: b * mid });
    if (inGamut(rgb)) lo = mid;
    else hi = mid;
  }
  return toHex(oklabToRgb({ L, a: a * lo, b: b * lo }));
}

function fromOklch({ L, C, h }) {
  const hr = (h * Math.PI) / 180;
  return fromOklab({ L, a: C * Math.cos(hr), b: C * Math.sin(hr) });
}

// Re-pitch a color to a target perceptual lightness, keeping its hue.
function setLightness(hex, L) {
  const c = toOklch(hex);
  return fromOklch({ L, C: c.C, h: c.h });
}

// Smallest angle between two hues, in degrees (0-180).
function hueDistance(a, b) {
  const d = Math.abs(toOklch(a).h - toOklch(b).h) % 360;
  return d > 180 ? 360 - d : d;
}

module.exports = {
  parse, toHex, mix, lighten, darken, luminance, contrast, flatten, alpha, ensureContrast,
  toOklch, fromOklch, setLightness, hueDistance,
};
