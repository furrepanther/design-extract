export function extractGradients(styles) {
  const seen = new Set();
  const gradients = [];

  for (const el of styles) {
    const bg = el.backgroundImage;
    if (!bg || !bg.includes('gradient')) continue;
    const rawGradients = splitGradients(bg);
    for (const raw of rawGradients) {
      if (seen.has(raw)) continue;
      seen.add(raw);
      gradients.push(parseGradient(raw));
    }
  }

  return { gradients, count: gradients.length };
}

function splitGradients(value) {
  // Split comma-separated gradient layers, respecting nested parens
  const results = [];
  let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;
    else if (value[i] === ',' && depth === 0) {
      const chunk = value.slice(start, i).trim();
      if (chunk.includes('gradient')) results.push(chunk);
      start = i + 1;
    }
  }
  const last = value.slice(start).trim();
  if (last.includes('gradient')) results.push(last);
  return results;
}

function parseGradient(raw) {
  const typeMatch = raw.match(/^(repeating-)?(linear|radial|conic)-gradient/);
  const type = typeMatch ? (typeMatch[1] || '') + typeMatch[2] : 'linear';

  // Extract content inside outermost parens
  const inner = raw.slice(raw.indexOf('(') + 1, raw.lastIndexOf(')'));

  // Split top-level arguments by comma (respecting nested parens)
  const args = [];
  let depth = 0, start = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '(') depth++;
    else if (inner[i] === ')') depth--;
    else if (inner[i] === ',' && depth === 0) {
      args.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(inner.slice(start).trim());

  // First arg is direction/angle if it doesn't look like a color
  let direction = null;
  let stopArgs = args;
  const first = args[0] || '';
  if (/^(to |from |\d+deg|at )/.test(first) || /^(circle|ellipse)/.test(first)) {
    direction = first;
    stopArgs = args.slice(1);
  }

  const stops = stopArgs.map(s => {
    const posMatch = s.match(/([\d.]+%?)$/);
    const position = posMatch ? posMatch[1] : null;
    const color = position ? s.slice(0, posMatch.index).trim() : s.trim();
    return { color, position };
  });

  const colorCount = stops.length;
  let classification = 'subtle';
  if (colorCount > 4) classification = 'complex';
  else if (colorCount > 2) classification = 'bold';
  else if (colorCount === 2) classification = 'brand';

  return { raw, type, direction, stops, classification };
}
