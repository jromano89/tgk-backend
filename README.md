# TGK Demo Platform

TGK Wealth demo platform for DocuSign IAM and Maestro workflows.

The intent is to keep the demo frontends simple and static while reusing one lightweight backend for auth, proxying, local persistence, and Maestro bridge behavior.

The frontend has no build step. It is plain HTML, CSS, and JS, served by the small Node server in `frontend/server.js` so it can run cleanly on Railway or any other simple Node host.

## Structure

- `frontend/`: portal launcher plus advisor and investor demo portals
- `backend/`: Express/SQLite API, DocuSign auth/proxy, Maestro bridge, SSE data-change notifications, architecture page
- `frontend/config.js`: frontend config, workflow IDs, mode gate, and DocuSign settings
- `scripts/seed-demo-api.js`: optional demo data loader

## Local

1. Create `backend/.env`.

```bash
cp backend/.env.example backend/.env
```

2. Install backend dependencies if needed.

```bash
npm install --prefix backend
```

3. Start both services from the repo root.

```bash
npm run dev
```

4. Optionally seed demo data from the repo root.

```bash
npm run seed
```

Useful local URLs:

- `http://localhost:8080/` (front-end)
- `http://localhost:3000/` (back-end)

## Notes

- Core app data resources are `employees`, `customers`, `transactions` (with free-form `type`), and `tasks`.
- Frontend runtime config lives in `frontend/config.js`.
- The backend-hosted DocuSign consent callback is fixed at `/api/auth/callback`.
- The frontend gets DocuSign access tokens from `POST /api/auth/token` and sends downstream API calls through `/api/proxy?url=<encoded-target-url>`.
- `GET /api/data/events?app=...` opens an app-scoped Server-Sent Events stream for `connected` and `data.changed` events from REST data writes and Maestro Data IO writes.

## Deployment

- Frontend service: run `npm start` in `frontend/`
- Backend service: run `npm start` in `backend/`
- Persist `backend/data/`, or override `TGK_DB_PATH`
