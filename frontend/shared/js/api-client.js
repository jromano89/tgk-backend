/**
 * TGK Demo API Client
 * Thin fetch wrapper that handles errors, the backend base URL, and DocuSign token fetches.
 * Include this in any frontend via <script src="../shared/js/api-client.js"></script>
 */
(function () {
  const DOCUSIGN_CONSENT_WINDOW_NAME = 'tgk-docusign-consent';
  const DOCUSIGN_CONSENT_POLL_MS = 400;
  const DOCUSIGN_TOKEN_REFRESH_BUFFER_MS = 60000;
  const SELECTED_CUSTOMER_STORAGE_PREFIX = 'tgk_selected_customer:';
  const DOCUSIGN_TOKEN_STORAGE_PREFIX = 'tgk_docusign_token:';

  function pickDisplayName(value, fallbacks) {
    const explicit = String(value || '').trim();
    if (explicit) {
      return explicit;
    }

    for (const fallback of fallbacks || []) {
      const normalized = String(fallback || '').trim();
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  function withSearchParams(path, params) {
    if (!params) {
      return path;
    }

    const query = new URLSearchParams(params).toString();
    return query ? `${path}?${query}` : path;
  }

  function getItemPath(collectionPath, id) {
    return `${collectionPath}/${encodeURIComponent(id)}`;
  }

  function buildCustomerDetailParams(options = {}) {
    const params = {};

    if (options.includeTransactions) {
      params.includeTransactions = 'true';
    }
    if (options.includeTasks) {
      params.includeTasks = 'true';
    }

    return Object.keys(params).length > 0 ? params : null;
  }

  function mapEmployee(employee) {
    const data = employee?.data || {};
    const displayName = pickDisplayName(employee?.displayName, [
      employee?.email,
      employee?.title,
      employee?.id
    ]);
    return {
      id: employee.id,
      name: displayName,
      email: employee.email,
      phone: employee.phone,
      title: employee.title || data.title || '',
      metadata: {
        ...data,
        title: employee.title || data.title || ''
      },
      created_at: employee.createdAt,
      createdAt: employee.createdAt
    };
  }

  function mapEmbeddedAccount(account, customerId) {
    const data = account && typeof account === 'object' ? account : {};
    const accountType = data.accountType || 'Account';
    return {
      id: data.id,
      customer_id: customerId,
      customerId,
      account_type: accountType,
      accountType,
      status: data.status || 'active',
      metadata: {
        ...data,
        name: data.name || data.title || 'Untitled Account',
        accountType
      },
      created_at: data.createdAt || data.created_at || '',
      createdAt: data.createdAt || data.created_at || ''
    };
  }

  function mapTransaction(transaction) {
    return {
      ...transaction,
      employee_id: transaction?.employeeId || null,
      customer_id: transaction?.customerId || null,
      created_at: transaction?.createdAt || '',
      updated_at: transaction?.updatedAt || '',
      type: transaction?.type || 'envelope',
      status: transaction?.status || 'created',
      name: transaction?.name || ''
    };
  }

  function mapTask(task) {
    const data = task?.data || {};
    return {
      ...task,
      employee_id: task?.employeeId || null,
      customer_id: task?.customerId || null,
      due_at: task?.dueAt || '',
      created_at: task?.createdAt || '',
      updated_at: task?.updatedAt || '',
      title: task?.title || data.title || 'Untitled task',
      description: task?.description || data.description || '',
      status: task?.status || 'pending'
    };
  }

  function mapCustomerToView(customer) {
    const data = customer?.data || {};
    const displayName = pickDisplayName(customer?.displayName, [
      customer?.email,
      customer?.organization,
      customer?.id
    ]);
    return {
      id: customer.id,
      name: displayName,
      email: customer.email,
      phone: customer.phone,
      company: customer.organization,
      type: 'investor',
      metadata: {
        ...data,
        status: customer.status || data.status
      },
      employee_id: customer.employeeId || null,
      employeeId: customer.employeeId || null,
      created_at: customer.createdAt,
      createdAt: customer.createdAt
    };
  }

  // Normalize a Navigator agreement across the API's field-name variants.
  // --- Docusign API activity log (demo "integration inspector" drawer) ---
  // Records each Docusign call so the UI can show, live, that data is arriving
  // from another system. NEVER logs auth headers/tokens — only method/url/body.
  const TGK_DS_LOG_LIMIT = 50;
  function tgkDsLogPush(entry) {
    const log = (window.__TGK_DS_LOG = window.__TGK_DS_LOG || []);
    log.unshift(entry);
    if (log.length > TGK_DS_LOG_LIMIT) log.length = TGK_DS_LOG_LIMIT;
    tgkDsLogDispatch(entry);
  }
  function tgkDsLogDispatch(entry) {
    try { window.dispatchEvent(new CustomEvent('tgk:ds-api', { detail: entry })); } catch (e) { /* no-op */ }
  }
  function tgkSummarizeBody(body) {
    if (body == null) return null;
    try { return typeof body === 'string' ? JSON.parse(body) : body; }
    catch (e) { return String(body).slice(0, 2000); }
  }
  function tgkSummarizeResponse(resp) {
    if (resp == null) return null;
    let meta = { kind: 'object' };
    if (Array.isArray(resp)) meta = { kind: 'array', count: resp.length };
    else if (typeof resp === 'object') {
      const arr = resp.data || resp.agreements || resp.value || resp.envelopes || resp.items;
      if (Array.isArray(arr)) meta = { kind: 'collection', count: arr.length };
    }
    let json = '';
    try { json = JSON.stringify(resp, null, 2); } catch (e) { json = String(resp); }
    const truncated = json.length > 12000;
    return { ...meta, json: truncated ? json.slice(0, 12000) + '\n… (truncated)' : json };
  }
  function tgkParseUrl(url) {
    try { const u = new URL(url); return { host: u.host, path: u.pathname, query: u.search }; }
    catch (e) { return { host: '', path: String(url || ''), query: '' }; }
  }
  function tgkDsEntry(options) {
    const u = tgkParseUrl(options?.url);
    return {
      id: 'ds-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      ts: new Date().toISOString(),
      method: String(options?.method || 'GET').toUpperCase(),
      url: String(options?.url || ''), host: u.host, path: u.path, query: u.query,
      requestBody: tgkSummarizeBody(options?.body),
      status: null, ok: null, durationMs: null, response: null, error: null, pending: true,
      _t0: (typeof performance !== 'undefined' ? performance.now() : Date.now())
    };
  }
  function tgkDsEnd(entry, patch) {
    if (!entry) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    entry.durationMs = Math.round(now - (entry._t0 || now));
    entry.pending = false;
    Object.assign(entry, patch);
    tgkDsLogDispatch(entry);
  }

  function mapNavigatorAgreement(agreement) {
    const a = agreement && typeof agreement === 'object' ? agreement : {};
    const provisions = a.provisions || {};
    const parties = Array.isArray(a.parties) ? a.parties : [];
    const source = a.source && typeof a.source === 'object' ? a.source : {};
    return {
      id: a.id || a.agreement_id || a.document_id || '',
      title: a.file_name || a.title || a.name || a.agreement_name || 'Untitled agreement',
      type: a.type || a.category || a.agreement_type || '',
      status: a.status || a.agreement_status || provisions.status || '',
      parties: parties.map((p) => p?.name_in_agreement || p?.name || '').filter(Boolean),
      effectiveDate: provisions.effective_date || a.effective_date || '',
      expirationDate: provisions.expiration_date || a.expiration_date || '',
      value: provisions.total_agreement_value ?? provisions.contract_value ?? null,
      valueCurrency: provisions.total_agreement_value_currency_code || provisions.currency_code || '',
      sourceEnvelopeId: a.source_id || a.source_envelope_id || a.envelope_id || source.id || source.envelope_id || '',
      raw: a
    };
  }

  function getErrorMessage(payload, fallbackMessage) {
    if (typeof payload === 'string') {
      return payload || fallbackMessage;
    }

    if (payload && typeof payload === 'object') {
      const details = [
        payload.error,
        payload.message,
        payload.error_description,
        payload.details,
        payload.title
      ].filter(Boolean);
      if (details.length > 0) {
        return details[0];
      }

      try {
        return JSON.stringify(payload);
      } catch (error) {
        return fallbackMessage;
      }
    }

    return fallbackMessage;
  }

  function serializeRequestBody(body, headers) {
    if (!body || typeof body !== 'object' || body instanceof FormData) {
      return body;
    }

    if (Array.isArray(body)) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      return JSON.stringify(body);
    }

    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return JSON.stringify(body);
  }

  function getSelectedCustomerStorageKey(appSlug) {
    return `${SELECTED_CUSTOMER_STORAGE_PREFIX}${String(appSlug || 'default').trim().toLowerCase()}`;
  }

  function appendAppQuery(path, appSlug) {
    if (!appSlug) {
      return path;
    }

    const url = new URL(path, 'http://tgk.local');
    if (!url.searchParams.has('app')) {
      url.searchParams.set('app', appSlug);
    }

    return `${url.pathname}${url.search}`;
  }

  function appendUrlQuery(targetUrl, query) {
    if (!query) {
      return;
    }

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => targetUrl.searchParams.append(key, item));
        return;
      }

      targetUrl.searchParams.append(key, value);
    });
  }

  function normalizeProxyPath(baseUrl, path) {
    const rawPath = String(path || '');
    if (!rawPath.startsWith('/')) {
      return rawPath;
    }

    const basePath = String(baseUrl.pathname || '/').replace(/\/+$/, '') || '/';
    if (basePath === '/' || rawPath === basePath || rawPath.startsWith(`${basePath}/`)) {
      return rawPath;
    }

    return rawPath.replace(/^\/+/, '');
  }

  function getDocusignTokenStorageKey(config = {}) {
    const parts = [
      String(config.baseUrl || '').trim().toLowerCase(),
      String(config.userId || '').trim().toLowerCase(),
      String(config.accountId || '').trim().toLowerCase(),
      String(config.scopes || '').trim().toLowerCase()
    ];

    return `${DOCUSIGN_TOKEN_STORAGE_PREFIX}${parts.join(':')}`;
  }

  function normalizeDocusignTokenRecord(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const accessToken = String(value.accessToken || value.access_token || '').trim();
    const expiresAtRaw = value.expiresAt || value.expires_at || '';
    const expiresAt = new Date(expiresAtRaw).getTime();

    if (!accessToken || Number.isNaN(expiresAt)) {
      return null;
    }

    return {
      accessToken,
      expiresAt
    };
  }

  const TGK_API = {
    baseUrl: window.TGK_CONFIG?.backendUrl || 'http://localhost:3000',
    docusignIamBaseUrl: window.TGK_CONFIG?.docusignIamBaseUrl || 'https://api-d.docusign.com',
    docusignWebFormsBaseUrl: window.TGK_CONFIG?.docusignWebFormsBaseUrl || 'https://apps-d.docusign.com',
    docusignClientId: window.TGK_CONFIG?.docusignClientId || '',
    docusignUserId: window.TGK_CONFIG?.docusignAuth?.userId || '',
    docusignAccountId: window.TGK_CONFIG?.docusignAuth?.accountId || '',
    docusignScopes: window.TGK_CONFIG?.docusignAuth?.scopes || '',
    appSlug: window.TGK_CONFIG?.appSlug || '',
    appName: window.TGK_CONFIG?.appName || '',
    _docusignTokenCache: null,
    _docusignTokenPromise: null,

    async requestResponse(path, options = {}) {
      const method = String(options.method || 'GET').toUpperCase();
      const headers = { ...(options.headers || {}) };
      const requestOptions = {
        ...options,
        method
      };

      if (requestOptions.body !== undefined) {
        requestOptions.body = serializeRequestBody(requestOptions.body, headers);
      }

      if (Object.keys(headers).length > 0) {
        requestOptions.headers = headers;
      }

      const response = await fetch(`${this.baseUrl}${path}`, requestOptions);
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
          ? await response.json().catch(() => ({ error: response.statusText }))
          : await response.text().catch(() => response.statusText);
        throw new Error(getErrorMessage(payload, `API error: ${response.status}`));
      }

      return response;
    },

    async request(path, options = {}) {
      const response = await this.requestResponse(path, options);
      return response.json();
    },

    async requestText(path, options = {}) {
      const response = await this.requestResponse(path, options);
      return response.text();
    },

    get(path) {
      return this.request(path);
    },
    post(path, body) {
      return this.request(path, { method: 'POST', body });
    },
    put(path, body) {
      return this.request(path, { method: 'PUT', body });
    },
    del(path) {
      return this.request(path, { method: 'DELETE' });
    },

    getPreferredCustomerId() {
      try {
        return window.localStorage.getItem(getSelectedCustomerStorageKey(this.appSlug)) || '';
      } catch (error) {
        return '';
      }
    },

    setPreferredCustomerId(customerId) {
      try {
        const key = getSelectedCustomerStorageKey(this.appSlug);
        const normalized = String(customerId || '').trim();
        if (!normalized) {
          window.localStorage.removeItem(key);
          return;
        }
        window.localStorage.setItem(key, normalized);
      } catch (error) {
        // Ignore localStorage write failures.
      }
    },

    async prefetchDocusignAccessToken() {
      if (!this.hasDocusignAuthConfig()) {
        return false;
      }

      if (this.readCachedDocusignToken()) {
        return true;
      }

      try {
        await this.getDocusignAccessToken();
        return true;
      } catch (error) {
        return false;
      }
    },

    getDocusignAuthConfig() {
      return {
        userId: String(this.docusignUserId || '').trim(),
        accountId: String(this.docusignAccountId || '').trim(),
        scopes: String(this.docusignScopes || '').trim()
      };
    },

    hasDocusignAuthConfig() {
      const config = this.getDocusignAuthConfig();
      return !!(config.userId && config.accountId && config.scopes);
    },

    getDocusignConsentUrl() {
      const scopes = this.getDocusignAuthConfig().scopes;
      if (!scopes) {
        throw new Error('Missing Docusign scopes in frontend config.');
      }

      const params = new URLSearchParams({ scopes });
      return `${this.baseUrl}/api/auth/login?${params.toString()}`;
    },

    startDocusignConsent() {
      const backendOrigin = new URL(this.baseUrl, window.location.href).origin;
      const popup = window.open(
        this.getDocusignConsentUrl(),
        DOCUSIGN_CONSENT_WINDOW_NAME,
        'popup=yes,width=540,height=720,resizable=yes,scrollbars=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Allow popups and retry.');
      }

      if (typeof popup.focus === 'function') {
        popup.focus();
      }

      return new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          window.removeEventListener('message', handleMessage);
          window.clearInterval(pollTimer);
        };

        const finish = (callback) => {
          if (settled) {
            return;
          }

          settled = true;
          cleanup();
          callback();
        };

        const handleMessage = (event) => {
          const payload = event.data;
          if (event.origin !== backendOrigin || !payload || payload.source !== 'tgk-docusign-consent') {
            return;
          }

          if (payload.status === 'success') {
            finish(() => resolve(payload));
            return;
          }

          finish(() => reject(new Error(payload.message || 'Docusign consent failed.')));
        };

        const pollTimer = window.setInterval(() => {
          if (!popup.closed) {
            return;
          }

          finish(() => reject(new Error('Docusign consent window was closed before completion.')));
        }, DOCUSIGN_CONSENT_POLL_MS);

        window.addEventListener('message', handleMessage);
      });
    },

    getDocusignTokenStorageKey() {
      return getDocusignTokenStorageKey({
        baseUrl: this.baseUrl,
        ...this.getDocusignAuthConfig()
      });
    },

    isDocusignTokenUsable(tokenRecord, bufferMs = DOCUSIGN_TOKEN_REFRESH_BUFFER_MS) {
      return !!(tokenRecord?.accessToken && tokenRecord.expiresAt > Date.now() + bufferMs);
    },

    readStoredDocusignToken() {
      try {
        const rawValue = window.localStorage.getItem(this.getDocusignTokenStorageKey());
        if (!rawValue) {
          return null;
        }

        return normalizeDocusignTokenRecord(JSON.parse(rawValue));
      } catch (error) {
        return null;
      }
    },

    writeStoredDocusignToken(tokenRecord) {
      try {
        window.localStorage.setItem(this.getDocusignTokenStorageKey(), JSON.stringify({
          accessToken: tokenRecord.accessToken,
          expiresAt: new Date(tokenRecord.expiresAt).toISOString()
        }));
      } catch (error) {
        // Ignore localStorage write failures.
      }
    },

    clearDocusignTokenCache() {
      this._docusignTokenCache = null;
      this._docusignTokenPromise = null;

      try {
        window.localStorage.removeItem(this.getDocusignTokenStorageKey());
      } catch (error) {
        // Ignore localStorage write failures.
      }
    },

    readCachedDocusignToken() {
      if (this.isDocusignTokenUsable(this._docusignTokenCache)) {
        return this._docusignTokenCache;
      }

      const storedToken = this.readStoredDocusignToken();
      if (this.isDocusignTokenUsable(storedToken)) {
        this._docusignTokenCache = storedToken;
        return storedToken;
      }

      return null;
    },

    async getDocusignAccessToken(options = {}) {
      const force = !!options.force;
      const config = this.getDocusignAuthConfig();

      if (!config.userId) {
        throw new Error('Missing Docusign user ID in frontend config.');
      }
      if (!config.accountId) {
        throw new Error('Missing Docusign account ID in frontend config.');
      }
      if (!config.scopes) {
        throw new Error('Missing Docusign scopes in frontend config.');
      }

      if (!force) {
        const cachedToken = this.readCachedDocusignToken();
        if (cachedToken) {
          return cachedToken.accessToken;
        }
      }

      if (this._docusignTokenPromise) {
        const tokenRecord = await this._docusignTokenPromise;
        return tokenRecord.accessToken;
      }

      this._docusignTokenPromise = this.post('/api/auth/token', config)
        .then((payload) => {
          const tokenRecord = normalizeDocusignTokenRecord(payload);
          if (!tokenRecord) {
            throw new Error('Docusign token response was invalid.');
          }

          this._docusignTokenCache = tokenRecord;
          this.writeStoredDocusignToken(tokenRecord);
          return tokenRecord;
        })
        .catch((error) => {
          this.clearDocusignTokenCache();
          throw error;
        })
        .finally(() => {
          this._docusignTokenPromise = null;
        });

      const tokenRecord = await this._docusignTokenPromise;
      return tokenRecord.accessToken;
    },

    getDocusignAccountId() {
      const accountId = this.getDocusignAuthConfig().accountId;
      if (!accountId) {
        throw new Error('Missing Docusign account ID in frontend config.');
      }

      return accountId;
    },

    buildDocusignUrl(path, options = {}) {
      const baseUrl = String(options.baseUrl || this.docusignIamBaseUrl || '').trim();
      if (!baseUrl) {
        throw new Error('Missing Docusign base URL in frontend config.');
      }

      const resolvedBaseUrl = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
      const resolvedPath = String(path || '').replace(/\{accountId\}/g, this.getDocusignAccountId());
      const targetUrl = new URL(normalizeProxyPath(resolvedBaseUrl, resolvedPath), resolvedBaseUrl);
      appendUrlQuery(targetUrl, options.query);
      return targetUrl.toString();
    },

    buildProxyPath(url) {
      const targetUrl = String(url || '').trim();
      if (!targetUrl) {
        throw new Error('Proxy requests must provide "url".');
      }

      return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    },

    buildProxyHeaders(options = {}) {
      const headers = { ...(options.headers || {}) };

      if (options.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`;
      }

      return headers;
    },

    withDataApp(path) {
      return appendAppQuery(path, this.appSlug);
    },

    subscribeDataEvents(handlers = {}) {
      const onChange = typeof handlers === 'function' ? handlers : handlers.onChange;
      const onConnected = handlers.onConnected;
      const onError = handlers.onError;

      if (typeof window.EventSource !== 'function') {
        return {
          supported: false,
          close() {}
        };
      }

      const eventUrl = new URL(this.withDataApp('/api/data/events'), this.baseUrl);
      const source = new window.EventSource(eventUrl.toString());

      source.addEventListener('connected', (event) => {
        if (typeof onConnected === 'function') {
          onConnected(event);
        }
      });

      source.addEventListener('data.changed', (event) => {
        if (typeof onChange !== 'function') {
          return;
        }

        try {
          onChange(JSON.parse(event.data), event);
        } catch (error) {
          console.warn('Could not parse data change event:', error);
        }
      });

      if (typeof onError === 'function') {
        source.addEventListener('error', onError);
      }

      return {
        supported: true,
        close() {
          source.close();
        }
      };
    },

    getEmployees(params) {
      return this.get(this.withDataApp(withSearchParams('/api/data/employees', params))).then((employees) => employees.map(mapEmployee));
    },
    getCustomersRaw(params) {
      return this.get(this.withDataApp(withSearchParams('/api/data/customers', params)));
    },
    getCustomerRaw(id, options = {}) {
      return this.get(this.withDataApp(withSearchParams(getItemPath('/api/data/customers', id), buildCustomerDetailParams(options))));
    },
    updateCustomerRaw(id, body) {
      return this.put(this.withDataApp(getItemPath('/api/data/customers', id)), body);
    },
    deleteCustomerRaw(id) {
      return this.del(this.withDataApp(getItemPath('/api/data/customers', id)));
    },
    getTasksRaw(params) {
      return this.get(this.withDataApp(withSearchParams('/api/data/tasks', params)));
    },
    getTaskRaw(id) {
      return this.get(this.withDataApp(getItemPath('/api/data/tasks', id)));
    },
    createTaskRaw(body) {
      return this.post(this.withDataApp('/api/data/tasks'), body);
    },
    updateTaskRaw(id, body) {
      return this.put(this.withDataApp(getItemPath('/api/data/tasks', id)), body);
    },
    deleteTaskRaw(id) {
      return this.del(this.withDataApp(getItemPath('/api/data/tasks', id)));
    },
    getTransactionsRaw(params) {
      return this.get(this.withDataApp(withSearchParams('/api/data/transactions', params)));
    },

    async getCustomers(params) {
      const customers = await this.getCustomersRaw(params);
      return customers.map(mapCustomerToView);
    },
    async getCustomer(id, options = {}) {
      const includeTransactions = options.includeTransactions !== false;
      const includeTasks = options.includeTasks !== false;
      const customer = await this.getCustomerRaw(id, {
        includeTransactions,
        includeTasks
      });
      const transactions = includeTransactions ? (customer.transactions || []) : [];
      const tasks = includeTasks ? (customer.tasks || []) : [];

      return {
        ...mapCustomerToView(customer),
        accounts: (customer.data?.accounts || []).map((account) => mapEmbeddedAccount(account, customer.id)),
        transactions: transactions.map(mapTransaction),
        tasks: tasks.map(mapTask)
      };
    },
    async updateCustomer(id, body) {
      await this.updateCustomerRaw(id, body);
      return this.getCustomer(id);
    },
    deleteCustomer(id) {
      return this.deleteCustomerRaw(id);
    },
    async getTasks(params) {
      const tasks = await this.getTasksRaw(params);
      return tasks.map(mapTask);
    },
    async getTransactions(params) {
      const transactions = await this.getTransactionsRaw(params);
      return transactions.map(mapTransaction);
    },
    async createTask(body) {
      return mapTask(await this.createTaskRaw(body));
    },
    async updateTask(id, body) {
      return mapTask(await this.updateTaskRaw(id, body));
    },
    deleteTask(id) {
      return this.deleteTaskRaw(id);
    },

    proxy(options) {
      return this.request(this.buildProxyPath(options?.url), {
        method: String(options?.method || 'GET').toUpperCase(),
        headers: this.buildProxyHeaders(options),
        body: options?.body
      });
    },

    proxyResponse(options) {
      return this.requestResponse(this.buildProxyPath(options?.url), {
        method: String(options?.method || 'GET').toUpperCase(),
        headers: this.buildProxyHeaders(options),
        body: options?.body
      });
    },

    proxyText(options) {
      return this.requestText(this.buildProxyPath(options?.url), {
        method: String(options?.method || 'GET').toUpperCase(),
        headers: this.buildProxyHeaders(options),
        body: options?.body
      });
    },

    async proxyDocusign(options) {
      const accessToken = await this.getDocusignAccessToken();
      const entry = tgkDsEntry(options);
      tgkDsLogPush(entry);
      try {
        const result = await this.proxy({ ...options, accessToken });
        tgkDsEnd(entry, { ok: true, status: 200, response: tgkSummarizeResponse(result) });
        return result;
      } catch (e) {
        tgkDsEnd(entry, { ok: false, status: e?.status || 'ERR', error: String(e?.message || e) });
        throw e;
      }
    },

    async proxyDocusignResponse(options) {
      const accessToken = await this.getDocusignAccessToken();
      const entry = tgkDsEntry(options);
      tgkDsLogPush(entry);
      try {
        const resp = await this.proxyResponse({ ...options, accessToken });
        tgkDsEnd(entry, { ok: resp?.ok ?? true, status: resp?.status ?? 200, response: { kind: 'stream', json: '(binary / document stream)' } });
        return resp;
      } catch (e) {
        tgkDsEnd(entry, { ok: false, status: e?.status || 'ERR', error: String(e?.message || e) });
        throw e;
      }
    },

    // --- Docusign Navigator (Agreement Manager) — real agreements repository ---
    // Lists agreements from the connected account's Navigator repo, optionally
    // filtered by a party name. Uses the IAM base + JWT (adm_store_unified_repo_read).
    async getNavigatorAgreements({ party = '', limit = 50 } = {}) {
      const query = { limit };
      const trimmedParty = String(party || '').trim();
      if (trimmedParty) {
        query['parties.name_in_agreement'] = trimmedParty;
      }
      const url = this.buildDocusignUrl('/v1/accounts/{accountId}/agreements', { query });
      const result = await this.proxyDocusign({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' }
      });
      const items = Array.isArray(result)
        ? result
        : (result?.data || result?.agreements || result?.value || []);
      return items.map(mapNavigatorAgreement);
    },

    // Fetch a single Navigator agreement (full provisions) by id.
    async getNavigatorAgreement(agreementId) {
      const id = String(agreementId || '').trim();
      if (!id) {
        throw new Error('Missing Navigator agreement id.');
      }
      const url = this.buildDocusignUrl(`/v1/accounts/{accountId}/agreements/${encodeURIComponent(id)}`);
      const result = await this.proxyDocusign({ method: 'GET', url, headers: { Accept: 'application/json' } });
      return mapNavigatorAgreement(result?.data || result);
    },

    // --- Docusign Web Forms — list + embeddable instance creation ---
    // Web Forms lives on a different host (apps-d) than Navigator/Maestro (api-d).
    webFormsUrl(path) {
      return this.buildDocusignUrl(path, { baseUrl: this.docusignWebFormsBaseUrl });
    },

    // List the account's web forms. Returns normalized {id,name,isPublished,isEnabled,isPrivate}.
    async getWebForms() {
      const result = await this.proxyDocusign({
        method: 'GET',
        url: this.webFormsUrl('/api/webforms/v1.1/accounts/{accountId}/forms'),
        headers: { Accept: 'application/json' }
      });
      const items = Array.isArray(result?.items) ? result.items : (Array.isArray(result) ? result : []);
      return items.map((form) => {
        const props = form?.formProperties || {};
        return {
          id: form?.id || '',
          name: props.name || 'Untitled form',
          isPublished: !!form?.isPublished,
          isEnabled: !!form?.isEnabled,
          isPrivate: !!props.isPrivateAccess,
          hasDraftChanges: !!form?.hasDraftChanges,
          raw: form
        };
      });
    },

    // Create an EMBEDDABLE instance. clientUserId is what makes the form embeddable
    // (vs. a hosted, anonymous form). Returns {formUrl, instanceToken, ...} for the JS SDK.
    // Optional formValues prefills fields — keys are the fields' API reference names.
    async createWebFormInstance(formId, clientUserId, formValues) {
      const id = String(formId || '').trim();
      if (!id) {
        throw new Error('Missing web form id.');
      }
      const resolvedClientUserId = String(clientUserId || '').trim() || `tgk-${this.appSlug || 'demo'}-${id}`;
      const body = { clientUserId: resolvedClientUserId };
      if (formValues && typeof formValues === 'object' && Object.keys(formValues).length) {
        body.formValues = formValues;
      }
      return this.proxyDocusign({
        method: 'POST',
        url: this.webFormsUrl(`/api/webforms/v1.1/accounts/{accountId}/forms/${encodeURIComponent(id)}/instances`),
        headers: { Accept: 'application/json' },
        body
      });
    },

    // Fetch a form's input fields (for prefill mapping). Returns
    // [{ componentName, label, type, options }]. componentName is the formValues key.
    async getWebFormFields(formId) {
      const id = String(formId || '').trim();
      if (!id) {
        throw new Error('Missing web form id.');
      }
      const result = await this.proxyDocusign({
        method: 'GET',
        url: this.webFormsUrl(`/api/webforms/v1.1/accounts/{accountId}/forms/${encodeURIComponent(id)}?state=active`),
        headers: { Accept: 'application/json' }
      });
      const comps = (result && result.formContent && result.formContent.components) || {};
      const INPUT = new Set(['TextBox', 'Select', 'Currency', 'Number', 'DatePicker', 'Checkbox', 'RadioGroup', 'Email']);
      const fields = [];
      for (const key in comps) {
        const c = comps[key];
        if (c && INPUT.has(c.componentType) && c.componentName) {
          fields.push({
            componentName: c.componentName,
            label: String(c.label || ''),
            type: c.componentType,
            options: Array.isArray(c.options) ? c.options.map((o) => ({ label: o.label, value: o.value })) : null
          });
        }
      }
      return fields;
    },

    triggerMaestroWorkflow(workflowId, body) {
      return this.proxyDocusign({
        method: 'POST',
        url: this.buildDocusignUrl(`/v1/accounts/{accountId}/workflows/${workflowId}/actions/trigger`),
        body
      });
    }
  };

  window.TGK_API = TGK_API;
})();
