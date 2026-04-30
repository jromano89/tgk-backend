const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const { buildApiSpec, buildDocsHtml } = require('./api-docs');
const { getDb } = require('./database');
const API_TITLE = 'TGK Demo Backend';
const API_VERSION = '3.0.0';

// Load both repo-root .env and backend/.env for local runs; existing env vars still win.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function isDocusignConfigured() {
  return Boolean(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_RSA_PRIVATE_KEY);
}

function setOpenCorsHeaders(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Demo-App');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
}

function createApp() {
  const app = express();

  // Railway terminates TLS at the edge, so trust the first proxy hop for req.protocol/hostname.
  app.set('trust proxy', 1);
  app.use(setOpenCorsHeaders);

  // Proxy requests can carry arbitrary payloads, so mount it before the JSON parser.
  app.use('/api/proxy', require('./routes/proxy'));
  app.use('/architecture', express.static(path.resolve(__dirname, '..', 'public', 'architecture')));
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', '..', 'frontend', 'shared', 'favicon.ico'));
  });

  app.use(express.json({ limit: '1mb' }));
  getDb();

  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html><head><title>${API_TITLE}</title>
<style>*{margin:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
body{background:#101522;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
.c{max-width:640px;padding:2.5rem;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.25)}
.eyebrow{display:inline-flex;align-items:center;border-radius:999px;background:rgba(96,165,250,.14);color:#bfdbfe;padding:.35rem .7rem;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;margin-bottom:1rem}
h1{font-size:1.9rem;line-height:1.15;margin-bottom:.75rem}
p{color:#cbd5e1;font-size:.96rem;line-height:1.65;margin-bottom:1.2rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.95em}
.links{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.75rem}
a{display:inline-flex;background:#2563eb;color:#fff;text-decoration:none;padding:.7rem 1rem;border-radius:.7rem;font-size:.9rem}
a.alt{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:#e2e8f0}
a:hover{background:#3b82f6}
a.alt:hover{background:rgba(255,255,255,.1)}
.tag{font-size:.78rem;color:#94a3b8;margin-top:1.5rem}</style></head>
<body><div class="c">
<div class="eyebrow">Reusable Demo Backend</div>
<h1>${API_TITLE}</h1>
<p>CORS-enabled backend for DocuSign IAM demo portals. TGK Wealth is the current FINS implementation, but the service is structured to support future static demo frontends without rebuilding auth, proxying, storage, and Maestro plumbing each time.</p>
<p>Demo data routes can be scoped with <code>?app=...</code> or <code>X-Demo-App</code> when multiple demos share one backend.</p>
<div class="links">
<a href="/api/health">Health Check</a>
<a class="alt" href="/api/docs">API Docs</a>
<a class="alt" href="/architecture/">Architecture</a>
<a class="alt" href="/maestro/manifest/clientCredentials.ReadWriteManifest.json">Maestro Manifest</a>
</div>
<div class="tag">v${API_VERSION}</div>
</div></body></html>`);
  });

  app.get('/api/docs', (req, res) => {
    res.type('html').send(buildDocsHtml({
      title: API_TITLE,
      version: API_VERSION,
      req
    }));
  });

  app.get('/api/docs.json', (req, res) => {
    res.type('application/openapi+json').send(JSON.stringify(buildApiSpec({
      title: API_TITLE,
      version: API_VERSION,
      req
    }), null, 2));
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/data', require('./routes/resources'));
  app.use('/api/workspace', require('./routes/workspace'));
  app.use('/maestro', require('./routes/maestro'));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      docusignConfigured: isDocusignConfigured()
    });
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

module.exports = {
  createApp,
  isDocusignConfigured
};
