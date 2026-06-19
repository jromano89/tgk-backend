/**
 * Alpine components for the Navigator and Web Forms IAM product views.
 *
 * Navigator: lists agreements from the connected account's Navigator repository.
 * Web Forms: lists the account's web forms and embeds the selected one using the
 *   official Docusign JS SDK (a raw iframe of the hosted form frame-busts; the SDK
 *   loads an embed-sanctioned URL with the instance token, which does not).
 */

// Lazily inject the Docusign JS bundle once and resolve window.DocuSign.
let _docusignSdkPromise = null;
function loadDocusignWebFormsSdk() {
  if (window.DocuSign?.loadDocuSign) {
    return Promise.resolve(window.DocuSign);
  }
  if (_docusignSdkPromise) {
    return _docusignSdkPromise;
  }

  const src = window.TGK_CONFIG?.docusignWebFormsJsUrl || 'https://js-d.docusign.com/bundle.js';
  _docusignSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (window.DocuSign?.loadDocuSign) {
        resolve(window.DocuSign);
      } else {
        reject(new Error('Docusign JS loaded but window.DocuSign is unavailable.'));
      }
    };
    script.onerror = () => {
      _docusignSdkPromise = null;
      reject(new Error('Failed to load the Docusign Web Forms SDK.'));
    };
    document.head.appendChild(script);
  });

  return _docusignSdkPromise;
}

function navigatorView() {
  return {
    agreements: [],
    loading: false,
    error: '',
    searchQuery: '',
    selected: null,

    async initNavigator() {
      if (this.agreements.length || this.loading) {
        return;
      }
      await this.loadAgreements();
    },

    async loadAgreements() {
      this.loading = true;
      this.error = '';
      try {
        this.agreements = await window.TGK_API.getNavigatorAgreements({ limit: 50 });
      } catch (error) {
        this.error = error?.message || 'Could not load Navigator agreements.';
        this.agreements = [];
      } finally {
        this.loading = false;
      }
    },

    filteredAgreements() {
      const query = String(this.searchQuery || '').trim().toLowerCase();
      if (!query) {
        return this.agreements;
      }
      return this.agreements.filter((agreement) => {
        const haystack = [agreement.title, agreement.type, agreement.status, ...(agreement.parties || [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    },

    async select(agreement) {
      this.selected = agreement;
      // Best-effort hydrate full provisions; the list row is already a usable fallback.
      try {
        const full = await window.TGK_API.getNavigatorAgreement(agreement.id);
        if (full && this.selected && this.selected.id === agreement.id) {
          this.selected = full;
        }
      } catch (error) {
        // Keep the list-level record on detail failure.
      }
    },

    clearSelection() {
      this.selected = null;
    },

    formatParties(agreement) {
      const parties = (agreement?.parties || []).filter(Boolean);
      return parties.length ? parties.join(', ') : '—';
    },

    formatValue(agreement) {
      if (agreement?.value == null || agreement.value === '') {
        return '';
      }
      const currency = agreement.valueCurrency || 'USD';
      const numeric = Number(agreement.value);
      if (!Number.isFinite(numeric)) {
        return '';
      }
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(numeric);
      } catch (error) {
        return `${currency} ${numeric.toLocaleString()}`;
      }
    },

    formatDate(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
    }
  };
}

function webFormsView() {
  return {
    forms: [],
    loading: false,
    error: '',
    hiddenCount: 0,
    selectedFormId: '',
    embedding: false,
    embedError: '',
    _instance: null,

    async initWebForms() {
      if (this.forms.length || this.loading) {
        return;
      }
      await this.loadForms();
    },

    async loadForms() {
      this.loading = true;
      this.error = '';
      try {
        const allForms = await window.TGK_API.getWebForms();
        // Only published, enabled, public forms can be embedded; others would
        // frame-bust or require auth, so surface them as a hidden count instead.
        const embeddable = allForms.filter((form) => form.isPublished && form.isEnabled && !form.isPrivate);
        this.hiddenCount = allForms.length - embeddable.length;
        this.forms = embeddable;
      } catch (error) {
        this.error = error?.message || 'Could not load web forms.';
        this.forms = [];
      } finally {
        this.loading = false;
      }
    },

    isSelected(formId) {
      return this.selectedFormId === formId;
    },

    async embed(form) {
      if (this.embedding) {
        return;
      }
      this.selectedFormId = form.id;
      this.embedding = true;
      this.embedError = '';
      this._teardownInstance();

      const mountEl = this.$refs.embedMount;
      if (mountEl) {
        mountEl.innerHTML = '';
      }

      try {
        const clientId = window.TGK_API.docusignClientId;
        if (!clientId) {
          throw new Error('Missing Docusign client ID (config.docusignClientId).');
        }

        const [instance, ds] = await Promise.all([
          window.TGK_API.createWebFormInstance(form.id),
          loadDocusignWebFormsSdk()
        ]);

        if (!instance?.formUrl || !instance?.instanceToken) {
          throw new Error('Web form instance did not return an embeddable URL/token.');
        }
        // Guard against a race where the user clicked another form mid-load.
        if (this.selectedFormId !== form.id) {
          return;
        }

        const docusign = await ds.loadDocuSign(clientId);
        this._instance = docusign.webforms({
          url: instance.formUrl,
          instanceToken: instance.instanceToken
        });
        this._instance.mount(this.$refs.embedMount);
      } catch (error) {
        this.embedError = error?.message || 'Could not embed the web form.';
      } finally {
        this.embedding = false;
      }
    },

    closeEmbed() {
      this._teardownInstance();
      this.selectedFormId = '';
      this.embedError = '';
      if (this.$refs.embedMount) {
        this.$refs.embedMount.innerHTML = '';
      }
    },

    selectedFormName() {
      const match = this.forms.find((form) => form.id === this.selectedFormId);
      return match ? match.name : '';
    },

    _teardownInstance() {
      if (this._instance && typeof this._instance.destroy === 'function') {
        try {
          this._instance.destroy();
        } catch (error) {
          // Ignore teardown failures.
        }
      }
      this._instance = null;
    }
  };
}

window.navigatorView = navigatorView;
window.webFormsView = webFormsView;
window.loadDocusignWebFormsSdk = loadDocusignWebFormsSdk;
