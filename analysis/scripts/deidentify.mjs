#!/usr/bin/env node
// Strip direct identifiers from a session JSON export, replacing them with
// stable pseudonyms derived from a project-wide salt.
//
// Usage:
//   DEID_SALT=<32-hex-chars> node analysis/scripts/deidentify.mjs \
//     < input.json > output.deid.json
//
// Or process a directory of session JSON exports:
//   DEID_SALT=... node analysis/scripts/deidentify.mjs \
//     --in data/raw/sessions/ --out data/deid/sessions/
//
// The salt MUST be the same across runs for a given study so that pseudonyms
// are stable (you can link a participant's sessions across days). Store the
// salt in a password manager and never commit it. Losing the salt is not
// catastrophic — you just can't extend the pseudonym mapping after that.
// Re-identifying requires the salt *and* the original ID → brute-forcing a
// SHA-256 over a small ID space is feasible, which is why the salt must have
// real entropy (32+ hex chars from a CSPRNG).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SALT = process.env.DEID_SALT;
if (!SALT || SALT.length < 32) {
  console.error('✗ DEID_SALT env var must be set and at least 32 characters.');
  console.error('  Generate one with: openssl rand -hex 32');
  process.exit(2);
}

function pseudonym(id, scope) {
  if (id == null) return null;
  // Scope prefix prevents the same ID under two roles (e.g. enumerator/participant)
  // from colliding into the same pseudonym.
  const h = crypto.createHash('sha256').update(`${scope}|${SALT}|${id}`).digest('hex');
  return `${scope}-${h.slice(0, 16)}`;
}

function deidSession(s) {
  const out = { ...s };
  out.participantId = pseudonym(s.participantId, 'p');
  out.enumeratorId = pseudonym(s.enumeratorId, 'e');
  // sessionId is a UUID, not a direct identifier — keep it
  // Strip any free-text survey answers that could contain names/places.
  // (Aggregate-form survey data stays; a heuristic: any string > 200 chars is suspect.)
  if (out.survey && typeof out.survey === 'object') {
    out.survey = Object.fromEntries(
      Object.entries(out.survey).map(([k, v]) => {
        if (typeof v === 'string' && v.length > 200) {
          return [k, `[REDACTED_FREETEXT_${v.length}c]`];
        }
        return [k, v];
      })
    );
  }
  // Device-info fields sometimes leak identifiers (e.g. userAgent with unique plugins)
  // Truncate or drop as needed by your IRB. Default: drop.
  delete out.deviceInfo;
  return out;
}

function processStream() {
  const chunks = [];
  process.stdin.on('data', (c) => chunks.push(c));
  process.stdin.on('end', () => {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const out = Array.isArray(input) ? input.map(deidSession) : deidSession(input);
    process.stdout.write(JSON.stringify(out, null, 2));
  });
}

function processDir(inDir, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(inDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const input = JSON.parse(fs.readFileSync(path.join(inDir, f), 'utf8'));
    const out = Array.isArray(input) ? input.map(deidSession) : deidSession(input);
    fs.writeFileSync(path.join(outDir, f), JSON.stringify(out, null, 2));
    console.error(`✓ ${f}`);
  }
  console.error(`Done. ${files.length} file(s) processed.`);
}

const args = process.argv.slice(2);
const inIdx = args.indexOf('--in');
const outIdx = args.indexOf('--out');
if (inIdx >= 0 && outIdx >= 0) {
  processDir(args[inIdx + 1], args[outIdx + 1]);
} else {
  processStream();
}
