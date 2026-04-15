export default function Home() {
  const marqueeText = "COLORS // TYPOGRAPHY // SPACING // LAYOUT // SHADOWS // ACCESSIBILITY // COMPONENTS // ANIMATIONS // BREAKPOINTS // CSS VARIABLES // INTERACTIONS // RESPONSIVE // FIGMA // TAILWIND // REACT // SHADCN // ";

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <h1 className="hero-title">
          DESIGN
          <br />
          LANG
          <span>reverse-engineer any website</span>
        </h1>
        <p className="hero-sub">
          One command extracts the complete design language from any live website.
          8 output files. 15 sections. 12 extractors. No other tool does this.
        </p>
        <a href="https://github.com/Manavarya09/design-extract" className="hero-cmd">
          npx designlang https://stripe.com
        </a>
        <div className="scroll-hint">scroll down</div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-strip">
        <div className="stat"><div className="stat-value">8</div><div className="stat-label">Output Files</div></div>
        <div className="stat"><div className="stat-value">12</div><div className="stat-label">Extractors</div></div>
        <div className="stat"><div className="stat-value">11</div><div className="stat-label">Component Types</div></div>
        <div className="stat"><div className="stat-value">15</div><div className="stat-label">Markdown Sections</div></div>
        <div className="stat"><div className="stat-value">7</div><div className="stat-label">Score Categories</div></div>
        <div className="stat"><div className="stat-value">4</div><div className="stat-label">Viewports Crawled</div></div>
      </div>

      {/* ── MARQUEE ── */}
      <div className="marquee">
        <div className="marquee-inner">
          {marqueeText}{marqueeText}{marqueeText}{marqueeText}
        </div>
      </div>

      {/* ── OUTPUT FILES ── */}
      <section>
        <h2 className="section-title">8 Output Files</h2>
        <div className="files-grid">
          {[
            { num: '01', name: '*-design-language.md', desc: 'AI-optimized markdown — feed it to any LLM and it recreates the design from scratch. 15 sections covering every aspect.' },
            { num: '02', name: '*-preview.html', desc: 'Gorgeous dark-themed visual report with color swatches, type scale rendering, shadow cards, and accessibility score.' },
            { num: '03', name: '*-tailwind.config.js', desc: 'Drop-in Tailwind CSS theme extension with colors, fonts, spacing, radii, shadows, and screens.' },
            { num: '04', name: '*-variables.css', desc: 'CSS custom properties organized by category. Import directly into any project.' },
            { num: '05', name: '*-figma-variables.json', desc: 'Figma Variables import format with light/dark mode support. Hand off to designers instantly.' },
            { num: '06', name: '*-theme.js', desc: 'React/CSS-in-JS theme object compatible with Chakra UI, Stitches, and Vanilla Extract.' },
            { num: '07', name: '*-shadcn-theme.css', desc: 'shadcn/ui theme variables in the exact format it expects. Paste into globals.css.' },
            { num: '08', name: '*-design-tokens.json', desc: 'W3C Design Tokens community group format for tooling integration.' },
          ].map(f => (
            <div key={f.num} className="file-card" data-num={f.num}>
              <div className="file-name">{f.name}</div>
              <div className="file-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IT EXTRACTS ── */}
      <section className="section-red">
        <div className="section-inner">
          <h2 className="section-title">What It Extracts</h2>
          <div className="features-list">
            {[
              { name: 'Colors', cmd: 'automatic', desc: 'Full palette with primary/secondary/accent/neutral classification. Gradients. Background and text colors with usage context.' },
              { name: 'Typography', cmd: 'automatic', desc: 'Font families, type scale, heading/body styles, weight distribution, line heights, letter spacing.' },
              { name: 'Spacing', cmd: 'automatic', desc: 'All unique values with automatic base-unit detection. Identifies 4px/8px grids.' },
              { name: 'Layout System', cmd: 'automatic', desc: 'Grid column patterns, flex direction usage, container widths, gap values, justify/align patterns. The skeleton, not just the paint.' },
              { name: 'Shadows', cmd: 'automatic', desc: 'All box-shadows parsed and classified by visual weight (xs through xl).' },
              { name: 'Components', cmd: 'automatic', desc: '11 types: buttons, cards, inputs, links, navbars, footers, modals, dropdowns, tables, badges, avatars.' },
              { name: 'Accessibility', cmd: 'automatic', desc: 'WCAG 2.1 contrast ratios for every fg/bg color pair. Overall score and failing pairs.' },
              { name: 'Responsive', cmd: '--responsive', desc: 'Crawls at 4 viewports. Maps what changes between breakpoints — fonts, nav, columns, hamburger.' },
              { name: 'Interactions', cmd: '--interactions', desc: 'Hovers and focuses interactive elements. Records actual style transitions — hover colors, focus rings, active states.' },
              { name: 'CSS Variables', cmd: 'automatic', desc: 'All :root custom properties categorized by type — colors, spacing, typography, shadows, radii.' },
              { name: 'Animations', cmd: 'automatic', desc: 'Transitions, easing functions, durations, and @keyframes rules.' },
              { name: 'Design Score', cmd: 'automatic', desc: '7-category quality rating (A-F) — color discipline, typography, spacing, shadows, radii, accessibility, tokenization.' },
            ].map(f => (
              <div key={f.name} className="feature">
                <div className="feature-name">{f.name}</div>
                <div className="feature-cmd">{f.cmd}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMANDS ── */}
      <section>
        <h2 className="section-title">Commands</h2>
        <div className="commands-grid">
          {[
            { name: 'designlang <url>', desc: 'Extract the full design language. Generates 8 output files.' },
            { name: 'designlang <url> --full', desc: 'Everything at once — screenshots, responsive, interactions.' },
            { name: 'designlang diff <A> <B>', desc: 'Compare two sites side-by-side. Outputs markdown and HTML.' },
            { name: 'designlang brands <urls...>', desc: 'Multi-brand comparison matrix. Color overlap, typography, a11y scores.' },
            { name: 'designlang clone <url>', desc: 'Generate a working Next.js starter with the extracted design applied.' },
            { name: 'designlang score <url>', desc: 'Rate design system quality. 7 categories, A-F grade, actionable issues.' },
            { name: 'designlang watch <url>', desc: 'Monitor a site for design changes on a configurable interval.' },
            { name: 'designlang sync <url>', desc: 'Update local token files from the live site. Code-first source of truth.' },
            { name: 'designlang history <url>', desc: 'View how a site\'s design has evolved over time.' },
          ].map(c => (
            <div key={c.name} className="command-card">
              <div className="command-name">{c.name}</div>
              <div className="command-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCORE DEMO ── */}
      <section className="section-cream">
        <div className="section-inner">
          <h2 className="section-title">Design System Scoring</h2>
          <div className="score-demo">
            <div>$ designlang score https://vercel.com</div>
            <br />
            <div>&nbsp;&nbsp;<span className="score-grade">68</span>/100&nbsp;&nbsp;Grade: D</div>
            <br />
            <div>&nbsp;&nbsp;Color Discipline&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██████████░░░░░░░░░░ 50</div>
            <div>&nbsp;&nbsp;Typography&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██████████████░░░░░░ 70</div>
            <div>&nbsp;&nbsp;Spacing System&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;████████████████░░░░ 80</div>
            <div>&nbsp;&nbsp;Shadows&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;██████████░░░░░░░░░░ 50</div>
            <div>&nbsp;&nbsp;Border Radii&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;████████░░░░░░░░░░░░ 40</div>
            <div>&nbsp;&nbsp;Accessibility&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;███████████████████░ 94</div>
            <div>&nbsp;&nbsp;Tokenization&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;████████████████████ 100</div>
          </div>
        </div>
      </section>

      {/* ── AGENT SKILL ── */}
      <section>
        <h2 className="section-title">Agent Skill</h2>
        <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#aaa', maxWidth: '700px', marginBottom: '32px' }}>
          Works with <strong style={{ color: '#fff' }}>Claude Code, Cursor, Codex, and 40+ AI coding agents</strong> via the skills ecosystem.
        </p>
        <div className="hero-cmd" style={{ display: 'inline-block' }}>
          npx skills add Manavarya09/design-extract
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-title">DESIGNLANG</div>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Built by Manavarya Singh. MIT Licensed. Open Source.
        </p>
        <div className="footer-links">
          <a href="https://github.com/Manavarya09/design-extract">GitHub</a>
          <a href="https://www.npmjs.com/package/designlang">npm</a>
        </div>
        <div className="footer-copy">
          No other tool extracts layout patterns, responsive behavior, interaction states, and scores design quality from a single command.
        </div>
      </footer>
    </>
  );
}
