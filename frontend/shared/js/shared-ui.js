/**
 * Shared UI helpers and mount points for the TGK frontend.
 */

// Format numeric values to a compact dollar display.
function fmtMoney(amount) {
  const dollars = Number(amount);
  if (!Number.isFinite(dollars)) return '$0';
  if (Math.abs(dollars) >= 1e9) return '$' + (dollars / 1e9).toFixed(2) + 'B';
  if (Math.abs(dollars) >= 1e6) return '$' + (dollars / 1e6).toFixed(2) + 'M';
  if (Math.abs(dollars) >= 1e3) return '$' + (dollars / 1e3).toFixed(0) + 'K';
  return '$' + dollars.toFixed(2);
}

function normalizePercentValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.abs(numeric) < 1 ? numeric * 100 : numeric;
}

// Format percentage
function fmtPct(n) {
  const normalized = normalizePercentValue(n);
  const sign = normalized >= 0 ? '+' : '';
  return sign + normalized.toFixed(1) + '%';
}

function accountLabel(account) {
  const label = String(
    account?.metadata?.accountType
    || account?.metadata?.label
    || account?.accountType
    || account?.account_type
    || 'Account'
  ).trim();

  return label || 'Account';
}

function getConfiguredIamProducts() {
  const configuredProducts = Array.isArray(window.TGK_CONFIG?.iamProducts)
    ? window.TGK_CONFIG.iamProducts
    : [];

  return configuredProducts
    .filter((product) => product && typeof product === 'object')
    .map((product) => ({ ...product }));
}

function getDefaultIamProductKeys() {
  const configuredProducts = getConfiguredIamProducts();
  const validKeys = new Set(configuredProducts.map((product) => product.key));
  const configuredKeys = Array.isArray(window.TGK_CONFIG?.defaultIamProducts)
    ? window.TGK_CONFIG.defaultIamProducts
    : configuredProducts.map((product) => product.key);
  const normalizedKeys = [];

  configuredKeys.forEach((key) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!validKeys.has(normalizedKey) || normalizedKeys.includes(normalizedKey)) {
      return;
    }

    normalizedKeys.push(normalizedKey);
  });

  return normalizedKeys.length
    ? normalizedKeys
    : configuredProducts.map((product) => product.key);
}

function getVisibleIamProductKeys() {
  if (!window.TGK_ACCESS?.canSeeIamProducts?.()) {
    return [];
  }

  const configuredProducts = getConfiguredIamProducts();
  const validKeys = new Set(configuredProducts.map((product) => product.key));
  const candidateKeys = Array.isArray(window.TGK_DEMO?.sidebar?.iamProductKeys)
    ? window.TGK_DEMO.sidebar.iamProductKeys
    : getDefaultIamProductKeys();
  const visibleKeys = [];

  candidateKeys.forEach((key) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!validKeys.has(normalizedKey) || visibleKeys.includes(normalizedKey)) {
      return;
    }

    visibleKeys.push(normalizedKey);
  });

  return visibleKeys;
}

function getIamProducts() {
  const visibleKeys = new Set(getVisibleIamProductKeys());
  return getConfiguredIamProducts()
    .filter((product) => visibleKeys.has(product.key))
    .map((product) => ({ ...product }));
}

function getIamProduct(productKey) {
  const key = String(productKey || '').trim().toLowerCase();
  return getConfiguredIamProducts().find((product) => product.key === key) || null;
}

function getIamProductPlaceholder(productKey) {
  const product = getIamProduct(productKey);
  if (!product || product.key === 'monitor' || product.key === 'workspaces') {
    return null;
  }

  return {
    label: product.label,
    eyebrow: 'Docusign IAM Product',
    title: product.label,
    description: 'Coming soon.'
  };
}

function transactionTimestampLabel(transaction) {
  const rawTimestamp = transaction?.created_at || '';
  if (!rawTimestamp) return '';

  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function buildMonitorAlerts(customers = []) {
  const now = Date.now();
  const hour = 36e5;
  const day = 864e5;
  const investorName = (index, fallback) => {
    const customer = customers[index];
    return customer ? customer.name : fallback;
  };

  return [
    {
      id: 'alert-1',
      severity: 'critical',
      title: 'Signing activity from sanctioned region',
      description: `Envelope signed from IP 185.143.234.17 geolocated to Tehran, Iran. Investor: ${investorName(0, 'Margaret Chen')}. Document: Account Transfer Authorization.`,
      timestamp: new Date(now - 2 * hour).toISOString()
    },
    {
      id: 'alert-2',
      severity: 'high',
      title: 'Repeat failed login attempts',
      description: `14 failed authentication attempts in 6 minutes from IP 91.207.174.22 (Moscow, Russia) targeting account: ${investorName(1, 'David Torres')}.`,
      timestamp: new Date(now - 5 * hour).toISOString()
    },
    {
      id: 'alert-3',
      severity: 'high',
      title: 'Anomalous bulk document export',
      description: '47 documents downloaded in 8 minutes by operations user James Whitaker. Normal baseline: 2-5 per hour.',
      timestamp: new Date(now - 9 * hour).toISOString()
    },
    {
      id: 'alert-4',
      severity: 'medium',
      title: 'Admin permission change',
      description: `User Rachel Dunn's (Junior Associate) role was changed from "Viewer" to "Account Admin"`,
      timestamp: new Date(now - 1 * day).toISOString()
    }
  ];
}

function monitorTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

// Status badge classes
function statusClasses(status) {
  const map = {
    active: 'tgk-status-badge--success',
    review: 'tgk-status-badge--warning',
    pending: 'tgk-status-badge--info',
    completed: 'tgk-status-badge--success',
    sent: 'tgk-status-badge--info',
    delivered: 'tgk-status-badge--warning',
    created: 'tgk-status-badge--neutral',
    declined: 'tgk-status-badge--danger',
    voided: 'tgk-status-badge--neutral'
  };
  return map[(status || '').toLowerCase()] || 'tgk-status-badge--neutral';
}

// Generate initials from a name
function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(seed) {
  const value = String(seed || 'tgk-avatar');
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 42% 46%)`;
}

// SVG sparkline points for a positive/negative trend (for <polyline>)
function sparklinePath(positive) {
  if (positive) {
    return '0,20 10,18 20,15 30,16 40,12 50,10 60,8 70,6 80,4';
  }
  return '0,4 10,6 20,8 30,7 40,12 50,14 60,16 70,18 80,20';
}

function stockTickerTemplate() {
  return `
    <div class="tgk-stock-ticker" x-data="stockTicker()">
      <div class="tgk-stock-ticker__fade tgk-stock-ticker__fade--left"></div>
      <div class="tgk-stock-ticker__fade tgk-stock-ticker__fade--right"></div>
      <div class="tgk-stock-ticker__track">
        <template x-for="(item, i) in [...prices, ...prices]" :key="'t'+i">
          <span class="tgk-stock-ticker__item" :class="item.flash">
            <span class="tgk-stock-ticker__symbol" x-text="item.sym"></span>
            <span x-text="fmt(item.price)"></span>
            <span :class="item.change >= 0 ? 'tgk-stock-ticker__change--up' : 'tgk-stock-ticker__change--down'" x-text="fmtChange(item.change)"></span>
          </span>
        </template>
      </div>
    </div>
  `;
}

function newsPanelTemplate() {
  return `
    <div x-data="newsPanel()">
      <button @click="toggleOpen()" class="tgk-button tgk-button--secondary">
        <span>📺</span> Headlines <span class="tgk-news-live-dot"></span>
      </button>
      <template x-if="open">
        <div>
          <div class="tgk-news-overlay" @click="open = false"></div>
          <div class="tgk-news-sheet">
            <div class="tgk-news-header">
              <h2 class="tgk-news-title">Market Headlines</h2>
              <button @click="open = false" class="tgk-modal-close">&times;</button>
            </div>
            <input x-model="search" placeholder="Filter headlines" class="tgk-form-input tgk-news-search">
            <div class="tgk-news-filter-bar">
              <template x-for="cat in categories" :key="cat">
                <button @click="activeCategory = cat" class="tgk-filter-chip"
                  :class="{ 'tgk-filter-chip--active': activeCategory === cat }"
                  x-text="cat === 'all' ? 'All' : cat"></button>
              </template>
            </div>
            <template x-if="loading && !loaded">
              <div class="tgk-news-state">
                Loading live headlines...
              </div>
            </template>
            <template x-if="!loading && error && !loaded">
              <div class="tgk-news-state tgk-news-state--error">
                Unable to load live headlines.
              </div>
            </template>
            <template x-if="!loading && !error && loaded && filteredItems.length === 0">
              <div class="tgk-news-state">
                No live headlines matched your filters.
              </div>
            </template>
            <div class="tgk-news-list" x-show="loaded && filteredItems.length > 0">
              <template x-for="item in filteredItems" :key="item.title">
                <a
                  :href="item.link || '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="tgk-news-item"
                  :class="{ 'tgk-news-item--disabled': !item.link }">
                  <div class="tgk-news-item__meta">
                    <span class="tgk-news-item__eyebrow" x-text="item.category"></span>
                    <template x-if="item.badge">
                      <span class="tgk-badge" :class="item.badgeColor" x-text="item.badge"></span>
                    </template>
                    <span class="tgk-news-item__time" x-text="item.time"></span>
                  </div>
                  <div class="tgk-news-item__headline" x-text="item.title"></div>
                  <div class="tgk-news-item__summary" x-text="item.summary"></div>
                  <div class="tgk-news-item__impact">
                    <div class="tgk-news-impact-dot" :class="impactColor(item.impact)"></div>
                    <span x-text="item.impact + ' impact'"></span>
                  </div>
                </a>
              </template>
            </div>
            <div class="tgk-news-footer" x-show="loaded && filteredItems.length > 0">
              <span class="tgk-news-live-dot"></span> Live feed
            </div>
          </div>
        </div>
      </template>
    </div>
  `;
}

function mountSharedTemplate(element, template) {
  if (!element) return;
  element.innerHTML = template;
  if (window.Alpine && typeof window.Alpine.initTree === 'function') {
    window.Alpine.initTree(element);
  }
}

function revokeTransactionPreview(modalState) {
  const previewUrl = modalState?.previewUrl || '';
  if (previewUrl.startsWith('blob:')) {
    window.URL.revokeObjectURL(previewUrl);
  }
}

function transactionTypeValue(transaction) {
  return String(
    transaction?.type
    || transaction?.data?.type
    || ''
  ).trim().toLowerCase();
}

function isEnvelopeTransaction(transaction) {
  return transactionTypeValue(transaction) === 'envelope';
}

function resolveTransactionEnvelopeApiId(transaction) {
  const data = transaction?.data && typeof transaction.data === 'object' ? transaction.data : {};
  return String(
    data.docusignEnvelopeId
    || data.docusign_envelope_id
    || data.envelopeId
    || data.envelope_id
    || transaction?.id
    || ''
  ).trim();
}

function isNotFoundError(error) {
  return /\b404\b/.test(String(error?.message || ''));
}

function buildFallbackPreviewUrl(transaction, envelopeId) {
  const title = String(transaction?.name || 'Envelope document').trim() || 'Envelope document';
  const status = String(transaction?.status || 'unknown').trim() || 'unknown';
  const timestamp = transactionTimestampLabel(transaction);
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedStatus = status
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedEnvelopeId = String(envelopeId || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedTimestamp = String(timestamp || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return window.URL.createObjectURL(new Blob([`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapedTitle}</title>
    <style>
      body{margin:0;padding:32px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}
      .card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #dbe4ef;border-radius:20px;padding:32px;box-shadow:0 18px 40px rgba(15,23,42,.08)}
      .eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
      h1{margin:12px 0 8px;font-size:28px;line-height:1.2}
      p{margin:0 0 18px;color:#475569;line-height:1.6}
      dl{display:grid;grid-template-columns:max-content 1fr;gap:10px 16px;margin:24px 0 0}
      dt{font-weight:700;color:#334155}
      dd{margin:0;color:#0f172a}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="eyebrow">TGK Demo Preview</div>
      <h1>${escapedTitle}</h1>
      <p>Live DocuSign document content is not available for this envelope record, so the app is showing a lightweight demo preview instead of a 404.</p>
      <dl>
        <dt>Envelope ID</dt>
        <dd>${escapedEnvelopeId || 'Unavailable'}</dd>
        <dt>Status</dt>
        <dd>${escapedStatus}</dd>
        <dt>Recorded</dt>
        <dd>${escapedTimestamp || 'Unavailable'}</dd>
      </dl>
    </div>
  </body>
</html>`], { type: 'text/html' }));
}

function buildFallbackHistory(transaction) {
  const createdAt = transaction?.created_at || transaction?.createdAt || '';
  const updatedAt = transaction?.updated_at || transaction?.updatedAt || createdAt;
  const status = String(transaction?.status || '').trim().toLowerCase();
  const events = [];

  if (updatedAt && status && status !== 'created') {
    events.push({
      Action: ({
        sent: 'Sent for signature',
        delivered: 'Delivered to recipient',
        completed: 'Completed',
        declined: 'Declined',
        voided: 'Voided'
      })[status] || `Status updated to ${status}`,
      UserName: 'DocuSign',
      LogTime: updatedAt
    });
  }

  if (createdAt) {
    events.push({
      Action: 'Transaction added to TGK',
      UserName: 'TGK Demo',
      LogTime: createdAt
    });
  }

  return events;
}

function createTransactionModalHelpers() {
  return {
    transactionDocModal: null,
    transactionHistoryModal: null,

    closeTransactionDocModal() {
      revokeTransactionPreview(this.transactionDocModal);
      this.transactionDocModal = null;
    },

    closeTransactionHistoryModal() {
      this.transactionHistoryModal = null;
    },

    async viewTransactionDoc(transaction) {
      if (!isEnvelopeTransaction(transaction)) {
        this.closeTransactionDocModal();
        this.transactionDocModal = {
          transactionId: String(transaction?.id || ''),
          title: transaction?.name || 'Transaction',
          previewUrl: '',
          loading: false,
          error: 'Document preview is currently available only for envelope records.',
          requestKey: `${Date.now()}`
        };
        return;
      }

      const envelopeId = resolveTransactionEnvelopeApiId(transaction);
      if (!envelopeId) return;
      const docusignEsignBaseUrl = window.TGK_CONFIG?.docusignEsignBaseUrl || 'https://demo.docusign.net/restapi';

      const requestKey = `${envelopeId}:${Date.now()}`;
      const title = transaction?.name || 'Document';

      this.closeTransactionDocModal();
      this.transactionDocModal = {
        transactionId: envelopeId,
        title,
        previewUrl: '',
        loading: true,
        error: null,
        requestKey
      };

      try {
        const response = await TGK_API.proxyDocusignResponse({
          method: 'GET',
          url: TGK_API.buildDocusignUrl(
            `/v2.1/accounts/{accountId}/envelopes/${encodeURIComponent(envelopeId)}/documents/combined`,
            {
              baseUrl: docusignEsignBaseUrl,
              query: { certificate: 'true' }
            }
          )
        });
        const blob = await response.blob();
        const previewUrl = window.URL.createObjectURL(blob);

        if (!this.transactionDocModal || this.transactionDocModal.requestKey !== requestKey) {
          window.URL.revokeObjectURL(previewUrl);
          return;
        }

        this.transactionDocModal = {
          ...this.transactionDocModal,
          previewUrl,
          loading: false,
          error: null
        };
      } catch (error) {
        if (!this.transactionDocModal || this.transactionDocModal.requestKey !== requestKey) {
          return;
        }

        if (isNotFoundError(error)) {
          this.transactionDocModal = {
            ...this.transactionDocModal,
            previewUrl: buildFallbackPreviewUrl(transaction, envelopeId),
            loading: false,
            error: null
          };
          return;
        }

        this.transactionDocModal = {
          ...this.transactionDocModal,
          loading: false,
          error: error.message || 'Unable to load the document preview.'
        };
      }
    },

    async viewTransactionHistory(transaction) {
      if (!isEnvelopeTransaction(transaction)) {
        this.closeTransactionHistoryModal();
        this.transactionHistoryModal = {
          transactionId: String(transaction?.id || ''),
          title: transaction?.name || 'Transaction',
          events: [],
          loading: false,
          error: 'History is currently available only for envelope records.',
          requestKey: `${Date.now()}`
        };
        return;
      }

      const envelopeId = resolveTransactionEnvelopeApiId(transaction);
      if (!envelopeId) return;
      const docusignEsignBaseUrl = window.TGK_CONFIG?.docusignEsignBaseUrl || 'https://demo.docusign.net/restapi';

      const title = transaction?.name || 'Document';
      const requestKey = `${envelopeId}:${Date.now()}`;

      this.transactionHistoryModal = {
        transactionId: envelopeId,
        title,
        events: [],
        loading: true,
        error: null,
        requestKey
      };

      try {
        const result = await TGK_API.proxyDocusign({
          method: 'GET',
          url: TGK_API.buildDocusignUrl(
            `/v2.1/accounts/{accountId}/envelopes/${encodeURIComponent(envelopeId)}/audit_events`,
            { baseUrl: docusignEsignBaseUrl }
          )
        });
        const events = (result.auditEvents || [])
          .map((event) => {
            const fields = {};
            (event.eventFields || []).forEach((field) => {
              fields[field.name] = field.value;
            });
            return {
              ...fields,
              LogTime: fields.LogTime || fields.logTime || ''
            };
          })
          .filter((fields) => fields.Action);

        if (!this.transactionHistoryModal || this.transactionHistoryModal.requestKey !== requestKey) {
          return;
        }

        this.transactionHistoryModal = {
          ...this.transactionHistoryModal,
          events,
          loading: false,
          error: null
        };
      } catch (error) {
        if (!this.transactionHistoryModal || this.transactionHistoryModal.requestKey !== requestKey) {
          return;
        }

        if (isNotFoundError(error)) {
          this.transactionHistoryModal = {
            ...this.transactionHistoryModal,
            events: buildFallbackHistory(transaction),
            loading: false,
            error: null
          };
          return;
        }

        this.transactionHistoryModal = {
          ...this.transactionHistoryModal,
          loading: false,
          error: error.message || 'Unable to load document history.'
        };
      }
    }
  };
}

function sharedSettingsTemplate() {
  return `
    <section class="tgk-settings-shell">
      <div class="tgk-settings-grid">
        <div class="tgk-settings-stack">
          <section class="tgk-settings-card">
            <div class="tgk-settings-card__header">
              <div class="tgk-settings-card__eyebrow">Account</div>
            </div>

            <div class="tgk-settings-card__body tgk-settings-card__body--compact">
              <div class="tgk-settings-info-list">
                <div class="tgk-settings-info-row">
                  <span class="tgk-settings-info-label">User ID</span>
                  <span class="tgk-settings-info-value" x-text="docusignConfig.userId || 'Not configured'"></span>
                </div>
                <div class="tgk-settings-info-row">
                  <span class="tgk-settings-info-label">Account ID</span>
                  <span class="tgk-settings-info-value" x-text="docusignConfig.accountId || 'Not configured'"></span>
                </div>
              </div>

              <div class="tgk-settings-consent-row tgk-settings-consent-row--separated">
                <div class="tgk-settings-consent-copy">
                  <p class="tgk-help-text">Consent is still required before calling DocuSign APIs.</p>
                </div>
                <button
                  @click="grantDocusignConsent()"
                  :disabled="docusignConsentBusy || !hasDocusignAuthConfig()"
                  class="tgk-button tgk-button--secondary"
                  x-text="docusignConsentBusy ? 'Waiting...' : 'Grant Consent'"></button>
              </div>
              <p
                x-show="docusignConsentMessage || !hasDocusignAuthConfig()"
                class="tgk-help-text tgk-help-text--compact"
                :style="docusignConsentStatus === 'error' ? 'color:#b42318;' : docusignConsentStatus === 'success' ? 'color:#067647;' : ''"
                x-text="docusignConsentMessage || 'Configure frontend/config.js first.'"></p>
            </div>
          </section>

          <section class="tgk-settings-card">
            <div class="tgk-settings-card__header tgk-settings-card__header--split">
              <div class="tgk-settings-card__eyebrow">Sidebar Selector</div>
              <div class="tgk-settings-chip">Toggle Features</div>
            </div>

            <div class="tgk-settings-card__body tgk-settings-card__body--compact">
              <div class="tgk-settings-toggle-list tgk-settings-toggle-list--flush">
                <template x-for="product in sidebarOptions()" :key="product.key">
                  <label class="tgk-settings-toggle-row">
                    <div class="tgk-settings-toggle-copy">
                      <div class="tgk-settings-toggle-title" x-text="product.label"></div>
                    </div>
                    <span class="tgk-switch">
                      <input
                        type="checkbox"
                        class="tgk-switch__input"
                        :checked="isSidebarProductEnabled(product.key)"
                        @change="toggleSidebarProduct(product.key, $event.target.checked)">
                      <span class="tgk-switch__track"></span>
                      <span class="tgk-switch__thumb"></span>
                    </span>
                  </label>
                </template>
              </div>
            </div>
          </section>
        </div>

        <div class="tgk-settings-stack">
          <section class="tgk-settings-card">
            <div class="tgk-settings-card__header">
              <div class="tgk-settings-card__eyebrow">Branding</div>
            </div>

            <div class="tgk-settings-card__body tgk-settings-card__body--compact">
              <div class="tgk-settings-branding-grid">
                <div class="tgk-field-card tgk-field-card--compact">
                  <label class="tgk-field-label">Theme Color</label>
                  <div class="tgk-color-row tgk-color-row--compact">
                    <label class="tgk-color-swatch tgk-color-swatch--compact" :style="'background:' + brandColor">
                      <input type="color" :value="brandColor" @input="updateBrandColor($event.target.value)">
                    </label>
                    <div class="tgk-color-value" x-text="brandColor"></div>
                  </div>
                </div>

                <div class="tgk-field-card tgk-field-card--compact">
                  <label class="tgk-field-label" for="tgk-appName">App Name</label>
                  <input
                    id="tgk-appName"
                    x-model="appNameDraft"
                    @input="previewAppName()"
                    @change="commitAppName()"
                    @blur="commitAppName()"
                    class="tgk-form-input"
                    placeholder="Enter app name">
                </div>
              </div>
            </div>
          </section>

          <section class="tgk-settings-card">
            <div class="tgk-settings-card__header tgk-settings-card__header--split">
              <div class="tgk-settings-card__eyebrow">Saved Profiles</div>
              <div class="tgk-settings-profile-count" x-text="profiles.length + ' saved'"></div>
            </div>

            <div class="tgk-settings-card__body tgk-settings-card__body--compact">
              <template x-if="profiles.length">
                <div class="tgk-settings-profile-list tgk-settings-profile-list--compact">
                  <template x-for="profile in profiles" :key="profile.id">
                    <article
                      class="tgk-settings-profile-card tgk-settings-profile-card--compact"
                      :class="{ 'tgk-settings-profile-card--current': profileMatchesCurrent(profile) }"
                      @click="loadProfile(profile.id)"
                      @keydown.enter.prevent="loadProfile(profile.id)"
                      @keydown.space.prevent="loadProfile(profile.id)"
                      role="button"
                      tabindex="0">
                      <div class="tgk-settings-profile-main">
                        <div
                          class="tgk-settings-profile-mark"
                          :style="profileBadgeStyle(profile)"
                          x-text="profileBadgeText(profile)"></div>
                        <div class="tgk-settings-profile-copy">
                          <div class="tgk-settings-profile-name" x-text="profile.name"></div>
                        </div>
                      </div>

                      <div class="tgk-settings-profile-actions">
                        <button @click.stop="saveProfile(profile.id)" class="tgk-button tgk-button--secondary tgk-button--compact" type="button">Save</button>
                        <button @click.stop="deleteProfile(profile.id)" class="tgk-settings-profile-delete" type="button" aria-label="Delete profile">&times;</button>
                      </div>
                    </article>
                  </template>
                </div>
              </template>

              <template x-if="!profiles.length">
                <div class="tgk-settings-profile-empty">
                  <div class="tgk-settings-profile-empty__title">No saved profiles yet</div>
                  <p class="tgk-settings-profile-empty__text">Save the current branding and sidebar setup to reuse it later.</p>
                </div>
              </template>

              <div class="tgk-settings-profile-footer">
                <button @click="saveCurrentAsProfile()" class="tgk-button tgk-button--secondary" type="button">+ Save Current as Profile</button>
                <button @click="resetAllDefaults()" class="tgk-button tgk-button--secondary" type="button">Reset defaults</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function sharedTransactionModalTemplate() {
  return `
    <template x-if="transactionDocModal">
      <div class="tgk-modal-shell" @keydown.escape.window="closeTransactionDocModal()">
        <div class="tgk-modal-backdrop" @click="closeTransactionDocModal()"></div>
        <div class="tgk-modal-card tgk-modal-card--document" @click.stop>
          <div class="tgk-modal-header">
            <div>
              <div class="tgk-modal-eyebrow">Preview</div>
              <h3 class="tgk-modal-title" x-text="transactionDocModal.title"></h3>
              <div class="tgk-modal-meta" x-text="transactionDocModal.transactionId"></div>
            </div>
            <div class="tgk-inline-actions tgk-inline-actions--end">
              <button @click="closeTransactionDocModal()" class="tgk-modal-close" aria-label="Close document preview">&times;</button>
            </div>
          </div>

          <div class="tgk-modal-body tgk-modal-body--document">
            <template x-if="transactionDocModal.loading">
              <div class="tgk-modal-empty">
                <div class="tgk-modal-empty__title">Loading document preview</div>
                <div class="tgk-modal-empty__text">Preparing the combined PDF.</div>
              </div>
            </template>

            <template x-if="!transactionDocModal.loading && transactionDocModal.error">
              <div class="tgk-modal-empty tgk-modal-empty--error">
                <div class="tgk-modal-empty__title">Unable to load preview</div>
                <div class="tgk-modal-empty__text" x-text="transactionDocModal.error"></div>
              </div>
            </template>

            <iframe
              x-show="!transactionDocModal.loading && !transactionDocModal.error && transactionDocModal.previewUrl"
              :src="transactionDocModal.previewUrl"
              class="tgk-document-frame"
              title="Document preview">
            </iframe>
          </div>
        </div>
      </div>
    </template>

    <template x-if="transactionHistoryModal">
      <div class="tgk-modal-shell" @keydown.escape.window="closeTransactionHistoryModal()">
        <div class="tgk-modal-backdrop" @click="closeTransactionHistoryModal()"></div>
        <div class="tgk-modal-card tgk-modal-card--history" @click.stop>
          <div class="tgk-modal-header">
            <div>
              <div class="tgk-modal-eyebrow">Document History</div>
              <h3 class="tgk-modal-title" x-text="transactionHistoryModal.title"></h3>
              <div class="tgk-modal-meta" x-text="transactionHistoryModal.transactionId"></div>
            </div>
            <button @click="closeTransactionHistoryModal()" class="tgk-modal-close" aria-label="Close document history">&times;</button>
          </div>

          <div class="tgk-modal-body tgk-modal-body--history">
            <template x-if="transactionHistoryModal.loading">
              <div class="tgk-modal-empty">
                <div class="tgk-modal-empty__title">Loading activity</div>
                <div class="tgk-modal-empty__text">Fetching the latest audit trail.</div>
              </div>
            </template>

            <template x-if="!transactionHistoryModal.loading && transactionHistoryModal.error">
              <div class="tgk-modal-empty tgk-modal-empty--error">
                <div class="tgk-modal-empty__title">Unable to load history</div>
                <div class="tgk-modal-empty__text" x-text="transactionHistoryModal.error"></div>
              </div>
            </template>

            <template x-if="!transactionHistoryModal.loading && !transactionHistoryModal.error && transactionHistoryModal.events.length === 0">
              <div class="tgk-modal-empty">
                <div class="tgk-modal-empty__title">No activity yet</div>
                <div class="tgk-modal-empty__text">No audit events are available yet.</div>
              </div>
            </template>

            <div class="tgk-history-list" x-show="!transactionHistoryModal.loading && !transactionHistoryModal.error && transactionHistoryModal.events.length > 0">
              <template x-for="(evt, index) in transactionHistoryModal.events" :key="index">
                <div class="tgk-history-item">
                  <div class="tgk-history-item__dot"></div>
                  <div class="tgk-history-item__copy">
                    <div class="tgk-history-item__title" x-text="evt.Action"></div>
                    <div class="tgk-history-item__meta" x-text="evt.UserName || evt.UserEmail || evt.RecipientEmail || 'Docusign'"></div>
                  </div>
                  <div class="tgk-history-item__time" x-text="evt.LogTime ? new Date(evt.LogTime).toLocaleString() : ''"></div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  `;
}

function mountSettingsPanel(element) {
  mountSharedTemplate(element, sharedSettingsTemplate());
}

function mountTransactionModals(element) {
  mountSharedTemplate(element, sharedTransactionModalTemplate());
}
