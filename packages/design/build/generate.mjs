#!/usr/bin/env node
/**
 * Naturalens design token generator.
 *
 * Reads packages/design/tokens.json and writes:
 *   apps/web/src/app/tokens.css
 *   apps/labeler/public/tokens.css
 *   apps/mobile/src/theme/tokens.ts
 *
 * Usage:
 *   node packages/design/build/generate.mjs
 *   node packages/design/build/generate.mjs --check
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");
const TOKENS_PATH = join(__dirname, "../tokens.json");
const CHECK = process.argv.includes("--check");

const WEIGHT_FAMILY = {
  Outfit: {
    200: "Outfit_200ExtraLight",
    300: "Outfit_300Light",
    400: "Outfit_400Regular",
    500: "Outfit_500Medium",
  },
  Archivo: {
    400: "Archivo_400Regular",
    500: "Archivo_500Medium",
    600: "Archivo_600SemiBold",
  },
};

function loadTokens() {
  return JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
}

function header(lang) {
  const src = "packages/design/tokens.json";
  if (lang === "css") {
    return `/* GENERATED — do not edit. Source: ${src}. Run: node packages/design/build/generate.mjs */\n`;
  }
  return `/** GENERATED — do not edit. Source: ${src}. Run: node packages/design/build/generate.mjs */\n`;
}

function emitWebCss(tokens) {
  const c = tokens.color.default;
  const inv = tokens.color.inverted;
  const sem = tokens.color.semantic || {};
  const s = tokens.space;
  const r = tokens.radius;
  const m = tokens.motion;
  const f = tokens.focus;

  const lines = [
    header("css"),
    `:root {`,
    `  --nl-bg: ${c.bg};`,
    `  --nl-fg: ${c.fg};`,
    `  --nl-muted: ${c.muted};`,
    `  --nl-caption: ${c.caption};`,
    `  --nl-border: ${c.border};`,
    `  --nl-surface: ${c.surface};`,
    ``,
    `  /* Status / overlay only — do not use for page chrome */`,
    `  --nl-success: ${sem.success};`,
    `  --nl-success-soft: ${sem.successSoft};`,
    `  --nl-success-border: ${sem.successBorder};`,
    `  --nl-warning: ${sem.warning};`,
    `  --nl-warning-soft: ${sem.warningSoft};`,
    `  --nl-warning-border: ${sem.warningBorder};`,
    `  --nl-danger: ${sem.danger};`,
    `  --nl-danger-soft: ${sem.dangerSoft};`,
    `  --nl-danger-border: ${sem.dangerBorder};`,
    ``,
    `  --nl-space-hairline: ${s.hairline}px;`,
    `  --nl-space-xs: ${s.xs}px;`,
    `  --nl-space-s: ${s.s}px;`,
    `  --nl-space-m: ${s.m}px;`,
    `  --nl-space-l: ${s.l}px;`,
    `  --nl-space-xl: ${s.xl}px;`,
    `  --nl-space-xxl: ${s.xxl}px;`,
    `  --nl-space-xxxl: ${s.xxxl}px;`,
    ``,
    `  --nl-radius-media: ${r.media}px;`,
    `  --nl-radius-input: ${r.input}px;`,
    `  --nl-radius-panel: ${r.panel}px;`,
    `  --nl-radius-cta: ${r.cta}px;`,
    ``,
    `  --nl-motion-enter: ${m.enter}ms;`,
    `  --nl-motion-state: ${m.state}ms;`,
    `  --nl-motion-stagger: ${m.stagger}ms;`,
    `  --nl-motion-rise: ${m.rise}px;`,
    `  --nl-ease: ${m.easing};`,
    ``,
    `  --nl-focus-width: ${f.width}px;`,
    `  --nl-focus-offset: ${f.offset}px;`,
    `}`,
    ``,
    `[data-theme="inverted"] {`,
    `  --nl-bg: ${inv.bg};`,
    `  --nl-fg: ${inv.fg};`,
    `  --nl-muted: ${inv.muted};`,
    `  --nl-caption: ${inv.caption};`,
    `  --nl-border: ${inv.border};`,
    `  --nl-surface: ${inv.surface};`,
    `}`,
    ``,
  ];

  for (const [name, style] of Object.entries(tokens.typography.ramp)) {
    const { min, max } = style.size;
    const clamp =
      min === max
        ? `${min}px`
        : `clamp(${min}px, ${((min + max) / 2 / 16).toFixed(3)}vw + ${min}px, ${max}px)`;
    lines.push(`:root { --nl-type-${name}-size: ${clamp}; }`);
  }
  lines.push("");

  return lines.join("\n");
}

function emitLabelerCss(tokens) {
  // Same CSS custom properties. Labeler uses light :root (landing polarity).
  // Legacy aliases keep app.css compiling during migration.
  const base = emitWebCss(tokens);
  const aliases = [
    `/* Legacy aliases — map old labeler names onto Volume One tokens */`,
    `:root, [data-theme="inverted"] {`,
    `  --ice: var(--nl-bg);`,
    `  --panel: var(--nl-surface);`,
    `  --panel-2: color-mix(in srgb, var(--nl-surface) 80%, var(--nl-fg) 8%);`,
    `  --line: color-mix(in srgb, var(--nl-fg) 12%, transparent);`,
    `  --mist: var(--nl-muted);`,
    `  --paper: var(--nl-fg);`,
    `  --shadow: none;`,
    `  --ok: var(--nl-success);`,
    `  --warn: var(--nl-warning);`,
    `  --danger: var(--nl-danger);`,
    `}`,
    ``,
  ];
  return base + aliases.join("\n");
}

function familyFor(tokens, familyKey, weight) {
  const name = tokens.typography.families[familyKey];
  const map = WEIGHT_FAMILY[name];
  if (!map || !map[weight]) {
    throw new Error(`No family mapping for ${name} weight ${weight}`);
  }
  return map[weight];
}

function emitMobileTs(tokens) {
  const c = tokens.color.default;
  const inv = tokens.color.inverted;
  const sem = tokens.color.semantic || {};
  const s = tokens.space;
  const r = tokens.radius;
  const m = tokens.motion;

  const familiesNeeded = new Set();
  const typographyEntries = [];

  for (const [name, style] of Object.entries(tokens.typography.ramp)) {
    const family = familyFor(tokens, style.family, style.weight);
    familiesNeeded.add(family);
    // Mobile uses the ramp floor — marketing max sizes are too large for phone UI.
    const size = style.size.min;
    const lineHeight = Math.round(size * style.lineHeight);
    const letterSpacingEm = style.letterSpacing || 0;
    const letterSpacing =
      letterSpacingEm !== 0
        ? `, letterSpacing: ${+(letterSpacingEm * size).toFixed(2)}`
        : "";
    const transform = style.transform
      ? `, textTransform: "${style.transform}" as const`
      : "";
    typographyEntries.push(
      `  ${name}: { fontFamily: "${family}", fontSize: ${size}, lineHeight: ${lineHeight}${letterSpacing}${transform} },`,
    );
  }

  const fontList = [...familiesNeeded].sort();

  // Product aliases so existing mobile screens keep compiling.
  typographyEntries.push(
    `  /** Alias — product screens used subtitle for 16px semibold */`,
    `  subtitle: { fontFamily: "${familyFor(tokens, "body", 600)}", fontSize: 16, lineHeight: 24 },`,
    `  /** Alias — product screens used caption for small body */`,
    `  caption: { fontFamily: "${familyFor(tokens, "body", 400)}", fontSize: 14, lineHeight: 20 },`,
  );
  familiesNeeded.add(familyFor(tokens, "body", 600));
  familiesNeeded.add(familyFor(tokens, "body", 400));

  const fontListFinal = [...familiesNeeded].sort();

  return [
    header("ts"),
    ``,
    `export const Colors = {`,
    `  bg: "${c.bg}",`,
    `  fg: "${c.fg}",`,
    `  muted: "${c.muted}",`,
    `  caption: "${c.caption}",`,
    `  border: "${c.border}",`,
    `  surface: "${c.surface}",`,
    `  /** @deprecated Use fg — kept so existing imports keep compiling during migration */`,
    `  primary: "${c.fg}",`,
    `  brand: "${c.fg}",`,
    `  background: "${c.bg}",`,
    `  cardBackground: "${c.surface}",`,
    `  splashBackground: "${c.bg}",`,
    `  textPrimary: "${c.fg}",`,
    `  textSecondary: "${c.muted}",`,
    `  white: "${c.bg}",`,
    `  error: "${c.fg}",`,
    `} as const;`,
    ``,
    `export const InvertedColors = {`,
    `  bg: "${inv.bg}",`,
    `  fg: "${inv.fg}",`,
    `  muted: "${inv.muted}",`,
    `  caption: "${inv.caption}",`,
    `  border: "${inv.border}",`,
    `  surface: "${inv.surface}",`,
    `} as const;`,
    ``,
    `/** Status / overlay only — do not use for page chrome */`,
    `export const SemanticColors = {`,
    `  success: "${sem.success}",`,
    `  successSoft: "${sem.successSoft}",`,
    `  successBorder: "${sem.successBorder}",`,
    `  warning: "${sem.warning}",`,
    `  warningSoft: "${sem.warningSoft}",`,
    `  warningBorder: "${sem.warningBorder}",`,
    `  danger: "${sem.danger}",`,
    `  dangerSoft: "${sem.dangerSoft}",`,
    `  dangerBorder: "${sem.dangerBorder}",`,
    `} as const;`,
    ``,
    `export const Spacing = {`,
    `  hairline: ${s.hairline},`,
    `  xs: ${s.hairline},`,
    `  s: ${s.xs},`,
    `  m: ${s.s},`,
    `  l: ${s.m},`,
    `  xl: ${s.l},`,
    `  xxl: ${s.xl},`,
    `  xxxl: ${s.xxl},`,
    `} as const;`,
    ``,
    `export const BorderRadii = {`,
    `  media: ${r.media},`,
    `  input: ${r.input},`,
    `  panel: ${r.panel},`,
    `  small: ${r.panel},`,
    `  medium: ${r.panel},`,
    `  large: ${r.panel},`,
    `  pill: ${r.cta},`,
    `} as const;`,
    ``,
    `export const Motion = {`,
    `  enter: ${m.enter},`,
    `  state: ${m.state},`,
    `  stagger: ${m.stagger},`,
    `  rise: ${m.rise},`,
    `  easing: "${m.easing}",`,
    `} as const;`,
    ``,
    `export const Typography = {`,
    ...typographyEntries,
    `} as const;`,
    ``,
    `/** Font families the type ramp names — pass these to useFonts. */`,
    `export const RequiredFontFamilies = [`,
    ...fontListFinal.map((f) => `  "${f}",`),
    `] as const;`,
    ``,
  ].join("\n");
}

function writeOrCheck(path, content) {
  const rel = relative(ROOT, path);
  if (CHECK) {
    if (!existsSync(path)) {
      console.error(`missing: ${rel}`);
      process.exitCode = 1;
      return;
    }
    const current = readFileSync(path, "utf8");
    if (current !== content) {
      console.error(`stale: ${rel}`);
      process.exitCode = 1;
      return;
    }
    console.log(`ok: ${rel}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${rel}`);
}

function main() {
  const tokens = loadTokens();
  const targets = [
    [join(ROOT, "apps/web/src/app/tokens.css"), emitWebCss(tokens)],
    [join(ROOT, "apps/labeler/public/tokens.css"), emitLabelerCss(tokens)],
    [join(ROOT, "apps/mobile/src/theme/tokens.ts"), emitMobileTs(tokens)],
  ];

  for (const [path, content] of targets) {
    writeOrCheck(path, content);
  }

  if (CHECK && process.exitCode) {
    console.error("\nToken outputs are stale. Run: node packages/design/build/generate.mjs");
    process.exit(1);
  }
}

main();
