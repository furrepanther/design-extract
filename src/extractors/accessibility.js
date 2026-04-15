import { parseColor, rgbToHex } from '../utils.js';

// WCAG 2.1 relative luminance
function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagLevel(ratio, isLargeText) {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'FAIL';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'FAIL';
}

export function extractAccessibility(computedStyles) {
  const pairs = new Map(); // "fg|bg" -> { fg, bg, count, elements }

  for (const el of computedStyles) {
    const fg = parseColor(el.color);
    const bg = parseColor(el.backgroundColor);
    if (!fg || !bg || bg.a === 0) continue;

    const fgHex = rgbToHex(fg);
    const bgHex = rgbToHex(bg);
    const key = `${fgHex}|${bgHex}`;

    if (!pairs.has(key)) {
      pairs.set(key, { fg, bg, fgHex, bgHex, count: 0, tags: new Set(), fontSize: null });
    }
    const pair = pairs.get(key);
    pair.count++;
    pair.tags.add(el.tag);
    // Track font size for large text determination
    const size = parseFloat(el.fontSize);
    if (!pair.fontSize || size > pair.fontSize) pair.fontSize = size;
  }

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const [, pair] of pairs) {
    if (pair.fgHex === pair.bgHex) continue; // skip same color pairs
    const ratio = contrastRatio(pair.fg, pair.bg);
    const isLargeText = pair.fontSize >= 18 || (pair.fontSize >= 14 && pair.tags.has('b'));
    const level = wcagLevel(ratio, isLargeText);

    if (level === 'FAIL') failCount += pair.count;
    else passCount += pair.count;

    results.push({
      foreground: pair.fgHex,
      background: pair.bgHex,
      ratio: Math.round(ratio * 100) / 100,
      level,
      isLargeText,
      count: pair.count,
      elements: [...pair.tags].slice(0, 5),
    });
  }

  // Sort: failures first, then by count
  results.sort((a, b) => {
    if (a.level === 'FAIL' && b.level !== 'FAIL') return -1;
    if (b.level === 'FAIL' && a.level !== 'FAIL') return 1;
    return b.count - a.count;
  });

  const total = passCount + failCount;
  const score = total > 0 ? Math.round((passCount / total) * 100) : 100;

  return {
    score,
    passCount,
    failCount,
    totalPairs: results.length,
    pairs: results.slice(0, 50), // top 50 pairs
  };
}
