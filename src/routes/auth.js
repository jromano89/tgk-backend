const express = require('express');
const { getAccessToken, getConsentUrl, normalizeScopeString } = require('../docusign-auth');
const { createError, route } = require('../utils');

const router = express.Router();

function getCallbackUrl(req) {
  return `${req.protocol}://${req.get('host')}/api/auth/callback`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeTokenRequest(body = {}) {
  const userId = String(body.userId || '').trim();
  const accountId = String(body.accountId || '').trim();
  const scopes = normalizeScopeString(body.scopes);

  if (!userId) {
    throw createError(400, 'Missing Docusign user ID.');
  }
  if (!accountId) {
    throw createError(400, 'Missing Docusign account ID.');
  }
  if (!scopes) {
    throw createError(400, 'Missing Docusign scopes.');
  }

  return { userId, accountId, scopes };
}

function renderConsentResult(status, message) {
  const normalizedStatus = status === 'success' ? 'success' : 'error';
  const escapedMessage = escapeHtml(message);
  const payload = JSON.stringify({
    source: 'tgk-docusign-consent',
    status: normalizedStatus,
    message
  });

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Docusign Consent</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#0f172a}
      .card{max-width:360px;padding:24px;border-radius:18px;background:#fff;box-shadow:0 12px 32px rgba(15,23,42,.12);text-align:center}
      h1{margin:0 0 8px;font-size:18px}
      p{margin:0;color:#475569;font-size:14px;line-height:1.5}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${normalizedStatus === 'success' ? 'Consent granted' : 'Consent failed'}</h1>
      <p>${escapedMessage}</p>
    </div>
    <script>
      const payload = ${payload};

      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
        }
      } catch (error) {
        console.error(error);
      }

      window.setTimeout(() => {
        window.close();
      }, 2200);
    </script>
  </body>
</html>`;
}

router.get('/login', route((req, res) => {
  const scopes = normalizeScopeString(req.query.scopes);
  if (!scopes) {
    throw createError(400, 'Missing Docusign scopes.');
  }

  res.redirect(getConsentUrl(getCallbackUrl(req), scopes));
}));

router.get('/callback', route((req, res) => {
  const errorMessage = String(req.query.error_description || req.query.error || '').trim();
  const hasCode = String(req.query.code || '').trim();

  if (errorMessage) {
    return res.type('html').send(renderConsentResult('error', errorMessage));
  }

  if (!hasCode) {
    return res.type('html').send(renderConsentResult('error', 'Missing Docusign consent code.'));
  }

  return res.type('html').send(
    renderConsentResult('success', 'You can close this window. It will close automatically.')
  );
}));

router.post('/token', route(async (req, res) => {
  const { userId, accountId, scopes } = normalizeTokenRequest(req.body);
  res.json(await getAccessToken(userId, accountId, scopes));
}));

module.exports = router;
