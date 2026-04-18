'use client';

import { useCallback, useRef, useState } from 'react';
import Marginalia from './Marginalia';

const STAGE_LABEL = {
  crawl: 'walking DOM',
  colors: 'resolving palette',
  typography: 'reading type',
  spacing: 'measuring rhythm',
  shadows: 'catching shadows',
  borders: 'tracing radii',
  components: 'clustering components',
  regions: 'naming regions',
  a11y: 'auditing contrast',
  score: 'scoring system',
};

const MAX_SWATCHES = 24;
const MAX_DIMENSIONS = 12;

export default function HeroExtractor() {
  const [status, setStatus] = useState('idle'); // idle | streaming | done | error
  const [stage, setStage] = useState(null);
  const [cached, setCached] = useState(false);
  const [swatches, setSwatches] = useState([]);
  const [fontSample, setFontSample] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [files, setFiles] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [rateLimitMsg, setRateLimitMsg] = useState(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    setStage(null);
    setCached(false);
    setSwatches([]);
    setFontSample(null);
    setDimensions([]);
    setSummary(null);
    setFiles(null);
    setErrorMsg(null);
    setRateLimitMsg(null);
    setCopied(false);
  }, []);

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'cache':
        setCached(true);
        break;
      case 'stage':
        setStage(event.name);
        break;
      case 'token': {
        if (event.$type === 'color' && typeof event.value === 'string' && event.value.startsWith('#')) {
          setSwatches((prev) => {
            if (prev.length >= MAX_SWATCHES) return prev;
            if (prev.some((s) => s.path === event.path)) return prev;
            return [...prev, { path: event.path, hex: event.value }];
          });
        } else if (event.$type === 'fontFamily' && typeof event.value === 'string') {
          setFontSample((prev) => prev || event.value);
        } else if (event.$type === 'dimension' && typeof event.value === 'string') {
          const px = parseFloat(event.value);
          if (!Number.isNaN(px)) {
            setDimensions((prev) => {
              if (prev.length >= MAX_DIMENSIONS) return prev;
              return [...prev, { path: event.path, px, raw: event.value }];
            });
          }
        }
        break;
      }
      case 'summary':
        setSummary(event.summary);
        break;
      case 'files':
        setFiles(event.files);
        setStatus('done');
        break;
      case 'error':
        setErrorMsg(event.error || 'Extraction failed');
        setStatus('error');
        break;
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (status === 'streaming') return;
    reset();
    setStatus('streaming');

    const url = inputRef.current?.value?.trim() || '';
    let res;
    try {
      res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      setErrorMsg('Network error — check your connection.');
      setStatus('error');
      return;
    }

    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch {}
      if (res.status === 429) {
        setRateLimitMsg(body?.error || 'Rate limit reached. Try again in 24h.');
      } else if (res.status === 400) {
        setErrorMsg(body?.error || 'Invalid URL.');
      } else {
        setErrorMsg(body?.error || 'Extraction failed. Try another URL.');
      }
      setStatus('error');
      return;
    }

    if (!res.body) {
      setErrorMsg('Browser does not support streaming responses.');
      setStatus('error');
      return;
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let nl;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            handleEvent(JSON.parse(line));
          } catch {
            // Ignore partial / malformed lines — defensive only.
          }
        }
      }
      if (buffer.trim()) {
        try { handleEvent(JSON.parse(buffer.trim())); } catch {}
      }
    } catch (err) {
      setErrorMsg('Stream interrupted. Try another URL.');
      setStatus('error');
    }
  }, [status, handleEvent, reset]);

  const handleDownload = useCallback(async () => {
    if (!files || downloadBusy) return;
    setDownloadBusy(true);
    try {
      const { zipFilesToUrl } = await import('../../lib/zip-files.js');
      const { url, filename } = await zipFilesToUrl(files, {
        name: `designlang-${new Date().toISOString().slice(0, 10)}`,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setDownloadBusy(false);
    }
  }, [files, downloadBusy]);

  const handleCopyMarkdown = useCallback(async () => {
    if (!files) return;
    const mdKey = Object.keys(files).find((k) => k.endsWith('-design-language.md'));
    if (!mdKey) return;
    try {
      await navigator.clipboard.writeText(files[mdKey]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op
    }
  }, [files]);

  const stageLabel = stage ? STAGE_LABEL[stage] || stage : null;
  const streaming = status === 'streaming';
  const disabled = streaming;

  return (
    <>
      <div className="with-margin" style={{ marginTop: 'var(--r8)' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            maxWidth: 720,
            border: 'var(--hair)',
          }}
        >
          <label htmlFor="url" style={{ display: 'none' }}>URL</label>
          <input
            id="url"
            ref={inputRef}
            name="url"
            type="url"
            placeholder="https://stripe.com"
            defaultValue="https://stripe.com"
            disabled={disabled}
            className="mono"
            style={{
              flex: 1,
              padding: '18px 20px',
              fontSize: 16,
              color: 'var(--ink)',
              background: 'transparent',
              borderRight: 'var(--hair)',
            }}
          />
          <button
            type="submit"
            className="cta"
            disabled={disabled}
            style={{ boxShadow: 'none' }}
          >
            {streaming ? 'Extracting…' : 'Extract'}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>↵</span>
          </button>
        </form>

        <Marginalia>
          <div>status</div>
          <div style={{ minHeight: '1.5em' }}>
            {status === 'idle' && <code style={{ color: 'var(--ink-3)' }}>awaiting URL</code>}
            {streaming && stageLabel && (
              <code>§ {stageLabel}{cached ? ' (cached)' : ''}</code>
            )}
            {streaming && !stageLabel && <code>§ opening stream</code>}
            {status === 'done' && <code style={{ color: 'var(--accent)' }}>complete{cached ? ' (cached)' : ''}</code>}
            {status === 'error' && <code style={{ color: 'var(--accent)' }}>halted</code>}
          </div>
          {cached && (
            <>
              <hr style={{ margin: '12px 0', border: 0, borderTop: '1px solid var(--ink-3)' }} />
              <span className="chip" style={{ fontSize: 10 }}>cached · &lt; 24h</span>
            </>
          )}
        </Marginalia>
      </div>

      {errorMsg && (
        <p className="mono" role="alert" style={{ marginTop: 'var(--r4)', fontSize: 12, color: 'var(--accent)' }}>
          {errorMsg}{' '}
          {status === 'error' && (
            <button
              type="button"
              onClick={reset}
              style={{ textDecoration: 'underline', color: 'inherit', marginLeft: 8 }}
            >
              Try another URL
            </button>
          )}
        </p>
      )}

      {rateLimitMsg && (
        <p className="mono" role="alert" style={{ marginTop: 'var(--r4)', fontSize: 12, color: 'var(--accent)' }}>
          {rateLimitMsg}
        </p>
      )}

      <p className="mono" style={{ marginTop: 14, fontSize: 11, color: 'var(--ink-3)' }}>
        Free, rate-limited to 3 extractions per day. Private IPs rejected. No accounts.
      </p>

      {/* ── Live paint ─────────────────────────────────────── */}
      {(swatches.length > 0 || fontSample || dimensions.length > 0 || summary) && (
        <div style={{ marginTop: 'var(--r7)', display: 'grid', gap: 'var(--r5)' }}>
          {swatches.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--r3)' }}>
                <span>palette</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--r3)' }}>
                {swatches.map((s, i) => (
                  <div
                    key={s.path}
                    style={{
                      opacity: 0,
                      animation: `designlang-fade-in 200ms ease-out forwards`,
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: s.hex,
                        border: 'var(--hair)',
                      }}
                    />
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}
                    >
                      {s.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fontSample && (
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--r3)' }}>
                <span>type</span>
              </div>
              <div
                style={{
                  fontFamily: `${fontSample}, system-ui, sans-serif`,
                  fontSize: 32,
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                Aa Bb Cc 123
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                {fontSample}
              </div>
            </div>
          )}

          {dimensions.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--r3)' }}>
                <span>scale</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {dimensions.map((d, i) => (
                  <div
                    key={d.path}
                    title={`${d.path} — ${d.raw}`}
                    style={{
                      width: 14,
                      height: Math.min(Math.max(d.px, 4), 120),
                      background: 'var(--ink)',
                      opacity: 0,
                      animation: `designlang-fade-in 200ms ease-out forwards`,
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 'var(--r5)',
                borderTop: 'var(--hair)',
                paddingTop: 'var(--r5)',
              }}
            >
              <Numeral value={summary.colors} label="colors" />
              <Numeral value={summary.spacingCount} label="spacing" />
              <Numeral value={summary.shadowCount} label="shadows" />
              <Numeral value={summary.componentCount} label="components" />
              <Numeral
                value={summary.score?.overall ?? '—'}
                label={`score ${summary.score?.grade ? `(${summary.score.grade})` : ''}`}
              />
            </div>
          )}
        </div>
      )}

      {files && (
        <div style={{ marginTop: 'var(--r6)', display: 'flex', gap: 'var(--r3)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownload}
            className="cta"
            disabled={downloadBusy}
          >
            {downloadBusy ? 'Zipping…' : `Download all (.zip) — ${Object.keys(files).length} files`}
          </button>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="cta"
            style={{ background: 'var(--paper)', color: 'var(--ink)', boxShadow: 'none' }}
          >
            {copied ? 'Copied' : 'Copy markdown'}
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes designlang-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </>
  );
}

function Numeral({ value, label }) {
  return (
    <div>
      <div
        className="display"
        style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1 }}
      >
        {value}
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  );
}
