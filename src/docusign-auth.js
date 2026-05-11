const crypto = require('crypto');
const { config } = require('./config');

function getOauthBase() {
  return config.docusign.oauthBase;
}

function getIntegrationKey() {
  const value = config.docusign.integrationKey;
  if (!value) {
    throw new Error('Missing DOCUSIGN_INTEGRATION_KEY');
  }

  return value;
}

function getPrivateKey() {
  const value = config.docusign.rsaPrivateKey;
  if (!value) {
    throw new Error('Missing DOCUSIGN_RSA_PRIVATE_KEY');
  }

  return value
    .replace(/\\\r?\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function normalizeScopes(scopes) {
  const requested = Array.isArray(scopes)
    ? scopes
    : String(scopes || '').split(/\s+/);

  return [...new Set(requested.map((scope) => String(scope || '').trim()).filter(Boolean))];
}

function normalizeScopeString(scopes) {
  return normalizeScopes(scopes).join(' ');
}

async function requestJson(url, options, errorLabel) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const details = await response.text().catch(() => response.statusText);
    throw new Error(`${errorLabel}: ${response.status} ${details}`);
  }

  return response.json();
}

function signJwt(value, privateKey) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(value);
  return base64url(signer.sign(privateKey));
}

async function getAccessToken(userId, accountId, scopes) {
  const normalizedUserId = String(userId || '').trim();
  const normalizedAccountId = String(accountId || '').trim();
  const scopeString = normalizeScopeString(scopes);

  if (!normalizedUserId) {
    throw new Error('Missing Docusign user ID.');
  }
  if (!normalizedAccountId) {
    throw new Error('Missing Docusign account ID.');
  }
  if (!scopeString) {
    throw new Error('Missing Docusign scopes.');
  }

  const now = Math.floor(Date.now() / 1000);
  const assertionPayload = {
    iss: getIntegrationKey(),
    sub: normalizedUserId,
    aud: getOauthBase(),
    iat: now,
    exp: now + 3600,
    scope: scopeString
  };
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(assertionPayload));
  const signingInput = `${header}.${payload}`;
  const assertion = `${signingInput}.${signJwt(signingInput, getPrivateKey())}`;

  const tokenData = await requestJson(`https://${getOauthBase()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }).toString()
  }, 'Docusign JWT grant failed');

  const expiresAt = Date.now() + (Number(tokenData.expires_in || 0) * 1000);

  return {
    accessToken: tokenData.access_token,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

function getConsentUrl(redirectUri, scopes) {
  const scopeString = normalizeScopeString(scopes);
  if (!scopeString) {
    throw new Error('Missing Docusign scopes');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    scope: scopeString,
    client_id: getIntegrationKey(),
    redirect_uri: redirectUri,
    prompt: 'login'
  });

  return `https://${getOauthBase()}/oauth/auth?${params.toString()}`;
}

function base64url(value) {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

module.exports = {
  getAccessToken,
  getConsentUrl,
  normalizeScopeString
};
