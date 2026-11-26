# Portfolio API

Express backend for the portfolio's owner login. Runs on Render, with users in TiDB Cloud
(MySQL-compatible) or, locally, a MySQL 8 server.

| Route | Who | What |
|---|---|---|
| `GET /health` | anyone | Render's health check; the site also uses it to wake the server |
| `POST /api/auth/login` | anyone | `{ username, password }` → a 7-day token |
| `GET /api/auth/me` | owner | who the token belongs to |

Passwords are scrypt hashes; tokens are HMAC-SHA256 signed (Node's crypto, no extra package).
After 10 failed logins from one address in 15 minutes, logins from it wait. The `users` table is
created on start.

Node 24 runs the `.ts` files directly (type stripping), so there's no build step. Type-check from
the repo root with `npm run check:server`.

## Run it locally

1. `cd server && npm install`
2. Copy `.env.example` to `.env` and fill it in (`DATABASE_URL`, a random `AUTH_SECRET`).
3. Create your login: `npm run create-owner` (asks for a username and password).
4. `npm run dev` (port 4100; Tugon's dev servers use 3000 and 3001).
5. In the repo root, `.env.local` has `VITE_API_URL=http://localhost:4100`; then `npm run dev`.

## Deploy

**TiDB Cloud**: copy the **General** connection string into `DATABASE_URL`. TLS is required and
on by default. Render's free plan has no fixed IP, so TiDB's IP allow list must allow all addresses.

**Render**: New **Web Service** from this repo: Root Directory `server`, Build Command `npm ci`,
Start Command `npm start`, Health Check Path `/health`, environment from `.env.example` plus
`NODE_VERSION=24`, with `FRONTEND_ORIGIN` set to the Netlify URL. The free plan sleeps after 15
idle minutes; the first request then takes up to a minute.

**Netlify**: set `VITE_API_URL` to the Render URL (no trailing slash) and redeploy.
