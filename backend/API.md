# TGK Wealth Backend API Documentation

**Version**: 3.0.0  
**Base URL**: `/`

---

## Table of Contents

1. [Global Headers & CORS](#global-headers--cors)
2. [App Slug Requirement](#app-slug-requirement)
3. [Health](#health)
4. [Authentication](#authentication-apiauthh)
5. [Data Resources](#data-resources-apidata)
   - [Employees](#employees)
   - [Customers](#customers)
   - [Envelopes](#envelopes)
   - [Tasks](#tasks)
6. [Proxy](#proxy-apiproxy)
7. [Maestro (DataIO)](#maestro-maestro)
8. [Webhooks](#webhooks-apiwebhooks)

---

## Global Headers & CORS

All responses include:

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | `*` |
| `Access-Control-Allow-Headers` | `Authorization, Content-Type, X-Demo-App` |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, DELETE, OPTIONS` |

---

## App Slug Requirement

All `/api/data` endpoints require an **app slug** provided via one of:

| Method | Details |
|--------|---------|
| Header | `X-Demo-App: <slug>` |
| Query param | `?app=<slug>` |
| Request body | `{ "appSlug": "<slug>" }` or `{ "app": { "slug": "<slug>" } }` |

---

## Health

### `GET /api/health`

Health check endpoint.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2026-04-09T00:00:00.000Z",
  "docusignConfigured": true
}
```

---

## Authentication `/api/auth`

### `GET /api/auth/login`

Initiates a DocuSign OAuth consent flow by redirecting the user to the DocuSign consent URL.

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `scopes` | string | Yes | Space-separated DocuSign OAuth scopes |

**Response**: `302` redirect to DocuSign consent URL.

**Errors**

| Code | Reason |
|------|--------|
| `400` | `scopes` query parameter missing |

---

### `GET /api/auth/callback`

OAuth callback endpoint. Renders an HTML result page and posts a message to `window.opener` for parent window communication. Auto-closes after 2.2 seconds.

**Query Parameters** _(set by DocuSign)_

| Name | Description |
|------|-------------|
| `code` | Authorization code on success |
| `error` | Error code on failure |
| `error_description` | Human-readable error on failure |

**Response**: `200` HTML page.

---

### `POST /api/auth/token`

Obtains a DocuSign access token via JWT grant. Tokens are cached in-memory with a 1-minute refresh buffer.

**Request Body**

```json
{
  "userId": "string",
  "accountId": "string",
  "scopes": "string | string[]"
}
```

| Field | Type | Required |
|-------|------|----------|
| `userId` | string | Yes |
| `accountId` | string | Yes |
| `scopes` | string or string[] | Yes |

**Response `200`**
```json
{
  "accessToken": "eyJ...",
  "expiresAt": "2026-04-09T01:00:00.000Z"
}
```

**Errors**

| Code | Reason |
|------|--------|
| `400` | Required field missing |

---

## Data Resources `/api/data`

All resource endpoints share the same CRUD pattern:

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/data/{resource}` | List records |
| `GET` | `/api/data/{resource}/{id}` | Get single record |
| `POST` | `/api/data/{resource}` | Create record |
| `PUT` | `/api/data/{resource}/{id}` | Update record |
| `DELETE` | `/api/data/{resource}/{id}` | Delete record _(customers & tasks only)_ |

**Supported `{resource}` values**: `employees`, `customers`, `envelopes`, `tasks`

---

### Employees

#### `GET /api/data/employees`

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| `search` | string | Search across `displayName`, `email`, `title`, `id` |

**Response `200`** — array of employee objects, sorted by `displayName` / `email` / `title` / `id` (case-insensitive).

```json
[
  {
    "id": "emp_abc123",
    "appSlug": "tgkwealth",
    "displayName": "Jane Advisor",
    "email": "jane@example.com",
    "phone": "555-1234",
    "title": "Senior Advisor",
    "data": {},
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-09T00:00:00.000Z"
  }
]
```

#### `GET /api/data/employees/{id}`

Returns a single employee object (same shape as above).

#### `POST /api/data/employees`

**Request Body**

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Employee email |
| `title` | string | Job title |
| `displayName` | string | Full name (derived from `firstName`/`lastName` if omitted) |
| `phone` | string | Phone number |
| `data` | object | Additional metadata (merged with existing on update) |
| `createdAt` | ISO-8601 | Override creation timestamp |

**Response `201`** — created employee object.

#### `PUT /api/data/employees/{id}`

Same body fields as POST (all optional). Returns updated employee object.

> **Note**: Delete is not supported for employees.

---

### Customers

#### `GET /api/data/customers`

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| `search` | string | Search across `displayName`, `email`, `organization`, `id` |
| `status` | string | Filter by status |
| `employeeId` | string | Filter by assigned employee |
| `includeEnvelopes` | `1` | Include related envelopes in response |
| `includeTasks` | `1` | Include related tasks in response |

**Response `200`** — array of customer objects, sorted by `displayName` / `email` / `organization` / `id`.

```json
[
  {
    "id": "cust_xyz789",
    "appSlug": "tgkwealth",
    "employeeId": "emp_abc123",
    "displayName": "John Investor",
    "email": "john@example.com",
    "phone": "555-5678",
    "organization": "Acme Corp",
    "status": "active",
    "data": {},
    "createdAt": "2026-01-15T00:00:00.000Z",
    "updatedAt": "2026-04-09T00:00:00.000Z"
  }
]
```

#### `GET /api/data/customers/{id}`

Same query params (`includeEnvelopes`, `includeTasks`) as list endpoint. Returns a single customer object.

#### `POST /api/data/customers`

**Request Body**

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Assigned employee (references employees) |
| `email` | string | Customer email |
| `organization` | string | Company/organization name |
| `displayName` | string | Full name (derived from `firstName`/`lastName` if omitted) |
| `phone` | string | Phone number |
| `status` | string | Customer status |
| `data` | object | Additional metadata |
| `createdAt` | ISO-8601 | Override creation timestamp |

**Response `201`** — created customer object.

#### `PUT /api/data/customers/{id}`

Same body fields as POST (all optional). Returns updated customer object.

#### `DELETE /api/data/customers/{id}`

Deletes the customer. Cascades: sets `customerId` to `null` on related envelopes and tasks.

**Response `200`**
```json
{ "success": true }
```

---

### Envelopes

#### `GET /api/data/envelopes`

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| `search` | string | Search by name, status, id |
| `id` | string | Exact envelope ID lookup |
| `status` | string | Filter by status |
| `employeeId` | string | Filter by employee |
| `customerId` | string | Filter by customer |

**Response `200`** — array of envelope objects, sorted by `createdAt` DESC.

```json
[
  {
    "id": "env_docusign123",
    "appSlug": "tgkwealth",
    "employeeId": "emp_abc123",
    "customerId": "cust_xyz789",
    "name": "Investment Agreement",
    "status": "sent",
    "data": {},
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-09T00:00:00.000Z"
  }
]
```

#### `GET /api/data/envelopes/{id}`

Returns a single envelope object.

#### `POST /api/data/envelopes`

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | DocuSign envelope ID |
| `employeeId` | string | No | Assigned employee |
| `customerId` | string | No | Associated customer |
| `name` | string | No | Envelope name |
| `status` | string | No | Envelope status |
| `data` | object | No | Additional metadata |
| `createdAt` | ISO-8601 | No | Override creation timestamp |

**Response `201`** — created envelope object.

#### `PUT /api/data/envelopes/{id}`

Same body fields as POST (all optional). Returns updated envelope object.

> **Note**: Delete is not supported for envelopes.

---

### Tasks

#### `GET /api/data/tasks`

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| `search` | string | Search across `title`, `description`, `id` |
| `id` | string | Exact task ID lookup |
| `status` | string | Filter by status |
| `employeeId` | string | Filter by assigned employee |
| `customerId` | string | Filter by associated customer |

**Response `200`** — array of task objects, sorted by `dueAt` / `createdAt` DESC.

```json
[
  {
    "id": "task_001",
    "appSlug": "tgkwealth",
    "employeeId": "emp_abc123",
    "customerId": "cust_xyz789",
    "title": "Review portfolio",
    "description": "Annual portfolio review",
    "status": "open",
    "dueAt": "2026-04-30T00:00:00.000Z",
    "data": {},
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-09T00:00:00.000Z"
  }
]
```

#### `GET /api/data/tasks/{id}`

Returns a single task object.

#### `POST /api/data/tasks`

**Request Body**

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | string | Assigned employee |
| `customerId` | string | Associated customer |
| `title` | string | Task title |
| `description` | string | Task description |
| `status` | string | Task status |
| `dueAt` | ISO-8601 | Due date/time |
| `data` | object | Additional metadata |
| `createdAt` | ISO-8601 | Override creation timestamp |

**Response `201`** — created task object.

#### `PUT /api/data/tasks/{id}`

Same body fields as POST (all optional). Returns updated task object.

#### `DELETE /api/data/tasks/{id}`

**Response `200`**
```json
{ "success": true }
```

---

## Proxy `/api/proxy`

### `POST /api/proxy/`

Forwards an HTTP request to an external API (e.g., DocuSign). Preserves `Content-Type`, `Cache-Control`, and `Content-Disposition` headers from the upstream response.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | No | HTTP method (default: `GET`) |
| `url` | string | One of url/path | Full request URL |
| `path` | string | One of url/path | Path appended to `baseUrl` |
| `baseUrl` | string | No | Override base URL (default: `DOCUSIGN_API_BASE` env var) |
| `accessToken` | string | No | Injected as `Authorization: Bearer <token>` |
| `headers` | object | No | Additional request headers |
| `query` | object | No | Query parameters (array values supported) |
| `body` | any | No | Request body (auto-serialized as JSON, form-encoded, or text) |

**Response**: Proxied response body, with matching `Content-Type`.

---

## Maestro `/maestro`

Maestro is a DataIO bridge for DocuSign extensions. Most endpoints require a Bearer token obtained from `/maestro/oauth/token`.

### `GET /maestro/`

Service status.

**Response `200`**
```json
{
  "service": "tgk-maestro",
  "status": "ok",
  "mode": "in-process",
  "manifest": "https://.../maestro/manifest/clientCredentials.ReadWriteManifest.json"
}
```

---

### `GET /maestro/manifest/clientCredentials.ReadWriteManifest.json`

Returns the Maestro OAuth manifest (type definitions and OAuth endpoints).

---

### `GET /maestro/support`
### `GET /maestro/privacy`
### `GET /maestro/terms`

Returns informational text pages (`text/plain`).

---

### `POST /maestro/oauth/token`

Issues a Maestro Bearer token using client credentials.

**Authentication**: Client credentials via HTTP Basic Auth _or_ request body.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `grant_type` | string | Yes | Must be `"client_credentials"` |
| `client_id` | string | Conditional | Required if not using Basic Auth |
| `client_secret` | string | Conditional | Required if not using Basic Auth |

**Response `200`**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Errors**

| Code | Reason |
|------|--------|
| `400` | `grant_type` is not `"client_credentials"` |
| `401` | Invalid client credentials |

---

### `POST /maestro/api/dataio/createRecord`

Creates a new record.

**Auth**: `Authorization: Bearer <token>` required.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `typeName` | string | Yes | See [Supported Types](#supported-types) |
| `recordId` | string | No | Custom record ID |
| `data` | object | Yes | Record field values |
| `appSlug` | string | No | App slug (resolved from `data` if omitted) |

**Response `200`**
```json
{ "recordId": "cust_abc123" }
```

---

### `POST /maestro/api/dataio/patchRecord`

Updates an existing record.

**Auth**: `Authorization: Bearer <token>` required.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `typeName` | string | Yes | See [Supported Types](#supported-types) |
| `recordId` | string | Yes | ID of record to update |
| `data` | object | Yes | Fields to update (merged with existing) |
| `appSlug` | string | No | App slug |

**Response `200`**
```json
{ "success": true }
```

---

### `POST /maestro/api/dataio/searchRecords`

Queries records using a filter expression.

**Auth**: `Authorization: Bearer <token>` required.

**Request Body**

```json
{
  "query": {
    "from": "Customer",
    "where": [
      { "attribute": "Status", "operator": "=", "value": "active" }
    ],
    "attributesToSelect": ["Id", "DisplayName", "Email"]
  },
  "pagination": {
    "skip": 0,
    "limit": 100
  },
  "appSlug": "tgkwealth"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query.from` | string | `Customer` | Type to query |
| `query.where` | array | `[]` | Filter conditions |
| `query.where[].attribute` | string | — | Field name |
| `query.where[].operator` | string | — | `=`, `!=`, `<`, `>`, `<=`, `>=`, `contains` |
| `query.where[].value` | any | — | Value to compare |
| `query.attributesToSelect` | string[] | all | Fields to return |
| `pagination.skip` | number | `0` | Records to skip |
| `pagination.limit` | number | `100` | Max records to return |

**Response `200`**
```json
{
  "records": [
    { "Id": "cust_xyz789", "DisplayName": "John Investor", "Email": "john@example.com" }
  ]
}
```

---

### `POST /maestro/api/dataio/getTypeNames`

Returns the list of available type names.

**Auth**: `Authorization: Bearer <token>` required.

**Response `200`**
```json
{
  "typeNames": [
    { "typeName": "Customer", "label": "Customer", "description": "A wealth management client" },
    { "typeName": "Employee", "label": "Employee", "description": "An advisor or staff member" },
    { "typeName": "Task", "label": "Task", "description": "An actionable to-do item" },
    { "typeName": "Envelope", "label": "Envelope", "description": "A DocuSign envelope/agreement" }
  ]
}
```

---

### `POST /maestro/api/dataio/getTypeDefinitions`

Returns the field schema for one or more types.

**Auth**: `Authorization: Bearer <token>` required.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `typeNames` | string[] | No | Types to describe (defaults to all) |

**Response `200`**
```json
{
  "declarations": [
    {
      "typeName": "Customer",
      "fields": [
        { "name": "Id", "type": "String", "optional": false },
        { "name": "DisplayName", "type": "String", "optional": true },
        { "name": "Email", "type": "String", "optional": true },
        { "name": "Status", "type": "String", "optional": true }
      ]
    }
  ],
  "errors": []
}
```

---

### Supported Types

| `typeName` | Aliases |
|------------|---------|
| `Customer` | `client`, `investor`, `contact` |
| `Employee` | `advisor`, `user` |
| `Task` | `todo`, `actionitem`, `workitem` |
| `Envelope` | `document`, `agreement` |

---

## Webhooks `/api/webhooks`

### `POST /api/webhooks/docusign`

Receives DocuSign Connect webhook events. Currently acknowledges receipt but discards the payload.

**Content-Type**: Any (accepted raw, up to 10MB)

**Response `202`**
```json
{ "success": true, "discarded": true }
```
