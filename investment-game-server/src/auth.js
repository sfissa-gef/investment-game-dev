// Simple static-bearer auth. ENUMERATOR_TOKENS and ADMIN_TOKEN are env-provided.
// ENUMERATOR_TOKENS is a comma-separated list.

const enumeratorTokens = new Set(
  (process.env.ENUMERATOR_TOKENS || '').split(',').map((s) => s.trim()).filter(Boolean)
);
const adminToken = process.env.ADMIN_TOKEN || '';

function extract(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function requireEnumerator(req, res, next) {
  const token = extract(req);
  if (!token) return res.status(401).json({ error: 'missing_token' });
  if (!enumeratorTokens.has(token) && token !== adminToken) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  const token = extract(req);
  if (!token) return res.status(401).json({ error: 'missing_token' });
  if (token !== adminToken) return res.status(403).json({ error: 'admin_only' });
  next();
}
