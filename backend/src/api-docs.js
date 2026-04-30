function getServerUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function buildApiSpec({ title, version, req }) {
  const serverUrl = getServerUrl(req);

  return {
    openapi: '3.1.0',
    info: {
      title: `${title} API`,
      version,
      description: 'Concise reference for the TGK demo backend.'
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'docs', description: 'API documentation endpoints' },
      { name: 'system', description: 'System endpoints' },
      { name: 'auth', description: 'DocuSign auth endpoints' },
      { name: 'proxy', description: 'Public passthrough proxy' },
      { name: 'data', description: 'App-scoped demo data' },
      { name: 'maestro', description: 'Maestro bridge endpoints' }
    ],
    paths: {
      '/api/docs': {
        get: htmlOperation('docs', 'Human API docs')
      },
      '/api/docs.json': {
        get: jsonOperation('docs', 'OpenAPI JSON', { schema: genericObjectSchema() })
      },
      '/api/health': {
        get: jsonOperation('system', 'Health check', { schemaRef: '#/components/schemas/Health' })
      },
      '/api/auth/login': {
        get: {
          tags: ['auth'],
          summary: 'Start DocuSign consent',
          parameters: [
            {
              name: 'scopes',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Space-delimited DocuSign scopes.'
            }
          ],
          responses: {
            302: { description: 'Redirects to DocuSign consent.' },
            400: jsonErrorResponse()
          }
        }
      },
      '/api/auth/callback': {
        get: {
          tags: ['auth'],
          summary: 'DocuSign consent callback',
          parameters: [
            optionalQueryParam('code', 'DocuSign consent code.'),
            optionalQueryParam('error', 'OAuth error code.'),
            optionalQueryParam('error_description', 'OAuth error message.')
          ],
          responses: {
            200: {
              description: 'HTML callback result.',
              content: {
                'text/html': {
                  schema: { type: 'string' }
                }
              }
            }
          }
        }
      },
      '/api/auth/token': {
        post: {
          tags: ['auth'],
          summary: 'Mint a DocuSign access token',
          requestBody: jsonRequestBody('#/components/schemas/DocusignTokenRequest'),
          responses: {
            200: jsonSchemaResponse('#/components/schemas/DocusignTokenResponse'),
            400: jsonErrorResponse(),
            500: jsonErrorResponse()
          }
        }
      },
      '/api/proxy': {
        get: proxyOperation('GET passthrough proxy'),
        post: proxyOperation('POST passthrough proxy', true),
        put: proxyOperation('PUT passthrough proxy', true),
        delete: proxyOperation('DELETE passthrough proxy', true)
      },
      '/api/data/events': {
        get: {
          tags: ['data'],
          summary: 'Subscribe to app-scoped data changes',
          description: 'Server-Sent Events stream for app-scoped demo data changes. The stream sends a `connected` event on subscribe, heartbeat comments about every 25 seconds, and `data.changed` events when REST data routes create, update, or delete records, or when Maestro Data IO create/patch writes records. `data.changed` payloads include `type`, `appSlug`, `resource`, `action`, `id`, `record`, and `timestamp`.',
          parameters: [appQueryParam(), appHeaderParam()],
          responses: {
            200: {
              description: 'SSE stream of data change events.',
              content: {
                'text/event-stream': {
                  schema: { type: 'string' },
                  examples: {
                    dataChanged: {
                      summary: 'Record update event',
                      value: 'event: data.changed\ndata: {"type":"data.changed","appSlug":"tgk","resource":"customers","action":"update","id":"customer-1","record":{"id":"customer-1"},"timestamp":"2026-04-10T12:00:00.000Z"}\n\n'
                    }
                  }
                }
              }
            },
            400: jsonErrorResponse()
          }
        }
      },
      '/api/data/employees': {
        get: listOperation('employees', 'List employees', '#/components/schemas/Employee', [
          appQueryParam(),
          appHeaderParam(),
          optionalQueryParam('search', 'Text search.')
        ]),
        post: createOperation('employees', 'Create employee', '#/components/schemas/EmployeeInput', '#/components/schemas/Employee')
      },
      '/api/data/employees/{id}': {
        get: getOperation('employees', 'Get employee', '#/components/schemas/Employee'),
        put: updateOperation('employees', 'Update employee', '#/components/schemas/EmployeeInput', '#/components/schemas/Employee')
      },
      '/api/data/customers': {
        get: listOperation('customers', 'List customers', '#/components/schemas/Customer', [
          appQueryParam(),
          appHeaderParam(),
          optionalQueryParam('status', 'Filter by status.'),
          optionalQueryParam('employeeId', 'Filter by employee id.'),
          optionalQueryParam('search', 'Text search.')
        ]),
        post: createOperation('customers', 'Create customer', '#/components/schemas/CustomerInput', '#/components/schemas/Customer')
      },
      '/api/data/customers/{id}': {
        get: {
          ...getOperation('customers', 'Get customer', '#/components/schemas/Customer'),
          parameters: [
            idPathParam(),
            appQueryParam(),
            appHeaderParam(),
            optionalQueryParam('includeTransactions', 'Include related transactions when truthy.'),
            optionalQueryParam('includeTasks', 'Include related tasks when truthy.')
          ]
        },
        put: updateOperation('customers', 'Update customer', '#/components/schemas/CustomerInput', '#/components/schemas/Customer'),
        delete: deleteOperation('customers', 'Delete customer')
      },
      '/api/data/transactions': {
        get: listOperation('transactions', 'List transactions', '#/components/schemas/Transaction', [
          appQueryParam(),
          appHeaderParam(),
          optionalQueryParam('id', 'Filter by transaction id.'),
          optionalQueryParam('type', 'Filter by transaction type.'),
          optionalQueryParam('status', 'Filter by status.'),
          optionalQueryParam('employeeId', 'Filter by employee id.'),
          optionalQueryParam('customerId', 'Filter by customer id.'),
          optionalQueryParam('search', 'Text search.')
        ]),
        post: createOperation('transactions', 'Create transaction', '#/components/schemas/TransactionInput', '#/components/schemas/Transaction')
      },
      '/api/data/transactions/{id}': {
        get: getOperation('transactions', 'Get transaction', '#/components/schemas/Transaction'),
        put: updateOperation('transactions', 'Update transaction', '#/components/schemas/TransactionInput', '#/components/schemas/Transaction')
      },
      '/api/data/tasks': {
        get: listOperation('tasks', 'List tasks', '#/components/schemas/Task', [
          appQueryParam(),
          appHeaderParam(),
          optionalQueryParam('id', 'Filter by task id.'),
          optionalQueryParam('status', 'Filter by status.'),
          optionalQueryParam('employeeId', 'Filter by employee id.'),
          optionalQueryParam('customerId', 'Filter by customer id.'),
          optionalQueryParam('search', 'Text search.')
        ]),
        post: createOperation('tasks', 'Create task', '#/components/schemas/TaskInput', '#/components/schemas/Task')
      },
      '/api/data/tasks/{id}': {
        get: getOperation('tasks', 'Get task', '#/components/schemas/Task'),
        put: updateOperation('tasks', 'Update task', '#/components/schemas/TaskInput', '#/components/schemas/Task'),
        delete: deleteOperation('tasks', 'Delete task')
      },
      '/maestro': {
        get: jsonOperation('maestro', 'Maestro service status', { schemaRef: '#/components/schemas/MaestroStatus' })
      },
      '/maestro/manifest/clientCredentials.ReadWriteManifest.json': {
        get: jsonOperation('maestro', 'Maestro manifest', { schema: genericObjectSchema() })
      },
      '/maestro/support': {
        get: textOperation('maestro', 'Support text')
      },
      '/maestro/privacy': {
        get: textOperation('maestro', 'Privacy text')
      },
      '/maestro/terms': {
        get: textOperation('maestro', 'Terms text')
      },
      '/maestro/oauth/token': {
        post: {
          tags: ['maestro'],
          summary: 'Maestro OAuth token',
          description: 'Accepts HTTP Basic auth and/or form fields.',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    grant_type: { type: 'string', enum: ['client_credentials'] },
                    client_id: { type: 'string' },
                    client_secret: { type: 'string' }
                  },
                  required: ['grant_type']
                }
              }
            }
          },
          responses: {
            200: jsonSchemaResponse('#/components/schemas/MaestroOAuthToken'),
            400: jsonErrorResponse(),
            401: jsonErrorResponse()
          }
        }
      },
      '/maestro/api/dataio/{action}': {
        post: {
          tags: ['maestro'],
          summary: 'Maestro Data IO action',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'action',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                enum: ['createRecord', 'patchRecord', 'searchRecords', 'getTypeNames', 'getTypeDefinitions']
              }
            }
          ],
          requestBody: jsonRequestBody('#/components/schemas/MaestroDataIoRequest'),
          responses: {
            200: jsonSchemaResponse('#/components/schemas/MaestroDataIoResponse'),
            401: jsonErrorResponse(),
            404: jsonErrorResponse()
          }
        }
      }
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      },
      schemas: {
        Health: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            docusignConfigured: { type: 'boolean' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' }
          },
          additionalProperties: true
        },
        DocusignTokenRequest: {
          type: 'object',
          required: ['userId', 'accountId', 'scopes'],
          properties: {
            userId: { type: 'string' },
            accountId: { type: 'string' },
            scopes: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
              ]
            }
          }
        },
        DocusignTokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        },
        Employee: resourceSchema({
          id: { type: 'string' },
          displayName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          title: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }),
        EmployeeInput: inputSchema({
          id: { type: 'string' },
          displayName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          title: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          appSlug: { type: 'string' }
        }),
        Customer: resourceSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          displayName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          organization: { type: 'string' },
          status: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } }
        }),
        CustomerInput: inputSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          displayName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          organization: { type: 'string' },
          status: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          appSlug: { type: 'string' }
        }),
        Transaction: resourceSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          customerId: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          name: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }),
        TransactionInput: inputSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          customerId: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string' },
          name: { type: 'string' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          appSlug: { type: 'string' }
        }, ['id']),
        Task: resourceSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          customerId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          dueAt: { type: 'string', format: 'date-time' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }),
        TaskInput: inputSchema({
          id: { type: 'string' },
          employeeId: { type: 'string' },
          customerId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          dueAt: { type: 'string', format: 'date-time' },
          data: genericObjectSchema(),
          createdAt: { type: 'string', format: 'date-time' },
          appSlug: { type: 'string' }
        }),
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        },
        MaestroStatus: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            status: { type: 'string' },
            mode: { type: 'string' },
            manifest: { type: 'string', format: 'uri' }
          }
        },
        MaestroOAuthToken: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' },
            expires_in: { type: 'integer' }
          }
        },
        MaestroDataIoRequest: {
          type: 'object',
          properties: {
            typeName: { type: 'string' },
            recordId: { type: 'string' },
            data: genericObjectSchema(),
            query: genericObjectSchema(),
            pagination: genericObjectSchema(),
            typeNames: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  genericObjectSchema()
                ]
              }
            },
            appSlug: { type: 'string' }
          },
          additionalProperties: true
        },
        MaestroDataIoResponse: genericObjectSchema()
      }
    }
  };
}

function buildDocsHtml({ title, version, req }) {
  const spec = buildApiSpec({ title, version, req });
  const serverUrl = spec.servers[0].url;
  const sections = [
    {
      title: 'Docs',
      note: 'HTML and OpenAPI.',
      items: [
        ['GET', '/api/docs', 'This page'],
        ['GET', '/api/docs.json', 'OpenAPI JSON']
      ]
    },
    {
      title: 'System',
      note: 'Public status endpoints.',
      items: [
        ['GET', '/api/health', 'Health JSON']
      ]
    },
    {
      title: 'Auth',
      note: 'DocuSign consent and token minting.',
      items: [
        ['GET', '/api/auth/login?scopes=...', 'Redirect to DocuSign consent'],
        ['GET', '/api/auth/callback', 'DocuSign consent callback HTML'],
        ['POST', '/api/auth/token', 'Mint DocuSign token']
      ]
    },
    {
      title: 'Proxy',
      note: 'Pass a fully encoded target URL in `url`.',
      items: [
        ['GET', '/api/proxy?url=<encoded-url>', 'GET passthrough'],
        ['POST', '/api/proxy?url=<encoded-url>', 'POST passthrough'],
        ['PUT', '/api/proxy?url=<encoded-url>', 'PUT passthrough'],
        ['DELETE', '/api/proxy?url=<encoded-url>', 'DELETE passthrough']
      ]
    },
    {
      title: 'Data',
      note: 'App-scoped demo data and SSE change notifications. Use `?app=...` or `X-Demo-App`.',
      items: [
        ['GET', '/api/data/events?app=...', 'Subscribe to SSE data change events'],
        ['GET', '/api/data/employees', 'List employees'],
        ['POST', '/api/data/employees', 'Create employee'],
        ['GET', '/api/data/employees/{id}', 'Get employee'],
        ['PUT', '/api/data/employees/{id}', 'Update employee'],
        ['GET', '/api/data/customers', 'List customers'],
        ['POST', '/api/data/customers', 'Create customer'],
        ['GET', '/api/data/customers/{id}', 'Get customer'],
        ['PUT', '/api/data/customers/{id}', 'Update customer'],
        ['DELETE', '/api/data/customers/{id}', 'Delete customer'],
        ['GET', '/api/data/transactions', 'List transactions'],
        ['POST', '/api/data/transactions', 'Create transaction'],
        ['GET', '/api/data/transactions/{id}', 'Get transaction'],
        ['PUT', '/api/data/transactions/{id}', 'Update transaction'],
        ['GET', '/api/data/tasks', 'List tasks'],
        ['POST', '/api/data/tasks', 'Create task'],
        ['GET', '/api/data/tasks/{id}', 'Get task'],
        ['PUT', '/api/data/tasks/{id}', 'Update task'],
        ['DELETE', '/api/data/tasks/{id}', 'Delete task']
      ]
    },
    {
      title: 'Maestro',
      note: 'In-process Maestro bridge.',
      items: [
        ['GET', '/maestro', 'Service status'],
        ['GET', '/maestro/manifest/clientCredentials.ReadWriteManifest.json', 'Manifest JSON'],
        ['GET', '/maestro/support', 'Support text'],
        ['GET', '/maestro/privacy', 'Privacy text'],
        ['GET', '/maestro/terms', 'Terms text'],
        ['POST', '/maestro/oauth/token', 'Client credentials token'],
        ['POST', '/maestro/api/dataio/{action}', 'Data IO action']
      ]
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} API Docs</title>
    <style>
      *{box-sizing:border-box;margin:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px}
      .page{max-width:980px;margin:0 auto}
      .hero,.section{background:rgba(15,23,42,.74);border:1px solid rgba(148,163,184,.18);border-radius:22px}
      .hero{padding:24px}
      .eyebrow{display:inline-flex;padding:.35rem .65rem;border-radius:999px;background:rgba(59,130,246,.14);color:#bfdbfe;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
      h1{font-size:2rem;line-height:1.1;margin-bottom:8px}
      p{color:#cbd5e1;line-height:1.6}
      code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .links{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:16px}
      .links a{text-decoration:none;border-radius:999px;padding:.72rem 1rem;font-size:.92rem}
      .links a.primary{background:#2563eb;color:#fff}
      .links a.secondary{background:rgba(255,255,255,.06);border:1px solid rgba(148,163,184,.18);color:#e2e8f0}
      .meta{margin-top:16px;font-size:.88rem;color:#94a3b8}
      .section{padding:18px;margin-top:16px}
      .section h2{font-size:1.1rem;margin-bottom:6px}
      .section p{font-size:.92rem;color:#94a3b8;margin-bottom:14px}
      .rows{display:grid;gap:8px}
      .row{display:grid;grid-template-columns:110px minmax(0,1fr) minmax(160px,220px);gap:12px;align-items:start;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.03)}
      .method{display:inline-flex;justify-content:center;min-width:64px;padding:.3rem .55rem;border-radius:999px;font-size:.76rem;font-weight:700;letter-spacing:.04em}
      .GET{background:rgba(34,197,94,.16);color:#86efac}
      .POST{background:rgba(59,130,246,.16);color:#93c5fd}
      .PUT{background:rgba(249,115,22,.16);color:#fdba74}
      .DELETE{background:rgba(239,68,68,.16);color:#fca5a5}
      .path{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#f8fafc;word-break:break-all}
      .summary{color:#cbd5e1;font-size:.92rem}
      @media (max-width: 760px){.row{grid-template-columns:1fr}.summary{padding-left:0}}
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div class="eyebrow">API Docs</div>
        <h1>${escapeHtml(title)}</h1>
        <p>Minimal public reference for the TGK demo backend.</p>
        <div class="links">
          <a class="primary" href="/api/docs.json">OpenAPI JSON</a>
          <a class="secondary" href="/api/health">Health</a>
          <a class="secondary" href="/">Home</a>
        </div>
        <div class="meta">Base URL: <code>${escapeHtml(serverUrl)}</code> · v${escapeHtml(version)}</div>
      </section>
      ${sections.map(renderSection).join('')}
    </div>
  </body>
</html>`;
}

function renderSection(section) {
  return `<section class="section">
    <h2>${escapeHtml(section.title)}</h2>
    <p>${escapeHtml(section.note)}</p>
    <div class="rows">
      ${section.items.map(([method, path, summary]) => `<div class="row">
        <div><span class="method ${escapeHtml(method)}">${escapeHtml(method)}</span></div>
        <div class="path">${escapeHtml(path)}</div>
        <div class="summary">${escapeHtml(summary)}</div>
      </div>`).join('')}
    </div>
  </section>`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlOperation(tag, summary) {
  return {
    tags: [tag],
    summary,
    responses: {
      200: {
        description: 'HTML document.',
        content: {
          'text/html': {
            schema: { type: 'string' }
          }
        }
      }
    }
  };
}

function textOperation(tag, summary) {
  return {
    tags: [tag],
    summary,
    responses: {
      200: {
        description: 'Plain text.',
        content: {
          'text/plain': {
            schema: { type: 'string' }
          }
        }
      }
    }
  };
}

function jsonOperation(tag, summary, options = {}) {
  return {
    tags: [tag],
    summary,
    responses: {
      200: jsonResponse(options)
    }
  };
}

function proxyOperation(summary, hasBody = false) {
  const operation = {
    tags: ['proxy'],
    summary,
    parameters: [
      {
        name: 'url',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uri' },
        description: 'Fully encoded target URL.'
      }
    ],
    responses: {
      200: {
        description: 'Passthrough response. Content type varies.',
        content: {
          'application/json': { schema: genericObjectSchema() },
          'text/plain': { schema: { type: 'string' } },
          'application/octet-stream': { schema: { type: 'string', format: 'binary' } }
        }
      },
      400: jsonErrorResponse(),
      500: jsonErrorResponse()
    }
  };

  if (hasBody) {
    operation.requestBody = {
      required: false,
      content: {
        'application/json': { schema: genericObjectSchema() },
        'text/plain': { schema: { type: 'string' } },
        'application/octet-stream': { schema: { type: 'string', format: 'binary' } }
      }
    };
  }

  return operation;
}

function listOperation(tag, summary, itemSchemaRef, parameters) {
  return {
    tags: ['data'],
    summary,
    parameters,
    responses: {
      200: {
        description: 'Array response.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: itemSchemaRef }
            }
          }
        }
      },
      400: jsonErrorResponse(),
      500: jsonErrorResponse()
    }
  };
}

function createOperation(tag, summary, requestSchemaRef, responseSchemaRef) {
  return {
    tags: ['data'],
    summary,
    parameters: [appQueryParam(), appHeaderParam()],
    requestBody: jsonRequestBody(requestSchemaRef),
    responses: {
      201: jsonSchemaResponse(responseSchemaRef, 'Created record.'),
      400: jsonErrorResponse(),
      404: jsonErrorResponse()
    }
  };
}

function getOperation(tag, summary, responseSchemaRef) {
  return {
    tags: ['data'],
    summary,
    parameters: [idPathParam(), appQueryParam(), appHeaderParam()],
    responses: {
      200: jsonSchemaResponse(responseSchemaRef),
      400: jsonErrorResponse(),
      404: jsonErrorResponse()
    }
  };
}

function updateOperation(tag, summary, requestSchemaRef, responseSchemaRef) {
  return {
    tags: ['data'],
    summary,
    parameters: [idPathParam(), appQueryParam(), appHeaderParam()],
    requestBody: jsonRequestBody(requestSchemaRef),
    responses: {
      200: jsonSchemaResponse(responseSchemaRef),
      400: jsonErrorResponse(),
      404: jsonErrorResponse()
    }
  };
}

function deleteOperation(tag, summary) {
  return {
    tags: ['data'],
    summary,
    parameters: [idPathParam(), appQueryParam(), appHeaderParam()],
    responses: {
      200: jsonSchemaResponse('#/components/schemas/SuccessResponse'),
      400: jsonErrorResponse(),
      404: jsonErrorResponse()
    }
  };
}

function jsonRequestBody(schemaRef) {
  return {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: schemaRef }
      }
    }
  };
}

function jsonSchemaResponse(schemaRef, description = 'JSON response.') {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: schemaRef }
      }
    }
  };
}

function jsonResponse(options = {}) {
  return {
    description: 'JSON response.',
    content: {
      'application/json': {
        schema: options.schemaRef ? { $ref: options.schemaRef } : options.schema
      }
    }
  };
}

function jsonErrorResponse() {
  return jsonSchemaResponse('#/components/schemas/ErrorResponse', 'Error response.');
}

function idPathParam() {
  return {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' }
  };
}

function appQueryParam() {
  return {
    name: 'app',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description: 'App slug. Preferred for `/api/data/*`.'
  };
}

function appHeaderParam() {
  return {
    name: 'X-Demo-App',
    in: 'header',
    required: false,
    schema: { type: 'string' },
    description: 'App slug header alternative for `/api/data/*`.'
  };
}

function optionalQueryParam(name, description) {
  return {
    name,
    in: 'query',
    required: false,
    schema: { type: 'string' },
    description
  };
}

function genericObjectSchema() {
  return {
    type: 'object',
    additionalProperties: true
  };
}

function resourceSchema(properties) {
  return {
    type: 'object',
    properties,
    additionalProperties: true
  };
}

function inputSchema(properties, required = []) {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: true
  };
}

module.exports = {
  buildApiSpec,
  buildDocsHtml
};
