const JSON_FIELD_NAMES = ['data'];

function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asObject(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function parseJsonFields(row) {
  if (!row) return row;
  const parsed = { ...row };

  for (const key of JSON_FIELD_NAMES) {
    if (parsed[key] && typeof parsed[key] === 'string') {
      try {
        parsed[key] = JSON.parse(parsed[key]);
      } catch (error) {
        // Ignore invalid JSON and keep the raw value.
      }
    }
  }

  return parsed;
}

function serializeJson(value) {
  return value == null ? null : JSON.stringify(value);
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function getAppSlug(req) {
  const bodyApp = isPlainObject(req.body) ? req.body.app : null;

  return normalizeSlug(
    req.headers['x-demo-app']
    || req.query?.app
    || bodyApp?.slug
    || req.body?.appSlug
  );
}

function requireAppSlug(req) {
  const slug = getAppSlug(req);
  if (!slug) {
    throw createError(400, 'Missing app slug. Set TGK_CONFIG.appSlug on the frontend.');
  }

  return slug;
}

function requireSlugValue(value, message = 'Missing app slug.') {
  const slug = normalizeSlug(value);
  if (!slug) {
    throw createError(400, message);
  }

  return slug;
}

function sendError(res, error) {
  res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
}

function route(handler) {
  return function handleRoute(req, res, next) {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch((error) => sendError(res, error));
  };
}

module.exports = {
  asObject,
  createError,
  getAppSlug,
  isPlainObject,
  normalizeOptionalString,
  normalizeSlug,
  parseJsonFields,
  requireAppSlug,
  requireSlugValue,
  route,
  sendError,
  serializeJson
};
