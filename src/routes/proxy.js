const express = require('express');
const { createError, route } = require('../utils');

const router = express.Router();
const BLOCKED_HEADERS = new Set(['connection', 'content-length', 'cookie', 'host', 'origin', 'referer', 'transfer-encoding']);

router.use(express.raw({ type: '*/*', limit: '1mb' }));

router.all('/', route(async (req, res) => {
  const targetUrl = normalizeTargetUrl(req.query?.url);
  const response = await fetch(targetUrl, {
    method: String(req.method || 'GET').toUpperCase(),
    headers: buildHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(String(req.method || 'GET').toUpperCase()) ? undefined : req.body
  });

  await sendProxyResponse(response, res);
}));

function normalizeTargetUrl(value) {
  const targetUrl = String(value || '').trim();
  if (!targetUrl) {
    throw createError(400, 'Missing proxy target. Provide "url".');
  }

  try {
    return new URL(targetUrl).toString();
  } catch (error) {
    throw createError(400, 'Invalid proxy target URL.');
  }
}

function buildHeaders(requestHeaders) {
  const headers = {};

  Object.entries(requestHeaders || {}).forEach(([key, value]) => {
    if (!key || value === undefined || BLOCKED_HEADERS.has(key.toLowerCase())) {
      return;
    }

    headers[key] = Array.isArray(value) ? value.join(', ') : value;
  });

  return headers;
}

async function sendProxyResponse(response, res) {
  const contentType = response.headers.get('content-type');
  const cacheControl = response.headers.get('cache-control');
  const contentDisposition = response.headers.get('content-disposition');

  if (contentType) {
    res.set('Content-Type', contentType);
  }
  if (cacheControl) {
    res.set('Cache-Control', cacheControl);
  }
  if (contentDisposition) {
    res.set('Content-Disposition', contentDisposition);
  }

  res.status(response.status);

  if (contentType && contentType.includes('application/json')) {
    return res.json(await response.json());
  }
  if (contentType && (contentType.startsWith('text/') || contentType.includes('xml') || contentType.includes('javascript'))) {
    return res.send(await response.text());
  }

  return res.send(Buffer.from(await response.arrayBuffer()));
}

module.exports = router;
