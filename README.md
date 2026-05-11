# TGK Backend

Standalone Express/SQLite backend for the TGK Wealth demo

This service owns Docusign auth helpers, API proxying, app-scoped demo data, Server-Sent Events, and Maestro Data IO endpoints. The TGK front end is in a separate static repo, and should treat this API as the hosted shared service.

## Local Development

```bash
cp .env.example .env
npm install
npm run dev
```

Useful local URLs:

- `http://localhost:3000/`
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/docs`
- `http://localhost:3000/architecture/`

## Railway

Create the backend service from this repo root.

- Install command: `npm install`
- Start command: `npm start`
- Railway should provide `PORT`; keep `PORT=3000` only for local `.env` use.
- The default SQLite path is `./data/demo.db`. For durable hosted data, attach a Railway volume and set `TGK_DB_PATH` to the mounted database path, for example `/data/demo.db` if the volume is mounted at `/data`.
- If `TGK_DB_PATH` is set and cannot be initialized, startup fails instead of falling back to local ephemeral storage.

Required Docusign variables:

- DOCUSIGN_INTEGRATION_KEY
- DOCUSIGN_RSA_PRIVATE_KEY

Optional Docusign variable:

- DOCUSIGN_OAUTH_BASE, defaults to `account-d.docusign.com`

Maestro variables:

- MAESTRO_PUBLIC_BASE_URL
- MAESTRO_CLIENT_ID
- MAESTRO_CLIENT_SECRET
- MAESTRO_ACCESS_TOKEN
- MAESTRO_PUBLISHER_NAME
- MAESTRO_PUBLISHER_EMAIL
- MAESTRO_PUBLISHER_PHONE

## Frontend Contract

Hosted backend URL currently used by the static front end:

```text
https://backend-tgk.up.railway.app
```

The backend intentionally sends open CORS headers for modularity

Key endpoints:

- `GET /api/health`: service health and Docusign configuration state
- `GET /api/docs`: human-readable API docs
- `GET /api/docs.json`: OpenAPI JSON
- `GET /api/auth/login?scopes=...`: Docusign consent redirect
- `GET /api/auth/callback`: Docusign consent callback page
- `POST /api/auth/token`: mints a Docusign access token using backend credentials
- `GET|POST|PUT|DELETE /api/proxy?url=<encoded-url>`: Docusign API proxy
- `GET /api/data/events?app=tgk-wealth`: app-scoped SSE stream
- `/api/data/employees`, `/api/data/customers`, `/api/data/transactions`, `/api/data/tasks`: app-scoped demo data APIs
- `/maestro/api/dataio/:action`: Maestro Data IO bridge
- `GET /maestro/manifest/clientCredentials.ReadWriteManifest.json`: generated Maestro manifest

For `/api/data/*`, pass the app slug as `?app=tgk-wealth` or `X-Demo-App: tgk-wealth`.

The Docusign app redirect URI should point at the hosted backend callback:

```text
https://your-backend-domain.up.railway.app/api/auth/callback
```
