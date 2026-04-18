import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTargetUrl } from './url-safety.js';

test('accepts https URL', () => {
  const r = validateTargetUrl('https://stripe.com');
  assert.equal(r.ok, true);
  assert.equal(r.url, 'https://stripe.com/');
});

test('accepts http URL on port 80', () => {
  const r = validateTargetUrl('http://example.com:80');
  assert.equal(r.ok, true);
});

test('normalizes bare hostname to https', () => {
  const r = validateTargetUrl('example.com');
  assert.equal(r.ok, true);
  assert.equal(r.url, 'https://example.com/');
});

test('rejects localhost', () => {
  const r = validateTargetUrl('http://localhost');
  assert.equal(r.ok, false);
  assert.equal(r.status, 400);
});

test('rejects *.local hostnames', () => {
  const r = validateTargetUrl('https://printer.local');
  assert.equal(r.ok, false);
});

test('rejects *.localhost hostnames', () => {
  const r = validateTargetUrl('https://app.localhost');
  assert.equal(r.ok, false);
});

test('rejects 127.0.0.1', () => {
  const r = validateTargetUrl('http://127.0.0.1');
  assert.equal(r.ok, false);
});

test('rejects 10.x private range', () => {
  const r = validateTargetUrl('http://10.1.2.3');
  assert.equal(r.ok, false);
});

test('rejects 192.168.x private range', () => {
  const r = validateTargetUrl('http://192.168.0.1');
  assert.equal(r.ok, false);
});

test('rejects 172.16–31.x private range', () => {
  const r = validateTargetUrl('http://172.20.0.5');
  assert.equal(r.ok, false);
});

test('allows 172.15.x (outside private range)', () => {
  const r = validateTargetUrl('http://172.15.0.1');
  assert.equal(r.ok, true);
});

test('rejects 169.254.x link-local', () => {
  const r = validateTargetUrl('http://169.254.0.1');
  assert.equal(r.ok, false);
});

test('rejects file:// scheme', () => {
  const r = validateTargetUrl('file://evil');
  assert.equal(r.ok, false);
});

test('rejects javascript: scheme', () => {
  const r = validateTargetUrl('javascript:alert(1)');
  assert.equal(r.ok, false);
});

test('rejects non-80/443 port', () => {
  const r = validateTargetUrl('https://example.com:22');
  assert.equal(r.ok, false);
});

test('rejects port 3000', () => {
  const r = validateTargetUrl('https://example.com:3000');
  assert.equal(r.ok, false);
});

test('rejects IPv6 loopback ::1', () => {
  const r = validateTargetUrl('http://[::1]');
  assert.equal(r.ok, false);
});

test('rejects IPv6 [::1]:3000', () => {
  const r = validateTargetUrl('http://[::1]:3000');
  assert.equal(r.ok, false);
});

test('rejects IPv6 unique-local fc00::', () => {
  const r = validateTargetUrl('http://[fc00::1]');
  assert.equal(r.ok, false);
});

test('rejects IPv6 link-local fe80::', () => {
  const r = validateTargetUrl('http://[fe80::1]');
  assert.equal(r.ok, false);
});

test('rejects empty string', () => {
  const r = validateTargetUrl('');
  assert.equal(r.ok, false);
});

test('rejects garbage', () => {
  const r = validateTargetUrl('http://');
  assert.equal(r.ok, false);
});
