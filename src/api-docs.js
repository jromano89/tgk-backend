const API_ROUTES = [
  {
    method: 'GET',
    path: '/api/health',
    tag: 'system',
    summary: 'Health check'
  },
  {
    method: 'GET',
    path: '/api/docs',
    tag: 'system',
    summary: 'Human-readable API docs'
  },
  {
    method: 'GET',
    path: '/api/docs.json',
    tag: 'system',
    summary: 'OpenAPI JSON'
  },
  {
    method: 'GET',
    path: '/api/auth/login',
    tag: 'auth',
    summary: 'Redirect to Docusign consent',
    query: [{ name: 'scopes', required: true, description: 'Space-delimited Docusign scopes.' }]
  },
  {
    method: 'GET',
    path: '/api/auth/callback',
    tag: 'auth',
    summary: 'Docusign consent callback page'
  },
  {
    method: 'POST',
    path: '/api/auth/token',
    tag: 'auth',
    summary: 'Mint a Docusign access token',
    body: true
  },
  {
    method: 'ANY',
    path: '/api/proxy',
    tag: 'proxy',
    summary: 'Passthrough proxy',
    query: [{ name: 'url', required: true, description: 'Absolute target URL.' }],
    body: true
  },
  {
    method: 'GET',
    path: '/api/data/events',
    tag: 'data',
    summary: 'Server-Sent Events stream for app-scoped data changes',
    query: [{ name: 'app', required: true, description: 'App slug.' }],
    eventStream: true
  },
  ...resourceRoutes('employees', { canDelete: true }),
  ...resourceRoutes('customers', { canDelete: true }),
  ...resourceRoutes('transactions', { canDelete: true }),
  ...resourceRoutes('tasks', { canDelete: true }),
  {
    method: 'GET',
    path: '/maestro',
    tag: 'maestro',
    summary: 'Maestro bridge status'
  },
  {
    method: 'GET',
    path: '/maestro/manifest/clientCredentials.ReadWriteManifest.json',
    tag: 'maestro',
    summary: 'Generated Maestro extension manifest'
  },
  {
    method: 'POST',
    path: '/maestro/oauth/token',
    tag: 'maestro',
    summary: 'Client credentials token endpoint',
    body: true
  },
  {
    method: 'POST',
    path: '/maestro/api/dataio/{action}',
    tag: 'maestro',
    summary: 'Maestro Data IO action',
    pathParams: [{ name: 'action', required: true, description: 'createRecord, patchRecord, searchRecords, getTypeNames, or getTypeDefinitions.' }],
    body: true
  }
];

function resourceRoutes(resource, { canDelete }) {
  const collectionPath = `/api/data/${resource}`;
  const itemPath = `${collectionPath}/{id}`;
  const routes = [
    {
      method: 'GET',
      path: collectionPath,
      tag: 'data',
      summary: `List ${resource}`,
      query: appSlugQuery()
    },
    {
      method: 'POST',
      path: collectionPath,
      tag: 'data',
      summary: `Create ${resource.slice(0, -1)}`,
      query: appSlugQuery(),
      body: true
    },
    {
      method: 'GET',
      path: itemPath,
      tag: 'data',
      summary: `Get ${resource.slice(0, -1)}`,
      query: appSlugQuery(),
      pathParams: idPathParam()
    },
    {
      method: 'PUT',
      path: itemPath,
      tag: 'data',
      summary: `Update ${resource.slice(0, -1)}`,
      query: appSlugQuery(),
      pathParams: idPathParam(),
      body: true
    }
  ];

  if (canDelete) {
    routes.push({
      method: 'DELETE',
      path: itemPath,
      tag: 'data',
      summary: `Delete ${resource.slice(0, -1)}`,
      query: appSlugQuery(),
      pathParams: idPathParam()
    });
  }

  return routes;
}

function appSlugQuery() {
  return [{ name: 'app', required: true, description: 'App slug. You may also send X-Demo-App.' }];
}

function idPathParam() {
  return [{ name: 'id', required: true, description: 'Record id.' }];
}

function getBaseUrl(req) {
  if (!req) {
    return '';
  }

  return `${req.protocol}://${req.get('host')}`;
}

function expandAnyMethods(route) {
  if (route.method !== 'ANY') {
    return [route.method];
  }

  return ['GET', 'POST', 'PUT', 'DELETE'];
}

function buildParameters(route) {
  const params = [];

  for (const parameter of route.pathParams || []) {
    params.push({
      name: parameter.name,
      in: 'path',
      required: parameter.required !== false,
      description: parameter.description,
      schema: { type: 'string' }
    });
  }

  for (const parameter of route.query || []) {
    params.push({
      name: parameter.name,
      in: 'query',
      required: !!parameter.required,
      description: parameter.description,
      schema: { type: 'string' }
    });
  }

  return params;
}

function buildOperation(route, method) {
  const operation = {
    tags: [route.tag],
    summary: route.method === 'ANY' ? `${method} ${route.summary}` : route.summary,
    parameters: buildParameters(route),
    responses: {
      200: {
        description: route.eventStream ? 'Event stream opened.' : 'Success.'
      },
      400: { description: 'Bad request.' },
      401: { description: 'Unauthorized.' },
      404: { description: 'Not found.' },
      500: { description: 'Internal server error.' }
    }
  };

  if (route.body && !['GET', 'HEAD'].includes(method)) {
    operation.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true }
        }
      }
    };
  }

  if (route.eventStream) {
    operation.responses[200].content = {
      'text/event-stream': {
        schema: { type: 'string' }
      }
    };
  } else {
    operation.responses[200].content = {
      'application/json': {
        schema: { type: 'object', additionalProperties: true }
      }
    };
  }

  return operation;
}

function buildPaths() {
  const paths = {};

  for (const route of API_ROUTES) {
    paths[route.path] = paths[route.path] || {};
    for (const method of expandAnyMethods(route)) {
      paths[route.path][method.toLowerCase()] = buildOperation(route, method);
    }
  }

  return paths;
}

function buildApiSpec({ title, version, req }) {
  return {
    openapi: '3.0.3',
    info: {
      title,
      version
    },
    servers: [
      { url: getBaseUrl(req) || '/' }
    ],
    tags: [
      { name: 'system' },
      { name: 'auth' },
      { name: 'proxy' },
      { name: 'data' },
      { name: 'maestro' }
    ],
    paths: buildPaths()
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDocsHtml({ title, version, req }) {
  const baseUrl = getBaseUrl(req);
  const routeRows = API_ROUTES.map((route) => `
    <tr>
      <td><code>${escapeHtml(route.method)}</code></td>
      <td><code>${escapeHtml(route.path)}</code></td>
      <td>${escapeHtml(route.summary)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} API Docs</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f8fafc;color:#0f172a}
    main{max-width:980px;margin:0 auto;padding:40px 20px 56px}
    h1{font-size:28px;margin:0 0 8px}
    p{color:#475569;line-height:1.6}
    a{color:#1d4ed8}
    table{width:100%;border-collapse:collapse;margin-top:24px;background:#fff;border:1px solid #e2e8f0}
    th,td{text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top}
    th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;background:#f1f5f9}
    code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
    .meta{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
    .meta a{display:inline-flex;text-decoration:none;border:1px solid #cbd5e1;border-radius:6px;padding:8px 10px;background:#fff}
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>Version ${escapeHtml(version)}. Base URL: <code>${escapeHtml(baseUrl || '/')}</code>.</p>
    <p>Data routes require an app slug through <code>?app=...</code> or <code>X-Demo-App</code>. The proxy route is intentionally public for this demo backend.</p>
    <div class="meta">
      <a href="/api/docs.json">OpenAPI JSON</a>
      <a href="/api/health">Health</a>
      <a href="/maestro/manifest/clientCredentials.ReadWriteManifest.json">Maestro Manifest</a>
    </div>
    <table>
      <thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead>
      <tbody>${routeRows}</tbody>
    </table>
  </main>
</body>
</html>`;
}

module.exports = {
  buildApiSpec,
  buildDocsHtml
};
