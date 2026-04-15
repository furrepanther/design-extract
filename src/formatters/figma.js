// Figma Variables JSON format (compatible with Figma Variables import)
export function formatFigma(design) {
  const variables = [];

  // Colors
  if (design.colors.primary) {
    variables.push(colorVar('color/primary', design.colors.primary.hex));
  }
  if (design.colors.secondary) {
    variables.push(colorVar('color/secondary', design.colors.secondary.hex));
  }
  if (design.colors.accent) {
    variables.push(colorVar('color/accent', design.colors.accent.hex));
  }
  for (let i = 0; i < design.colors.neutrals.length && i < 10; i++) {
    variables.push(colorVar(`color/neutral/${i * 100 || 50}`, design.colors.neutrals[i].hex));
  }
  for (let i = 0; i < design.colors.backgrounds.length; i++) {
    variables.push(colorVar(`color/background/${i === 0 ? 'default' : i}`, design.colors.backgrounds[i]));
  }
  for (let i = 0; i < design.colors.text.length && i < 5; i++) {
    variables.push(colorVar(`color/text/${i === 0 ? 'default' : i}`, design.colors.text[i]));
  }

  // Spacing
  for (const v of design.spacing.scale.slice(0, 20)) {
    variables.push({ name: `spacing/${v}`, type: 'FLOAT', value: v, scopes: ['GAP', 'ALL_SCOPES'] });
  }

  // Border radius
  for (const r of design.borders.radii) {
    variables.push({ name: `radius/${r.label}`, type: 'FLOAT', value: r.value, scopes: ['CORNER_RADIUS'] });
  }

  // Font sizes
  for (const s of design.typography.scale.slice(0, 12)) {
    variables.push({ name: `fontSize/${s.size}`, type: 'FLOAT', value: s.size, scopes: ['FONT_SIZE'] });
  }

  const collection = {
    name: `Design Language — ${design.meta.title || 'Extracted'}`,
    modes: [{ name: 'Default', variables }],
  };

  // Add dark mode if available
  if (design.darkMode) {
    const darkVars = [];
    const dc = design.darkMode.colors;
    if (dc.primary) darkVars.push(colorVar('color/primary', dc.primary.hex));
    if (dc.secondary) darkVars.push(colorVar('color/secondary', dc.secondary.hex));
    for (let i = 0; i < dc.neutrals.length && i < 10; i++) {
      darkVars.push(colorVar(`color/neutral/${i * 100 || 50}`, dc.neutrals[i].hex));
    }
    for (let i = 0; i < dc.backgrounds.length; i++) {
      darkVars.push(colorVar(`color/background/${i === 0 ? 'default' : i}`, dc.backgrounds[i]));
    }
    for (let i = 0; i < dc.text.length && i < 5; i++) {
      darkVars.push(colorVar(`color/text/${i === 0 ? 'default' : i}`, dc.text[i]));
    }
    collection.modes.push({ name: 'Dark', variables: darkVars });
  }

  return JSON.stringify(collection, null, 2);
}

function colorVar(name, hex) {
  const rgb = hexToRgb(hex);
  return {
    name,
    type: 'COLOR',
    value: { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255, a: 1 },
    scopes: ['ALL_SCOPES'],
  };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
