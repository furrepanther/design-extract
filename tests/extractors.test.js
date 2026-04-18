import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractColors } from '../src/extractors/colors.js';
import { extractTypography } from '../src/extractors/typography.js';
import { extractSpacing } from '../src/extractors/spacing.js';
import { extractShadows } from '../src/extractors/shadows.js';
import { extractBorders } from '../src/extractors/borders.js';
import { extractComponents } from '../src/extractors/components.js';
import { extractAccessibility } from '../src/extractors/accessibility.js';
import { extractLayout } from '../src/extractors/layout.js';
import { extractGradients } from '../src/extractors/gradients.js';
import { extractZIndex } from '../src/extractors/zindex.js';
import { scoreDesignSystem } from '../src/extractors/scoring.js';
import { extractStackFingerprint } from '../src/extractors/stack-fingerprint.js';
import { extractCssHealth } from '../src/extractors/css-health.js';
import { remediateFailingPairs } from '../src/extractors/a11y-remediation.js';
import { extractSemanticRegions } from '../src/extractors/semantic-regions.js';
import { clusterComponents } from '../src/extractors/component-clusters.js';

// ── Shared fixture defaults ─────────────────────────────────────

function makeEl(overrides = {}) {
  return {
    tag: 'div',
    classList: '',
    role: '',
    area: 10000,
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
    backgroundImage: 'none',
    borderColor: 'rgb(200, 200, 200)',
    fontFamily: '"Inter", sans-serif',
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: 'normal',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    gap: '0px',
    borderRadius: '0px',
    boxShadow: 'none',
    zIndex: 'auto',
    transition: 'none',
    animation: 'none',
    display: 'block',
    position: 'static',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'normal',
    alignItems: 'normal',
    gridTemplateColumns: 'none',
    gridTemplateRows: 'none',
    maxWidth: 'none',
    borderWidth: '0px',
    borderStyle: 'none',
    ...overrides,
  };
}

// ── extractColors ───────────────────────────────────────────────

describe('extractColors', () => {
  const mockStyles = [
    makeEl({ tag: 'body', area: 200000, color: 'rgb(51, 51, 51)', backgroundColor: 'rgb(255, 255, 255)' }),
    makeEl({ tag: 'h1', color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)' }),
    makeEl({ tag: 'a', classList: 'btn', role: 'button', area: 5000, color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(0, 102, 204)' }),
    makeEl({ tag: 'a', classList: 'btn', role: 'button', area: 5000, color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(0, 102, 204)' }),
    makeEl({ tag: 'a', classList: 'btn', role: 'button', area: 5000, color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(0, 102, 204)' }),
    makeEl({ tag: 'span', color: 'rgb(200, 50, 50)', backgroundColor: 'rgba(0, 0, 0, 0)' }),
    makeEl({ tag: 'span', color: 'rgb(200, 50, 50)', backgroundColor: 'rgba(0, 0, 0, 0)' }),
    makeEl({ tag: 'p', color: 'rgb(102, 102, 102)', backgroundColor: 'rgb(255, 255, 255)' }),
    makeEl({ tag: 'div', area: 100000, backgroundColor: 'rgb(245, 245, 245)', color: 'rgb(0, 0, 0)' }),
    makeEl({ tag: 'footer', area: 80000, backgroundColor: 'rgb(34, 34, 34)', color: 'rgb(200, 200, 200)' }),
  ];

  it('returns an object with expected keys', () => {
    const colors = extractColors(mockStyles);
    assert.ok('primary' in colors);
    assert.ok('secondary' in colors);
    assert.ok('accent' in colors);
    assert.ok('neutrals' in colors);
    assert.ok('backgrounds' in colors);
    assert.ok('text' in colors);
    assert.ok('gradients' in colors);
    assert.ok('all' in colors);
  });

  it('detects a primary chromatic color', () => {
    const colors = extractColors(mockStyles);
    assert.ok(colors.primary);
    assert.ok(colors.primary.hex);
    assert.ok(colors.primary.rgb);
    assert.ok(colors.primary.hsl);
  });

  it('identifies background colors from large-area elements', () => {
    const colors = extractColors(mockStyles);
    assert.ok(colors.backgrounds.length > 0);
    assert.ok(colors.backgrounds.includes('#ffffff'));
  });

  it('identifies text colors', () => {
    const colors = extractColors(mockStyles);
    assert.ok(colors.text.length > 0);
  });

  it('detects neutrals (unsaturated colors)', () => {
    const colors = extractColors(mockStyles);
    assert.ok(colors.neutrals.length > 0);
  });

  it('all colors have hex, rgb, hsl, count, contexts', () => {
    const colors = extractColors(mockStyles);
    for (const c of colors.all) {
      assert.ok(c.hex);
      assert.ok(c.rgb);
      assert.ok(c.hsl);
      assert.ok(typeof c.count === 'number');
      assert.ok(Array.isArray(c.contexts));
    }
  });

  it('collects gradients from backgroundImage', () => {
    const styles = [
      makeEl({ backgroundImage: 'linear-gradient(to right, #ff0000, #0000ff)' }),
      makeEl(),
    ];
    const colors = extractColors(styles);
    assert.equal(colors.gradients.length, 1);
  });
});

// ── extractTypography ───────────────────────────────────────────

describe('extractTypography', () => {
  const mockStyles = [
    makeEl({ tag: 'h1', fontFamily: '"Playfair Display", serif', fontSize: '48px', fontWeight: '700', lineHeight: '1.2', letterSpacing: '-0.02em' }),
    makeEl({ tag: 'h2', fontFamily: '"Playfair Display", serif', fontSize: '36px', fontWeight: '700', lineHeight: '1.3', letterSpacing: 'normal' }),
    makeEl({ tag: 'h3', fontFamily: '"Inter", sans-serif', fontSize: '24px', fontWeight: '600', lineHeight: '1.4', letterSpacing: 'normal' }),
    makeEl({ tag: 'p', fontFamily: '"Inter", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: 'normal' }),
    makeEl({ tag: 'p', fontFamily: '"Inter", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: 'normal' }),
    makeEl({ tag: 'p', fontFamily: '"Inter", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: 'normal' }),
    makeEl({ tag: 'span', fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '1.5', letterSpacing: 'normal' }),
    makeEl({ tag: 'li', fontFamily: '"Inter", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', letterSpacing: 'normal' }),
    makeEl({ tag: 'strong', fontFamily: '"Inter", sans-serif', fontSize: '16px', fontWeight: '700', lineHeight: '1.5', letterSpacing: 'normal' }),
  ];

  it('returns expected keys', () => {
    const typo = extractTypography(mockStyles);
    assert.ok('families' in typo);
    assert.ok('scale' in typo);
    assert.ok('headings' in typo);
    assert.ok('body' in typo);
    assert.ok('weights' in typo);
  });

  it('detects font families sorted by usage', () => {
    const typo = extractTypography(mockStyles);
    assert.ok(typo.families.length >= 2);
    // Inter is most used
    assert.equal(typo.families[0].name, 'Inter');
  });

  it('builds a type scale from unique sizes', () => {
    const typo = extractTypography(mockStyles);
    assert.ok(typo.scale.length >= 3);
    // Scale should be sorted descending by size
    for (let i = 1; i < typo.scale.length; i++) {
      assert.ok(typo.scale[i - 1].size >= typo.scale[i].size);
    }
  });

  it('identifies heading sizes from h1-h6 tags', () => {
    const typo = extractTypography(mockStyles);
    assert.ok(typo.headings.length >= 2);
    assert.ok(typo.headings.some(h => h.tags.includes('h1')));
  });

  it('identifies body text', () => {
    const typo = extractTypography(mockStyles);
    assert.ok(typo.body);
    assert.equal(typo.body.size, 16);
  });

  it('counts font weights', () => {
    const typo = extractTypography(mockStyles);
    assert.ok(typo.weights.length >= 2);
    assert.ok(typo.weights.some(w => w.weight === '400'));
    assert.ok(typo.weights.some(w => w.weight === '700'));
  });
});

// ── extractSpacing ──────────────────────────────────────────────

describe('extractSpacing', () => {
  const mockStyles = [
    makeEl({ paddingTop: '4px', paddingRight: '8px', paddingBottom: '4px', paddingLeft: '8px' }),
    makeEl({ paddingTop: '16px', paddingRight: '16px', marginBottom: '24px' }),
    makeEl({ paddingTop: '8px', paddingRight: '12px', gap: '16px' }),
    makeEl({ marginTop: '32px', marginBottom: '32px' }),
    makeEl({ paddingTop: '48px', paddingBottom: '48px' }),
    makeEl({ paddingTop: '64px' }),
  ];

  it('returns expected keys', () => {
    const spacing = extractSpacing(mockStyles);
    assert.ok('base' in spacing);
    assert.ok('scale' in spacing);
    assert.ok('tokens' in spacing);
    assert.ok('raw' in spacing);
  });

  it('detects a base unit', () => {
    const spacing = extractSpacing(mockStyles);
    // The algorithm picks the best-scoring candidate from [2,4,6,8];
    // since all values are divisible by 2, base may be 2, 4, or another factor.
    assert.ok(spacing.base !== null);
    assert.ok([2, 4, 8].includes(spacing.base));
  });

  it('raw values are sorted ascending', () => {
    const spacing = extractSpacing(mockStyles);
    for (let i = 1; i < spacing.raw.length; i++) {
      assert.ok(spacing.raw[i] >= spacing.raw[i - 1]);
    }
  });

  it('generates tokens object', () => {
    const spacing = extractSpacing(mockStyles);
    assert.ok(Object.keys(spacing.tokens).length > 0);
  });
});

// ── extractShadows ──────────────────────────────────────────────

describe('extractShadows', () => {
  const mockStyles = [
    makeEl({ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }),
    makeEl({ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }),
    makeEl({ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }),
    makeEl({ boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }),
    makeEl({ boxShadow: 'none' }),
    makeEl(),
  ];

  it('returns an object with values array', () => {
    const shadows = extractShadows(mockStyles);
    assert.ok(Array.isArray(shadows.values));
  });

  it('extracts unique shadows', () => {
    const shadows = extractShadows(mockStyles);
    assert.equal(shadows.values.length, 4);
  });

  it('classifies shadow sizes', () => {
    const shadows = extractShadows(mockStyles);
    const labels = shadows.values.map(s => s.label);
    assert.ok(labels.includes('sm'));
    assert.ok(labels.includes('lg') || labels.includes('xl'));
  });

  it('detects inset shadows', () => {
    const shadows = extractShadows(mockStyles);
    assert.ok(shadows.values.some(s => s.inset));
  });

  it('sorts by blur ascending', () => {
    const shadows = extractShadows(mockStyles);
    for (let i = 1; i < shadows.values.length; i++) {
      assert.ok(shadows.values[i].blur >= shadows.values[i - 1].blur);
    }
  });
});

// ── extractBorders ──────────────────────────────────────────────

describe('extractBorders', () => {
  const mockStyles = [
    makeEl({ borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid' }),
    makeEl({ borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid' }),
    makeEl({ borderRadius: '4px', borderWidth: '1px', borderStyle: 'solid' }),
    makeEl({ borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid' }),
    makeEl({ borderRadius: '8px', borderWidth: '2px', borderStyle: 'solid' }),
    makeEl({ borderRadius: '16px', borderStyle: 'dashed', borderWidth: '1px' }),
    makeEl({ borderRadius: '9999px' }),
    makeEl({ borderRadius: '0px' }),
  ];

  it('returns expected keys', () => {
    const borders = extractBorders(mockStyles);
    assert.ok('radii' in borders);
    assert.ok('widths' in borders);
    assert.ok('styles' in borders);
  });

  it('extracts unique border radii', () => {
    const borders = extractBorders(mockStyles);
    assert.ok(borders.radii.length >= 3);
  });

  it('labels border radii', () => {
    const borders = extractBorders(mockStyles);
    for (const r of borders.radii) {
      assert.ok(r.label);
      assert.ok(r.value > 0);
      assert.ok(typeof r.count === 'number');
    }
  });

  it('extracts border widths', () => {
    const borders = extractBorders(mockStyles);
    assert.ok(borders.widths.length >= 1);
    assert.ok(borders.widths.includes(1));
  });

  it('extracts border styles', () => {
    const borders = extractBorders(mockStyles);
    assert.ok(borders.styles.includes('solid'));
    assert.ok(borders.styles.includes('dashed'));
  });
});

// ── extractComponents ───────────────────────────────────────────

describe('extractComponents', () => {
  const mockStyles = [
    makeEl({ tag: 'button', role: 'button', area: 3000, backgroundColor: 'rgb(0, 102, 204)', color: 'rgb(255, 255, 255)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', paddingTop: '10px', paddingRight: '20px' }),
    makeEl({ tag: 'button', role: 'button', area: 3000, backgroundColor: 'rgb(0, 102, 204)', color: 'rgb(255, 255, 255)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', paddingTop: '10px', paddingRight: '20px' }),
    makeEl({ tag: 'a', classList: 'btn-secondary', role: 'button', area: 2500, backgroundColor: 'rgb(240, 240, 240)', color: 'rgb(0, 0, 0)', fontSize: '14px', fontWeight: '500', borderRadius: '8px', paddingTop: '10px', paddingRight: '20px' }),
    makeEl({ tag: 'input', area: 2000, backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', borderColor: 'rgb(200, 200, 200)', borderRadius: '4px', fontSize: '14px', paddingTop: '8px', paddingRight: '12px' }),
    makeEl({ tag: 'input', area: 2000, backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)', borderColor: 'rgb(200, 200, 200)', borderRadius: '4px', fontSize: '14px', paddingTop: '8px', paddingRight: '12px' }),
    makeEl({ tag: 'a', area: 500, color: 'rgb(0, 102, 204)', fontSize: '16px', fontWeight: '400' }),
    makeEl({ tag: 'a', area: 500, color: 'rgb(0, 102, 204)', fontSize: '16px', fontWeight: '400' }),
    makeEl({ tag: 'nav', role: 'navigation', area: 50000, backgroundColor: 'rgb(255, 255, 255)', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px', position: 'sticky', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }),
    makeEl({ tag: 'div', classList: 'card', area: 20000, backgroundColor: 'rgb(255, 255, 255)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', paddingTop: '24px', paddingRight: '24px' }),
  ];

  it('detects buttons', () => {
    const components = extractComponents(mockStyles);
    assert.ok(components.buttons);
    assert.ok(components.buttons.count >= 2);
    assert.ok(components.buttons.baseStyle);
  });

  it('detects inputs', () => {
    const components = extractComponents(mockStyles);
    assert.ok(components.inputs);
    assert.equal(components.inputs.count, 2);
  });

  it('detects links', () => {
    const components = extractComponents(mockStyles);
    assert.ok(components.links);
  });

  it('detects navigation', () => {
    const components = extractComponents(mockStyles);
    assert.ok(components.navigation);
  });

  it('detects cards', () => {
    const components = extractComponents(mockStyles);
    assert.ok(components.cards);
  });

  it('generates CSS for detected components', () => {
    const components = extractComponents(mockStyles);
    // At least buttons should have CSS
    assert.ok(components.buttons.css);
    assert.ok(components.buttons.css.includes('{'));
  });
});

// ── extractAccessibility ────────────────────────────────────────

describe('extractAccessibility', () => {
  const mockStyles = [
    // Good contrast: black on white
    makeEl({ tag: 'p', color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)', fontSize: '16px' }),
    makeEl({ tag: 'p', color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)', fontSize: '16px' }),
    makeEl({ tag: 'p', color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)', fontSize: '16px' }),
    // Good contrast: white on dark blue
    makeEl({ tag: 'a', color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(0, 51, 153)', fontSize: '14px' }),
    makeEl({ tag: 'a', color: 'rgb(255, 255, 255)', backgroundColor: 'rgb(0, 51, 153)', fontSize: '14px' }),
    // Bad contrast: light gray on white
    makeEl({ tag: 'span', color: 'rgb(200, 200, 200)', backgroundColor: 'rgb(255, 255, 255)', fontSize: '12px' }),
    makeEl({ tag: 'span', color: 'rgb(200, 200, 200)', backgroundColor: 'rgb(255, 255, 255)', fontSize: '12px' }),
    // Transparent bg should be skipped
    makeEl({ tag: 'div', color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', fontSize: '16px' }),
  ];

  it('returns expected keys', () => {
    const a11y = extractAccessibility(mockStyles);
    assert.ok('score' in a11y);
    assert.ok('passCount' in a11y);
    assert.ok('failCount' in a11y);
    assert.ok('totalPairs' in a11y);
    assert.ok('pairs' in a11y);
  });

  it('detects passing pairs', () => {
    const a11y = extractAccessibility(mockStyles);
    assert.ok(a11y.passCount > 0);
  });

  it('detects failing pairs', () => {
    const a11y = extractAccessibility(mockStyles);
    assert.ok(a11y.failCount > 0);
  });

  it('score is between 0 and 100', () => {
    const a11y = extractAccessibility(mockStyles);
    assert.ok(a11y.score >= 0 && a11y.score <= 100);
  });

  it('sorts failures first', () => {
    const a11y = extractAccessibility(mockStyles);
    if (a11y.pairs.length >= 2) {
      const firstFail = a11y.pairs.findIndex(p => p.level === 'FAIL');
      const firstPass = a11y.pairs.findIndex(p => p.level !== 'FAIL');
      if (firstFail >= 0 && firstPass >= 0) {
        assert.ok(firstFail < firstPass);
      }
    }
  });

  it('each pair has ratio and level', () => {
    const a11y = extractAccessibility(mockStyles);
    for (const p of a11y.pairs) {
      assert.ok(typeof p.ratio === 'number');
      assert.ok(['AA', 'AAA', 'FAIL'].includes(p.level));
    }
  });
});

// ── extractLayout ───────────────────────────────────────────────

describe('extractLayout', () => {
  const mockStyles = [
    makeEl({ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto', gap: '24px', area: 80000 }),
    makeEl({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', area: 40000 }),
    makeEl({ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', area: 50000 }),
    makeEl({ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', area: 30000 }),
    makeEl({ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', area: 60000 }),
    makeEl({ tag: 'main', area: 200000, maxWidth: '1200px', paddingLeft: '24px', paddingRight: '24px' }),
  ];

  it('returns expected keys', () => {
    const layout = extractLayout(mockStyles);
    assert.ok('gridCount' in layout);
    assert.ok('flexCount' in layout);
    assert.ok('gridColumns' in layout);
    assert.ok('flexDirections' in layout);
    assert.ok('containerWidths' in layout);
    assert.ok('gaps' in layout);
    assert.ok('topGrids' in layout);
    assert.ok('topFlex' in layout);
  });

  it('counts grid and flex containers', () => {
    const layout = extractLayout(mockStyles);
    assert.equal(layout.gridCount, 2);
    assert.equal(layout.flexCount, 3);
  });

  it('detects grid column patterns', () => {
    const layout = extractLayout(mockStyles);
    assert.ok(layout.gridColumns.length >= 1);
    assert.ok(layout.gridColumns.some(g => g.columns === 3));
  });

  it('summarizes flex directions', () => {
    const layout = extractLayout(mockStyles);
    assert.ok(layout.flexDirections['row/nowrap'] >= 1);
    assert.ok(layout.flexDirections['column/nowrap'] >= 1);
  });

  it('collects gap values', () => {
    const layout = extractLayout(mockStyles);
    assert.ok(layout.gaps.length >= 1);
  });

  it('detects container widths', () => {
    const layout = extractLayout(mockStyles);
    assert.ok(layout.containerWidths.length >= 1);
    assert.ok(layout.containerWidths.some(c => c.maxWidth === '1200px'));
  });
});

// ── extractGradients ────────────────────────────────────────────

describe('extractGradients', () => {
  const mockStyles = [
    makeEl({ backgroundImage: 'linear-gradient(to right, #ff0000, #0000ff)' }),
    makeEl({ backgroundImage: 'radial-gradient(circle, #ff0000, #00ff00, #0000ff)' }),
    makeEl({ backgroundImage: 'linear-gradient(135deg, #ff0000 0%, #ff7700 50%, #ffff00 100%)' }),
    makeEl({ backgroundImage: 'none' }),
    makeEl({ backgroundImage: '' }),
    // Duplicate should not be counted twice
    makeEl({ backgroundImage: 'linear-gradient(to right, #ff0000, #0000ff)' }),
  ];

  it('returns expected keys', () => {
    const result = extractGradients(mockStyles);
    assert.ok('gradients' in result);
    assert.ok('count' in result);
  });

  it('counts unique gradients', () => {
    const result = extractGradients(mockStyles);
    assert.equal(result.count, 3);
  });

  it('parses gradient type', () => {
    const result = extractGradients(mockStyles);
    assert.ok(result.gradients.some(g => g.type === 'linear'));
    assert.ok(result.gradients.some(g => g.type === 'radial'));
  });

  it('parses gradient stops', () => {
    const result = extractGradients(mockStyles);
    for (const g of result.gradients) {
      assert.ok(Array.isArray(g.stops));
      assert.ok(g.stops.length >= 2);
    }
  });

  it('classifies gradients', () => {
    const result = extractGradients(mockStyles);
    for (const g of result.gradients) {
      assert.ok(['subtle', 'brand', 'bold', 'complex'].includes(g.classification));
    }
  });
});

// ── extractZIndex ───────────────────────────────────────────────

describe('extractZIndex', () => {
  const mockStyles = [
    makeEl({ tag: 'header', classList: 'navbar', zIndex: '100', position: 'sticky' }),
    makeEl({ tag: 'div', classList: 'modal', zIndex: '1000', position: 'fixed' }),
    makeEl({ tag: 'div', classList: 'dropdown', zIndex: '200', position: 'absolute' }),
    makeEl({ tag: 'div', classList: 'tooltip', zIndex: '500', position: 'absolute' }),
    makeEl({ zIndex: 'auto' }),
    makeEl({ tag: 'div', zIndex: '1' }),
  ];

  it('returns expected keys', () => {
    const result = extractZIndex(mockStyles);
    assert.ok('layers' in result);
    assert.ok('allValues' in result);
    assert.ok('issues' in result);
    assert.ok('scale' in result);
  });

  it('collects sorted unique z-index values', () => {
    const result = extractZIndex(mockStyles);
    assert.ok(result.allValues.length >= 4);
    for (let i = 1; i < result.allValues.length; i++) {
      assert.ok(result.allValues[i] >= result.allValues[i - 1]);
    }
  });

  it('groups values into layers', () => {
    const result = extractZIndex(mockStyles);
    assert.ok(result.layers.length >= 1);
    assert.ok(result.layers.some(l => l.name === 'modal'));
    assert.ok(result.layers.some(l => l.name === 'dropdown'));
  });

  it('skips auto z-index values', () => {
    const result = extractZIndex(mockStyles);
    assert.ok(!result.allValues.includes(NaN));
  });
});

// ── scoreDesignSystem ───────────────────────────────────────────

describe('scoreDesignSystem', () => {
  const mockDesign = {
    colors: {
      primary: { hex: '#0066cc', rgb: { r: 0, g: 102, b: 204 }, hsl: { h: 210, s: 100, l: 40 }, count: 50 },
      secondary: null,
      accent: null,
      neutrals: [{ hex: '#333333', rgb: { r: 51, g: 51, b: 51 }, hsl: { h: 0, s: 0, l: 20 }, count: 30 }],
      backgrounds: ['#ffffff'],
      text: ['#333333'],
      all: [
        { hex: '#0066cc', count: 50 },
        { hex: '#333333', count: 30 },
        { hex: '#ffffff', count: 80 },
        { hex: '#666666', count: 20 },
        { hex: '#f5f5f5', count: 15 },
      ],
    },
    typography: {
      families: [{ name: 'Inter', count: 80, usage: 'all' }],
      scale: [
        { size: 48, weight: '700', lineHeight: '1.2', tags: ['h1'], count: 5 },
        { size: 16, weight: '400', lineHeight: '1.5', tags: ['p'], count: 60 },
      ],
      weights: [{ weight: '400', count: 60 }, { weight: '700', count: 20 }],
    },
    spacing: { base: 4, scale: [4, 8, 12, 16, 24, 32, 48, 64] },
    shadows: { values: [{ raw: '0 1px 3px rgba(0,0,0,0.1)', blur: 3, inset: false, label: 'sm' }] },
    borders: { radii: [{ value: 4, label: 'sm', count: 20 }, { value: 8, label: 'md', count: 15 }] },
    variables: { colors: { '--color-primary': '#0066cc' }, spacing: {}, typography: {} },
    accessibility: { score: 90, passCount: 45, failCount: 5, totalPairs: 50, pairs: [] },
  };

  it('returns expected keys', () => {
    const result = scoreDesignSystem(mockDesign);
    assert.ok('overall' in result);
    assert.ok('grade' in result);
    assert.ok('scores' in result);
    assert.ok('issues' in result);
    assert.ok('strengths' in result);
  });

  it('overall score is between 0 and 100', () => {
    const result = scoreDesignSystem(mockDesign);
    assert.ok(result.overall >= 0 && result.overall <= 100);
  });

  it('assigns a letter grade', () => {
    const result = scoreDesignSystem(mockDesign);
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(result.grade));
  });

  it('scores each category', () => {
    const result = scoreDesignSystem(mockDesign);
    assert.ok('colorDiscipline' in result.scores);
    assert.ok('typographyConsistency' in result.scores);
    assert.ok('spacingSystem' in result.scores);
    assert.ok('shadowConsistency' in result.scores);
    assert.ok('radiusConsistency' in result.scores);
    assert.ok('accessibility' in result.scores);
    assert.ok('tokenization' in result.scores);
  });

  it('gives good scores for a clean design', () => {
    const result = scoreDesignSystem(mockDesign);
    // This mock has tight palette, 1 font, base-4 spacing
    assert.ok(result.scores.colorDiscipline >= 80);
    assert.ok(result.scores.typographyConsistency >= 80);
    assert.ok(result.scores.spacingSystem >= 80);
  });

  it('identifies strengths', () => {
    const result = scoreDesignSystem(mockDesign);
    assert.ok(Array.isArray(result.strengths));
  });

  it('penalizes missing primary color', () => {
    const noPrimary = { ...mockDesign, colors: { ...mockDesign.colors, primary: null } };
    const result = scoreDesignSystem(noPrimary);
    assert.ok(result.issues.some(i => i.includes('primary')));
  });
});

// ── extractStackFingerprint ─────────────────────────────────────

describe('extractStackFingerprint', () => {
  it('detects Next.js from __NEXT_DATA__', () => {
    const out = extractStackFingerprint({ windowGlobals: ['__NEXT_DATA__'], scripts: [], metas: [], classNameSample: [] });
    assert.equal(out.framework, 'next');
  });

  it('detects Tailwind from utility-heavy classNames', () => {
    const out = extractStackFingerprint({
      windowGlobals: [],
      scripts: [],
      metas: [],
      classNameSample: [
        'flex items-center gap-4 text-sm text-gray-600',
        'px-4 py-2 rounded-md bg-blue-500',
        'grid grid-cols-3 md:grid-cols-4',
        'flex justify-center',
        'p-4 shadow-md',
        'mt-4 text-lg',
      ],
    });
    assert.equal(out.css.layer, 'tailwind');
    assert.ok(out.css.tailwind.utilities.length > 0);
  });

  it('returns unknown when nothing matches', () => {
    const out = extractStackFingerprint({ windowGlobals: [], scripts: [], metas: [], classNameSample: ['foo', 'bar'] });
    assert.equal(out.framework, 'unknown');
    assert.equal(out.css.layer, 'unknown');
  });
});

// ── extractCssHealth ────────────────────────────────────────────

describe('extractCssHealth', () => {
  const payload = [{
    url: 'https://x.com/a.css',
    text: '.a{color:red}.a{color:red}.b{color:blue !important}.c-webkit-foo{color:x}@keyframes fade{0%{opacity:0}100%{opacity:1}\n}',
    totalBytes: 1000,
    ranges: [{ start: 0, end: 400 }], // 60% unused
  }];

  it('counts !important', () => {
    const r = extractCssHealth(payload);
    assert.equal(r.importantCount, 1);
  });

  it('counts duplicate declarations', () => {
    const r = extractCssHealth(payload);
    assert.ok(r.duplicates >= 1);
  });

  it('reports unused bytes', () => {
    const r = extractCssHealth(payload);
    assert.equal(r.unusedBytes, 600);
    assert.equal(r.usedBytes, 400);
  });

  it('catalogs keyframes', () => {
    const r = extractCssHealth(payload);
    assert.ok(r.keyframes.some(k => k.name === 'fade'));
  });
});

// ── remediateFailingPairs ───────────────────────────────────────

describe('remediateFailingPairs', () => {
  it('suggests a palette color that passes AA', () => {
    const failing = [{ fg: '#777777', bg: '#ffffff', ratio: 3.5, rule: 'AA-normal' }];
    const palette = ['#000000', '#222222', '#555555', '#cccccc'];
    const out = remediateFailingPairs(failing, palette);
    assert.equal(out.length, 1);
    assert.ok(out[0].suggestion);
    assert.ok(out[0].suggestion.newRatio >= 4.5);
  });

  it('returns null suggestion when no palette color passes', () => {
    const failing = [{ fg: '#eee', bg: '#fff', ratio: 1.1, rule: 'AA-normal' }];
    const palette = ['#dedede'];
    const out = remediateFailingPairs(failing, palette);
    assert.equal(out[0].suggestion, null);
  });
});

// ── extractSemanticRegions ──────────────────────────────────────

describe('extractSemanticRegions', () => {
  it('labels header as nav', () => {
    const out = extractSemanticRegions([{ tag: 'header', role: '', className: '', id: '', text: 'Home About', headings: [], buttonCount: 3, cardCount: 0, bounds: { x: 0, y: 0, w: 1280, h: 80 } }]);
    assert.equal(out[0].role, 'nav');
  });

  it('labels section with CTA + heading as hero', () => {
    const out = extractSemanticRegions([{ tag: 'section', role: '', className: 'hero', id: '', text: 'Welcome', headings: ['Build better'], buttonCount: 2, cardCount: 0, bounds: { x: 0, y: 80, w: 1280, h: 600 } }]);
    assert.equal(out[0].role, 'hero');
  });

  it('labels pricing based on cards + keyword', () => {
    const out = extractSemanticRegions([{ tag: 'section', role: '', className: '', id: '', text: 'Basic $9/mo Pro $29/mo Team $99/mo', headings: ['Pricing'], buttonCount: 3, cardCount: 3, bounds: { x: 0, y: 0, w: 1280, h: 400 } }]);
    assert.equal(out[0].role, 'pricing');
  });
});

// ── clusterComponents ───────────────────────────────────────────

describe('clusterComponents', () => {
  it('collapses identical instances into one entry', () => {
    const els = Array.from({ length: 5 }, () => ({ kind: 'button', structuralHash: 'button>span', styleVector: [16, 8, 0, 0], css: { bg: '#f00' } }));
    const out = clusterComponents(els);
    assert.equal(out.length, 1);
    assert.equal(out[0].instanceCount, 5);
  });

  it('separates variants with different style vectors', () => {
    const els = [
      { kind: 'button', structuralHash: 'button>span', styleVector: [16, 8, 0, 0], css: { bg: '#f00' } },
      { kind: 'button', structuralHash: 'button>span', styleVector: [16, 8, 0, 0], css: { bg: '#f00' } },
      { kind: 'button', structuralHash: 'button>span', styleVector: [0, 0, 16, 8], css: { bg: '#0f0' } },
    ];
    const out = clusterComponents(els);
    assert.equal(out.length, 1);
    assert.equal(out[0].variants.length, 2);
  });
});
