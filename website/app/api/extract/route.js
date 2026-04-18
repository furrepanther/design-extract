// POST /api/extract
// Streaming NDJSON: one JSON event per line.
// Events:
//   { type:'cache', cached:true }               — if served from Blob
//   { type:'stage', name:'crawl'|... }           — progress markers
//   { type:'token', category, path, value, $type } — one per semantic token
//   { type:'summary', summary }
//   { type:'files', files }                      — final, full file map
//   { type:'error', error }                      — terminal failure

import { extractDesignLanguage } from '../../../../src/index.js';
import { formatMarkdown } from '../../../../src/formatters/markdown.js';
import { formatTailwind } from '../../../../src/formatters/tailwind.js';
import { formatCssVars } from '../../../../src/formatters/css-vars.js';
import { formatPreview } from '../../../../src/formatters/preview.js';
import { formatFigma } from '../../../../src/formatters/figma.js';
import { formatReactTheme, formatShadcnTheme } from '../../../../src/formatters/theme.js';
import { formatWordPress, formatWordPressTheme } from '../../../../src/formatters/wordpress.js';
import { formatDtcgTokens } from '../../../../src/formatters/dtcg-tokens.js';
import { formatIosSwiftUI } from '../../../../src/formatters/ios-swiftui.js';
import { formatAndroidCompose } from '../../../../src/formatters/android-compose.js';
import { formatFlutterDart } from '../../../../src/formatters/flutter-dart.js';
import { formatAgentRules } from '../../../../src/formatters/agent-rules.js';
import { nameFromUrl } from '../../../../src/utils.js';

import { validateTargetUrl } from '../../../../website/lib/url-safety.js';
import { checkRate } from '../../../../website/lib/rate-limit.js';
import { cacheKey, getCached, putCached } from '../../../../website/lib/cache.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STAGES = [
  'crawl',
  'colors',
  'typography',
  'spacing',
  'shadows',
  'borders',
  'components',
  'regions',
  'a11y',
  'score',
];

async function getBrowserOptions() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return {
      executablePath: await chromium.executablePath(),
      browserArgs: chromium.args,
    };
  }
  return {};
}

function ndjson(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

// Walk a DTCG token tree and yield every leaf ({ $value, $type }).
function* walkDtcgTokens(tree, path = []) {
  if (!tree || typeof tree !== 'object') return;
  if (tree.$value !== undefined && tree.$type !== undefined) {
    yield { path: path.join('.'), value: tree.$value, $type: tree.$type };
    return;
  }
  for (const key of Object.keys(tree)) {
    if (key.startsWith('$')) continue;
    yield* walkDtcgTokens(tree[key], [...path, key]);
  }
}

function buildSummary(design) {
  return {
    url: design.meta?.url,
    title: design.meta?.title,
    colors: design.colors?.all?.length ?? 0,
    colorList: (design.colors?.all || []).slice(0, 20).map((c) => c.hex),
    fonts: design.typography?.families?.map((f) => f.name).join(', ') || 'none detected',
    spacingCount: design.spacing?.scale?.length ?? 0,
    spacingBase: design.spacing?.base ?? null,
    shadowCount: design.shadows?.values?.length ?? 0,
    radiiCount: design.borders?.radii?.length ?? 0,
    componentCount: Object.keys(design.components || {}).length,
    cssVarCount: Object.values(design.variables || {}).reduce((s, v) => s + Object.keys(v).length, 0),
    a11yScore: design.accessibility?.score ?? null,
    a11yFailCount: design.accessibility?.failCount ?? 0,
    score: design.score,
  };
}

function buildFiles(design, targetUrl) {
  const prefix = nameFromUrl(targetUrl);
  const dtcg = formatDtcgTokens(design);
  const dtcgJson = JSON.stringify(dtcg, null, 2);

  const files = {
    [`${prefix}-design-language.md`]: formatMarkdown(design),
    [`${prefix}-design-tokens.json`]: dtcgJson,
    [`${prefix}-tailwind.config.js`]: formatTailwind(design),
    [`${prefix}-variables.css`]: formatCssVars(design),
    [`${prefix}-preview.html`]: formatPreview(design),
    [`${prefix}-figma-variables.json`]: formatFigma(design),
    [`${prefix}-theme.js`]: formatReactTheme(design),
    [`${prefix}-shadcn-theme.css`]: formatShadcnTheme(design),
    [`${prefix}-wordpress-theme.json`]: formatWordPress(design),
  };

  // MCP companion JSON — same subset the CLI writes.
  files[`${prefix}-mcp.json`] = JSON.stringify({
    colors: { all: design.colors?.all || [] },
    regions: design.regions || [],
    componentClusters: design.componentClusters || [],
    accessibility: { remediation: design.accessibility?.remediation || [] },
    cssHealth: design.cssHealth || null,
  }, null, 2);

  // iOS
  files['ios/DesignTokens.swift'] = formatIosSwiftUI(dtcg);

  // Android (returns { filename: content })
  const android = formatAndroidCompose(dtcg);
  for (const name of Object.keys(android)) {
    files[`android/${name}`] = android[name];
  }

  // Flutter
  files['flutter/design_tokens.dart'] = formatFlutterDart(dtcg);

  // WordPress block theme (5 files)
  const wpTheme = formatWordPressTheme(dtcg, design);
  for (const name of Object.keys(wpTheme)) {
    files[`wordpress-theme/${name}`] = wpTheme[name];
  }

  // Agent rules
  const agentFiles = formatAgentRules({ design, tokens: dtcg, url: targetUrl });
  for (const name of Object.keys(agentFiles)) {
    files[name] = agentFiles[name];
  }

  return { files, dtcg };
}

function extractIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

// Emit cached payload as a simulated stream so the hero paints consistently.
async function streamCached(controller, cached, targetUrl) {
  controller.enqueue(ndjson({ type: 'cache', cached: true }));
  for (const stage of STAGES) {
    controller.enqueue(ndjson({ type: 'stage', name: stage }));
    await new Promise((r) => setTimeout(r, 40));
  }
  // Re-derive DTCG tokens from the cached design so the token-by-token paint
  // still happens on a cache hit.
  const { files, dtcg } = buildFiles(cached.design, targetUrl);
  for (const { path, value, $type } of walkDtcgTokens(dtcg)) {
    const category = path.split('.')[1] || 'misc';
    controller.enqueue(ndjson({ type: 'token', category, path, value, $type }));
  }
  controller.enqueue(ndjson({ type: 'summary', summary: buildSummary(cached.design) }));
  controller.enqueue(ndjson({ type: 'files', files }));
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateTargetUrl(body?.url);
  if (!validation.ok) {
    return Response.json({ error: validation.reason }, { status: validation.status });
  }
  const targetUrl = validation.url;

  const ip = extractIp(request);
  const rate = checkRate(`extract:${ip}`);
  if (!rate.allowed) {
    return Response.json(
      { error: 'Rate limit — 3 extractions per day. Try again later.', resetAt: rate.resetAt },
      { status: 429 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const key = cacheKey(targetUrl);
        const cached = await getCached(key);
        if (cached) {
          await streamCached(controller, cached, targetUrl);
          controller.close();
          return;
        }

        // Pre-stage markers — best-effort progress since extraction is atomic.
        controller.enqueue(ndjson({ type: 'stage', name: 'crawl' }));

        const browserOpts = await getBrowserOptions();
        const design = await extractDesignLanguage(targetUrl, browserOpts);

        // Post-stage markers once extraction resolves.
        for (const stage of STAGES.slice(1)) {
          controller.enqueue(ndjson({ type: 'stage', name: stage }));
        }

        const { files, dtcg } = buildFiles(design, targetUrl);

        // Token-by-token paint — every DTCG leaf becomes its own event.
        for (const { path, value, $type } of walkDtcgTokens(dtcg)) {
          const category = path.split('.')[1] || 'misc';
          controller.enqueue(ndjson({ type: 'token', category, path, value, $type }));
        }

        controller.enqueue(ndjson({ type: 'summary', summary: buildSummary(design) }));
        controller.enqueue(ndjson({ type: 'files', files }));

        // Fire-and-forget cache write.
        putCached(key, { design }).catch(() => {});
      } catch (err) {
        console.error('[extract] failed', { url: targetUrl, ip, message: err?.message });
        controller.enqueue(ndjson({ type: 'error', error: err?.message || 'Extraction failed' }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  });
}
