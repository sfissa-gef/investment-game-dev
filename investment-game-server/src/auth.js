// Bearer-token auth middleware for Hono.
// Tokens are read from Worker secrets at request time, not module load,
// because env bindings aren't available until the request context.

function extract(c) {
  const header = c.req.header('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function requireEnumerator() {
  return async (c, next) => {
    const token = extract(c);
    if (!token) return c.json({ error: 'missing_token' }, 401);

    const valid = new Set(
      (c.env.ENUMERATOR_TOKENS || '').split(',').map((s) => s.trim()).filter(Boolean)
    );
    const admin = c.env.ADMIN_TOKEN || '';
    if (!valid.has(token) && token !== admin) {
      return c.json({ error: 'forbidden' }, 403);
    }
    await next();
  };
}

export function requireAdmin() {
  return async (c, next) => {
    const token = extract(c);
    if (!token) return c.json({ error: 'missing_token' }, 401);
    if (token !== (c.env.ADMIN_TOKEN || '')) {
      return c.json({ error: 'admin_only' }, 403);
    }
    await next();
  };
}
