// Vercel Blob-backed cache for extraction payloads.
//
// TTL: 24h, enforced on read by checking `generatedAt` in the stored payload.
// Key: normalized URL → SHA-256 hex.
// Gracefully no-ops when BLOB_READ_WRITE_TOKEN is absent (local dev).

import { createHash } from 'node:crypto';

const TTL_MS = 24 * 60 * 60 * 1000;
let warnedMissingToken = false;

export function cacheKey(url) {
  const normalized = String(url).trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}

function hasBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (!warnedMissingToken) {
      console.log('[cache] BLOB_READ_WRITE_TOKEN not set — skipping cache');
      warnedMissingToken = true;
    }
    return false;
  }
  return true;
}

function blobPath(key) {
  return `extract-cache/${key}.json`;
}

export async function getCached(key) {
  if (!hasBlob()) return null;
  try {
    const { list } = await import('@vercel/blob');
    const path = blobPath(key);
    const result = await list({ prefix: path, limit: 1 });
    const blob = result.blobs?.find((b) => b.pathname === path);
    if (!blob) return null;

    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return null;
    const payload = await res.json();

    const generatedAt = typeof payload?.generatedAt === 'number' ? payload.generatedAt : 0;
    if (Date.now() - generatedAt > TTL_MS) return null;
    if (!payload?.design) return null;
    return { design: payload.design };
  } catch (err) {
    console.error('[cache] read failed', err?.message);
    return null;
  }
}

export async function putCached(key, { design }) {
  if (!hasBlob()) return;
  try {
    const { put } = await import('@vercel/blob');
    const payload = {
      generatedAt: Date.now(),
      expiresAt: Date.now() + TTL_MS,
      design,
    };
    await put(blobPath(key), JSON.stringify(payload), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    console.error('[cache] write failed', err?.message);
  }
}
