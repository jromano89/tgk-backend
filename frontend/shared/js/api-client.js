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
      return this.proxy({
        ...options,
        accessToken: await this.getDocusignAccessToken()
      });
    },

    async proxyDocusignResponse(options) {
      return this.proxyResponse({
        ...options,
        accessToken: await this.getDocusignAccessToken()
      });
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
