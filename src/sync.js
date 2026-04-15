// Sync command — watch a live site and auto-update local tokens when design changes

import { extractDesignLanguage } from './index.js';
import { formatTokens } from './formatters/tokens.js';
import { formatTailwind } from './formatters/tailwind.js';
import { formatCssVars } from './formatters/css-vars.js';
import { saveSnapshot, getHistory } from './history.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function syncDesign(url, options = {}) {
  const { out = '.', interval = 3600000 } = options; // default 1 hour

  const current = await extractDesignLanguage(url, options);
  const history = getHistory(url);
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const changes = [];

  if (previous) {
    // Detect changes
    if (previous.colors.primary !== current.colors.primary?.hex) {
      changes.push({ type: 'color', property: 'primary', from: previous.colors.primary, to: current.colors.primary?.hex });
    }
    if (previous.colors.secondary !== current.colors.secondary?.hex) {
      changes.push({ type: 'color', property: 'secondary', from: previous.colors.secondary, to: current.colors.secondary?.hex });
    }
    if (previous.typography.families.join(',') !== current.typography.families.map(f => f.name).join(',')) {
      changes.push({ type: 'typography', property: 'fonts', from: previous.typography.families.join(', '), to: current.typography.families.map(f => f.name).join(', ') });
    }
    if (previous.colors.count !== current.colors.all.length) {
      changes.push({ type: 'color', property: 'count', from: String(previous.colors.count), to: String(current.colors.all.length) });
    }
    if (previous.a11yScore !== current.accessibility?.score) {
      changes.push({ type: 'accessibility', property: 'score', from: `${previous.a11yScore}%`, to: `${current.accessibility?.score}%` });
    }
  }

  // Save snapshot
  saveSnapshot(current);

  // Update local files
  const updates = [];

  const tokensPath = join(out, 'design-tokens.json');
  if (existsSync(tokensPath)) {
    writeFileSync(tokensPath, formatTokens(current), 'utf-8');
    updates.push('design-tokens.json');
  }

  const tailwindPath = join(out, 'tailwind.config.js');
  if (existsSync(tailwindPath)) {
    writeFileSync(tailwindPath, formatTailwind(current), 'utf-8');
    updates.push('tailwind.config.js');
  }

  const cssPath = join(out, 'variables.css');
  if (existsSync(cssPath)) {
    writeFileSync(cssPath, formatCssVars(current), 'utf-8');
    updates.push('variables.css');
  }

  return {
    changes,
    updatedFiles: updates,
    isFirstRun: !previous,
    design: current,
  };
}
