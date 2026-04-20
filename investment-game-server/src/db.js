import { neon } from '@neondatabase/serverless';

// Returns a tagged-template SQL client bound to the Worker's DATABASE_URL secret.
// Each call opens a short-lived HTTP connection to Neon's pooler — no TCP,
// no persistent sockets (that's why this works in a Worker runtime).
export function getDb(env) {
  if (!env?.DATABASE_URL) {
    throw new Error('DATABASE_URL secret is not configured. Run: wrangler secret put DATABASE_URL');
  }
  return neon(env.DATABASE_URL);
}
