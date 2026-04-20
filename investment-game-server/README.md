# investment-game-server

Minimal Node + Express + PostgreSQL sync endpoint for the Investment Game PWA.

## Quick start (local)

```bash
cp .env.example .env   # edit if you want non-default tokens
docker compose up -d db
npm install
DATABASE_URL=postgresql://game:devpass@localhost:5432/investment_game npm run migrate
DATABASE_URL=postgresql://game:devpass@localhost:5432/investment_game \
  ENUMERATOR_TOKENS=dev-enum-token \
  ADMIN_TOKEN=dev-admin-token \
  npm run dev
```

Then `curl http://localhost:4000/health` should return `{ ok: true, time: ... }`.

## Production (single VM)

```bash
ADMIN_TOKEN=$(openssl rand -hex 32) \
ENUMERATOR_TOKENS=$(openssl rand -hex 16),$(openssl rand -hex 16) \
POSTGRES_PASSWORD=$(openssl rand -hex 24) \
docker compose up -d --build
docker compose exec app npm run migrate
```

Point the PWA's Admin → Sync tab at `https://<host>`. Use one `ENUMERATOR_TOKENS` entry per device team; rotate on schedule.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness probe (checks DB) |
| POST | `/api/sessions` | Enumerator | Upload a completed session (idempotent via `sessionId`). Returns 200 on accept, 409 on duplicate |
| POST | `/api/audio-chunks` | Enumerator | Upload one encrypted audio chunk |
| GET | `/api/sessions` | Admin | List 500 most recent received sessions |
| GET | `/api/sessions/:id` | Admin | Return the stored payload for a session |

## Data model

One `sessions` row per session holds the full JSON payload in a `jsonb` column plus hot columns indexed for queries. One `audio_chunks` row per 60-second chunk. Chunks are stored encrypted (`encrypted = true`) when the client uploaded AES-GCM ciphertext.

## Backup

```bash
docker compose exec db pg_dump -U game investment_game > backup-$(date -u +%Y%m%d).sql
```

Schedule via cron; push to S3-compatible storage. Retention per IRB protocol.
