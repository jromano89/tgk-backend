const express = require('express');
const { getDb } = require('../database');
const resourceService = require('../resources/service');
const { createError, requireSlugValue } = require('../utils');
const { config } = require('../maestro/config');
const { setResourceAccess } = require('../maestro/resource-client');
const { buildManifest } = require('../maestro/manifest');
const {
  getTypeDefinitions,
  getTypeNames,
  resolveDataIoService
} = require('../maestro/dataio-registry');

const router = express.Router();

const INFO_TEXT_ROUTES = {
  '/support': 'TGK Maestro support.',
  '/privacy': 'Demo-only Maestro bridge for local and private testing.',
  '/terms': 'Demo-only Maestro bridge for DocuSign extension app testing.'
};

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function requireAppSlug(appSlug) {
  try {
    return requireSlugValue(appSlug, 'Maestro requests must include appSlug.');
  } catch (error) {
    const wrappedError = createError(error.statusCode || 400, error.message);
    wrappedError.code = 'BAD_REQUEST';
    throw wrappedError;
  }
}

function createResourceAccess(resourceKey) {
  return {
    create(appSlug, payload) {
      const db = getDb();
      const resolvedAppSlug = requireAppSlug(appSlug);
      return resourceService.createRecordForApp(db, resolvedAppSlug, resourceKey, payload);
    },
    get(appSlug, recordId) {
      const db = getDb();
      if (appSlug) {
        return resourceService.getRecordForApp(db, requireAppSlug(appSlug), resourceKey, recordId);
      }

      return resourceService.getRecordById(db, resourceKey, recordId);
    },
    list(appSlug, filters) {
      const db = getDb();
      return resourceService.listRecordsForApp(db, requireAppSlug(appSlug), resourceKey, filters || {});
    },
    update(appSlug, recordId, payload) {
      const db = getDb();
      const resolvedAppSlug = appSlug
        ? requireAppSlug(appSlug)
        : resourceService.getRecordById(db, resourceKey, recordId).appSlug;
      return resourceService.updateRecordForApp(db, resolvedAppSlug, resourceKey, recordId, payload);
    }
  };
}

setResourceAccess({
  customers: createResourceAccess('customers'),
  employees: createResourceAccess('employees'),
  transactions: createResourceAccess('transactions'),
  tasks: createResourceAccess('tasks')
});

function createErrorResponse(error) {
  if (error.code) {
    return {
      message: error.message,
      code: error.code
    };
  }

  return {
    error: error.message || 'Internal server error'
  };
}

function logRequestError(scope, error, details = {}) {
  const payload = {
    scope,
    message: error.message,
    statusCode: error.statusCode || 500,
    code: error.code || '',
    ...details
  };

  if (error.context) {
    payload.context = error.context;
  }

  if (error.stack) {
    payload.stack = error.stack;
  }

  console.error(JSON.stringify(payload));
}

function route(handler) {
  return async function handleMaestroRoute(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      logRequestError('maestro', error, {
        path: req.originalUrl,
        method: req.method
      });
      res.status(error.statusCode || 500).json(createErrorResponse(error));
    }
  };
}

function isAuthorized(req) {
  return String(req.headers.authorization || '') === `Bearer ${config.oauthAccessToken}`;
}

function readBasicAuthCredentials(req) {
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = Buffer.from(authorization.slice('Basic '.length).trim(), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return null;
    }

    return {
      clientId: decoded.slice(0, separatorIndex),
      clientSecret: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

function getPublicBaseUrl(req) {
  const configured = trimTrailingSlash(config.publicBaseUrl);
  if (configured) {
    return configured;
  }

  return `${req.protocol}://${req.get('host')}/maestro`;
}

function resolveSearchService(body) {
  return resolveDataIoService(body?.query?.from || body?.from || body?.typeName);
}

function getRequestedTypeNames(body) {
  return new Set((body?.typeNames || []).map((item) =>
    String(typeof item === 'string' ? item : item?.typeName || '').toLowerCase()
  ));
}

function buildTypeDefinitionsResponse(body) {
  return getTypeDefinitions([...getRequestedTypeNames(body)]);
}

const DATA_IO_HANDLERS = {
  createRecord: (body) => resolveDataIoService(body?.typeName).createRecord(body),
  patchRecord: (body) => resolveDataIoService(body?.typeName).patchRecord(body),
  searchRecords: (body) => resolveSearchService(body).searchRecords(body),
  getTypeNames: () => ({ typeNames: getTypeNames() }),
  getTypeDefinitions: (body) => buildTypeDefinitionsResponse(body)
};

router.use(express.urlencoded({ extended: false }));

router.get('/', route((req, res) => {
  res.json({
    service: 'tgk-maestro',
    status: 'ok',
    mode: 'in-process',
    manifest: `${getPublicBaseUrl(req)}/manifest/clientCredentials.ReadWriteManifest.json`
  });
}));

router.get('/manifest/clientCredentials.ReadWriteManifest.json', route((req, res) => {
  res.json(buildManifest(getPublicBaseUrl(req)));
}));

Object.entries(INFO_TEXT_ROUTES).forEach(([pathname, text]) => {
  router.get(pathname, route((req, res) => {
    res.type('text/plain').send(text);
  }));
});

router.post('/oauth/token', route((req, res) => {
  const body = req.body || {};
  if (body.grant_type !== 'client_credentials') {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only client_credentials is supported.'
    });
  }

  const basicAuth = readBasicAuthCredentials(req);
  const clientId = body.client_id || basicAuth?.clientId || '';
  const clientSecret = body.client_secret || basicAuth?.clientSecret || '';

  if (clientId !== config.oauthClientId || clientSecret !== config.oauthClientSecret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials.'
    });
  }

  return res.json({
    access_token: config.oauthAccessToken,
    token_type: 'Bearer',
    expires_in: 3600
  });
}));

router.post('/api/dataio/:action', route(async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const handler = DATA_IO_HANDLERS[req.params.action];
  if (!handler) {
    return res.status(404).json({ error: 'Not found' });
  }

  const payload = await handler(req.body || {});
  return res.json(payload);
}));

module.exports = router;
