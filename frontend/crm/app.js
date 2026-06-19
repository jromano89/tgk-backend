const MAESTRO_COMPLETION_SETTLE_DELAY_MS = 400;
const MAESTRO_SUCCESS_REDIRECT_DELAY_MS = 2000;
const CLIENT_DETAIL_REFRESH_MAX_MS = 20 * 60 * 1000;

const AGREEMENT_TYPE_PALETTE = ['#3567df', '#16a34a', '#ea580c', '#8b5cf6', '#0891b2', '#64748b'];

function normalizeStatusValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getTerminology(key, fallback) {
  return window.TGK_CONFIG?.terminology?.[key] || fallback;
}

function getAgreementsConfig() {
  return window.TGK_CONFIG?.agreements || {};
}

function getKpisConfig(role) {
  return window.TGK_CONFIG?.kpis?.[role] || [];
}

function agreementTypeForName(name) {
  const taxonomy = getAgreementsConfig().taxonomy;
  if (Array.isArray(taxonomy) && taxonomy.length > 0) {
    const normalized = String(name || '').trim().toLowerCase();
    for (const entry of taxonomy) {
      if (normalized.includes(entry.type) || normalized.includes(entry.label.toLowerCase())) {
        return entry.label;
      }
    }
    return taxonomy[taxonomy.length - 1]?.label || 'Other';
  }
  const normalized = String(name || '').trim().toLowerCase();
  if (!normalized) return 'Other';
  if (normalized.includes('opening')) return 'Account Opening';
  if (normalized.includes('transfer') || normalized.includes('acat')) return 'Transfer';
  if (normalized.includes('beneficiary') || normalized.includes('maintenance') || normalized.includes('wire') || normalized.includes('update')) return 'Maintenance';
  return 'Other';
}

function agreementTypeForTransaction(transaction) {
  return agreementTypeForName(transaction?.name);
}

function getInitialCrmView() {
  const view = new URL(window.location.href).searchParams.get('view');
  return String(view || 'dashboard').trim() || 'dashboard';
}

// Local KPI fallbacks so the dashboard populates with no instance config.
const CRM_DEFAULT_KPIS = [
  { key: 'pipeline', label: 'Total Pipeline', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+8.4% this quarter' },
  { key: 'openDeals', label: 'Open Deals', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: 'Live opportunities' },
  { key: 'activitiesDue', label: 'Activities Due', format: 'number', static: 0, trend: 'Follow-ups this week' },
  { key: 'alerts', label: 'Alerts', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: 'Needs attention' }
];

function crmApp() {
  const preferredAdvisorId = String(window.TGK_CONFIG?.advisorId || '').trim();

  return {
    ...createPortalChromeState({
      currentKey: 'view',
      defaultView: 'dashboard',
      coreViews: ['dashboard', 'deals', 'activities', 'documents', 'monitor', 'client']
    }),
    ...createWorkflowLoadingState({
      loadingKey: 'maestroLoading',
      loadingIndexKey: 'onboardingLoadingIndex',
      loadingTimerKey: 'onboardingLoadingTimer',
      stepsKey: 'onboardingLoadingSteps',
      steps: [
        'Connecting to Docusign IAM',
        'Preparing ' + getTerminology('onboardingWorkflowLabel', 'contact onboarding').toLowerCase(),
        'Launching the embedded experience'
      ]
    }),
    ...createTransactionModalHelpers(),
    view: 'dashboard',
    currentUser: null,
    customers: [],
    activities: [],
    activitiesLoading: false,
    activitiesLoaded: false,
    selectedContact: null,

    // Navigator agreements for the selected contact's company
    navAgreements: [],
    navLoading: false,
    navError: null,
    _clientDetailEventsSubscription: null,
    _clientDetailEventsTimeout: null,
    searchQuery: '',
    showOnboarding: false,
    maestroInstanceUrl: '',
    maestroError: null,
    maestroCompleted: false,
    maestroNewContact: null,
    loading: true,
    totalAgreementCount: getAgreementsConfig().summaryMetrics?.totalCount ?? 128,
    agreementCompletionRateValue: getAgreementsConfig().summaryMetrics?.completionRate ?? 87,
    agreementVolumeSeries: getAgreementsConfig().volumeSeries || [5, 6, 4, 8, 9, 11, 8, 12, 14, 15, 16, 20],
    allAgreements: [],
    agreementSearchQuery: '',
    agreementsLoading: false,
    agreementsLoaded: false,
    _maestroCreationEventsSubscription: null,
    _maestroRedirectTimer: null,
    _maestroTrackingStarted: false,
    _maestroKnownContactIds: new Set(),
    workspaceStatus: '',

    async init() {
      this.initializePortalChrome();
      void TGK_API.prefetchDocusignAccessToken();
      try {
        const [employees, customers] = await Promise.all([
          TGK_API.getEmployees(),
          TGK_API.getCustomers()
        ]);
        this.currentUser = employees.find((employee) => employee.id === preferredAdvisorId) || employees[0] || null;
        this.customers = customers;
        this.setView(getInitialCrmView());
      } catch (e) {
        console.error('Failed to load customers:', e);
      }
      this.loading = false;
    },

    // --- Terminology getters (config-driven, CRM fallbacks) ---
    get t() {
      const t = window.TGK_CONFIG?.terminology || {};
      return {
        portalName: t.portalName || 'Acme CRM',
        advisorRole: t.advisorRole || 'Account Manager',
        clientRole: t.clientRole || 'Contact',
        clientRolePlural: t.clientRolePlural || 'Contacts',
        advisorPortalLabel: t.advisorPortalLabel || 'CRM Portal',
        clientPortalLabel: t.clientPortalLabel || 'Contact Portal',
        clientBookLabel: t.clientBookLabel || 'Contacts & Companies',
        onboardingAction: t.onboardingAction || 'New Contact',
        onboardingWorkflowLabel: t.onboardingWorkflowLabel || 'Contact Onboarding',
        maintenanceWorkflowLabel: t.maintenanceWorkflowLabel || 'Record Update',
        dealLabel: t.dealLabel || 'Deal',
        dealPluralLabel: t.dealPluralLabel || 'Deals',
        activityPluralLabel: t.activityPluralLabel || 'Activities'
      };
    },

    get kpiDefinitions() {
      const configured = getKpisConfig('advisor');
      return configured.length > 0 ? configured : CRM_DEFAULT_KPIS;
    },

    // --- Deals / pipeline (accounts flattened across contacts) ---
    get deals() {
      return this.customers.flatMap((contact) =>
        customerAccounts(contact).map((acct) => ({
          id: acct.id,
          name: accountName(acct),
          label: accountLabel(acct),
          value: accountValue(acct),
          status: acct.status || contact.metadata?.status || 'active',
          contactName: contact.name,
          contactId: contact.id,
          contact
        }))
      );
    },

    get totalPipeline() {
      return this.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    },

    async ensureActivitiesFeed(force = false) {
      if (this.activitiesLoading || (this.activitiesLoaded && !force)) {
        return;
      }
      this.activitiesLoading = true;
      try {
        this.activities = await TGK_API.getTasks();
        this.activitiesLoaded = true;
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        this.activitiesLoading = false;
      }
    },

    computeKpi(kpiDef) {
      if (kpiDef.static != null) return kpiDef.static;
      if (kpiDef.key === 'openDeals') return this.deals.length;
      if (kpiDef.key === 'pipeline') return this.totalPipeline;
      if (kpiDef.aggregate === 'countWhere') {
        return this.customers.filter(c => normalizeStatusValue(c.metadata?.status) === kpiDef.countWhereValue).length;
      }
      if (kpiDef.computeFrom === 'accounts.balance' || kpiDef.computeFrom === 'data.value') {
        return this.customers.reduce((sum, c) => sum + (c.metadata?.value || 0), 0);
      }
      if (kpiDef.computeFrom === 'data.netWorth') {
        return this.customers.reduce((sum, c) => sum + (c.metadata?.netWorth || 0), 0);
      }
      return 0;
    },

    formatKpi(kpiDef, value) {
      if (kpiDef.format === 'currency') return fmtMoney(value);
      if (kpiDef.format === 'percent') return fmtPct(value);
      return String(value);
    },

    isCoreView(viewName = this.view) {
      return this.isCorePortalView(viewName);
    },

    setView(nextView) {
      const resolvedView = this.setPortalView(nextView);

      if (resolvedView === 'documents') {
        void this.ensureAgreementFeed();
      }
      if (resolvedView === 'activities') {
        void this.ensureActivitiesFeed();
      }
      if (resolvedView === 'monitor') {
        this.ensureMonitorAlerts();
      }
    },

    getAccountOpeningWorkflowId() {
      return String(window.TGK_CONFIG?.workflows?.accountOpeningId || '').trim();
    },

    get filteredCustomers() {
      if (!this.searchQuery.trim()) return this.customers;
      const q = this.searchQuery.toLowerCase();
      return this.customers.filter(c =>
        `${c.name} ${c.email} ${c.company || ''} ${c.metadata?.riskProfile || ''}`.toLowerCase().includes(q)
      );
    },

    get totalAum() {
      return this.customers.reduce((sum, c) => sum + customerPortfolioValue(c), 0);
    },

    get totalNetWorth() {
      return this.customers.reduce((sum, c) => sum + (c.metadata?.netWorth || 0), 0);
    },

    get pendingReviews() {
      return this.customers.filter(c => normalizeStatusValue(c.metadata?.status) === 'review').length;
    },

    get complianceAlerts() {
      return this.customers.filter((customer) => normalizeStatusValue(customer.metadata?.status) !== 'active').length;
    },

    get agreementTypeBreakdown() {
      const counts = this.allAgreements.reduce((map, agreement) => {
        const type = agreementTypeForTransaction(agreement);
        map.set(type, (map.get(type) || 0) + 1);
        return map;
      }, new Map());

      return Array.from(counts.entries()).map(([label, value], index) => ({
        label,
        value,
        color: AGREEMENT_TYPE_PALETTE[index % AGREEMENT_TYPE_PALETTE.length]
      }));
    },

    get agreementVolumePeak() {
      return Math.max(...this.agreementVolumeSeries, 1);
    },

    get agreementTurnaroundHours() {
      return getAgreementsConfig().turnaroundHours ?? 7.1;
    },

    get agreementTypeGradient() {
      if (this.agreementTypeBreakdown.length === 0) {
        return 'conic-gradient(#dbe4ef 0% 100%)';
      }

      const total = this.agreementTypeBreakdown.reduce((sum, item) => sum + item.value, 0) || 1;
      let offset = 0;

      return `conic-gradient(${this.agreementTypeBreakdown.map((item) => {
        const start = offset;
        offset += (item.value / total) * 100;
        return `${item.color} ${start}% ${offset}%`;
      }).join(', ')})`;
    },

    agreementBarStyle(value, index) {
      const lastIndex = this.agreementVolumeSeries.length - 1;
      const ratio = lastIndex <= 0 ? 1 : index / lastIndex;
      const lightness = 84 - (ratio * 14);
      const fill = index === lastIndex
        ? 'linear-gradient(180deg, #4e83e7 0%, #3567df 100%)'
        : `linear-gradient(180deg, hsl(214 76% ${Math.min(lightness + 4, 88)}%) 0%, hsl(214 70% ${lightness}%) 100%)`;

      return `height:${Math.max((value / this.agreementVolumePeak) * 100, 16)}%;background:${fill};`;
    },

    async ensureAgreementFeed(force = false) {
      if (this.agreementsLoading || (this.agreementsLoaded && !force)) {
        return;
      }

      this.agreementsLoading = true;
      try {
        const transactions = await TGK_API.getTransactions();
        this.allAgreements = transactions.filter(isEnvelopeTransaction);
        this.agreementsLoaded = true;
      } catch (error) {
        console.error('Failed to load agreements:', error);
      } finally {
        this.agreementsLoading = false;
      }
    },

    get filteredAgreements() {
      const query = this.agreementSearchQuery.trim().toLowerCase();
      const agreements = [...this.allAgreements].sort((left, right) => {
        const leftDate = new Date(left.created_at || 0).getTime();
        const rightDate = new Date(right.created_at || 0).getTime();
        return rightDate - leftDate;
      });

      if (!query) {
        return agreements;
      }

      return agreements.filter((agreement) => {
        const investor = this.getAgreementInvestorName(agreement);
        return [
          agreement.name,
          agreement.id,
          agreement.type,
          agreement.status,
          investor
        ].some((value) => String(value || '').toLowerCase().includes(query));
      });
    },

    getAgreementInvestorName(agreement) {
      const customerId = agreement?.customer_id || agreement?.customerId;
      const matchedCustomer = this.customers.find((customer) => customer.id === customerId);
      return matchedCustomer?.name
        || 'Unassigned ' + getTerminology('clientRole', 'investor').toLowerCase();
    },

    async viewClient(contact) {
      TGK_API.setPreferredCustomerId(contact?.id);
      this.selectedContact = contact;
      try {
        const detail = await TGK_API.getCustomer(contact.id, { includeTasks: false });
        this.selectedContact = detail;
        TGK_API.setPreferredCustomerId(detail.id);
      } catch (e) {
        console.error('Failed to load customer detail:', e);
      }
      this.setView('client');
      this.startClientDetailEvents(contact.id);
      // Query Navigator for agreements with this contact's company.
      void this.loadNavigatorAgreements(this.selectedContact?.company || this.selectedContact?.name);
    },

    // --- Navigator (real agreements from the connected Docusign account) ---
    async loadNavigatorAgreements(party) {
      this.navAgreements = [];
      this.navError = null;
      const name = String(party || '').trim();
      if (!name) return;
      this.navLoading = true;
      try {
        this.navAgreements = await TGK_API.getNavigatorAgreements({ party: name, limit: 50 });
      } catch (e) {
        console.error('Failed to load Navigator agreements:', e);
        this.navError = e.message || 'Could not load agreements from Navigator.';
      } finally {
        this.navLoading = false;
      }
    },

    openAgreementDoc(ag) {
      if (!ag?.sourceEnvelopeId) return;
      this.viewTransactionDoc({
        id: ag.sourceEnvelopeId,
        type: 'envelope',
        name: ag.title,
        status: ag.status,
        data: { docusignEnvelopeId: ag.sourceEnvelopeId }
      });
    },

    startClientDetailEvents(contactId) {
      this.stopClientDetailEvents();
      if (normalizeStatusValue(this.selectedContact?.metadata?.status) !== 'pending') return;
      const app = this;
      const subscription = TGK_API.subscribeDataEvents({
        onConnected() {
          void app.refreshSelectedContactDetail(contactId);
        },
        onChange(event) {
          if (event?.resource !== 'customers' || event.id !== contactId) {
            return;
          }
          void app.refreshSelectedContactDetail(contactId);
        },
        onError(error) {
          console.warn('Customer detail event stream error:', error);
        }
      });

      if (!subscription.supported) {
        console.warn('Server-Sent Events are not supported in this browser.');
        return;
      }

      this._clientDetailEventsSubscription = subscription;
      this._clientDetailEventsTimeout = window.setTimeout(function () {
        app.stopClientDetailEvents();
      }, CLIENT_DETAIL_REFRESH_MAX_MS);
    },

    async refreshSelectedContactDetail(contactId) {
      try {
        if (this.view !== 'client' || !this.selectedContact || this.selectedContact.id !== contactId) {
          this.stopClientDetailEvents();
          return null;
        }
        const detail = await TGK_API.getCustomer(contactId, { includeTasks: false });
        this.selectedContact = detail;
        const idx = this.customers.findIndex(c => c.id === contactId);
        if (idx !== -1) {
          this.customers[idx] = { ...this.customers[idx], ...detail, accounts: undefined, transactions: undefined };
        }
        if (normalizeStatusValue(detail.metadata?.status) === 'active') {
          this.stopClientDetailEvents();
        }
        return detail;
      } catch (e) {
        return null;
      }
    },

    stopClientDetailEvents() {
      if (this._clientDetailEventsSubscription) {
        this._clientDetailEventsSubscription.close();
        this._clientDetailEventsSubscription = null;
      }
      if (this._clientDetailEventsTimeout) {
        window.clearTimeout(this._clientDetailEventsTimeout);
        this._clientDetailEventsTimeout = null;
      }
    },

    async deleteCustomer(contact, event) {
      event.stopPropagation();
      try {
        await TGK_API.deleteCustomer(contact.id);
        this.customers = this.customers.filter(c => c.id !== contact.id);
        if (this.selectedContact?.id === contact.id) {
          this.goBack();
        }
      } catch (e) {
        console.error('Failed to delete customer:', e);
      }
    },

    goBack() {
      this.stopClientDetailEvents();
      this.setView('dashboard');
      this.selectedContact = null;
    },

    resetOnboardingState() {
      this.showOnboarding = false;
      this.maestroInstanceUrl = '';
      this.maestroError = null;
      this.maestroLoading = false;
      this.maestroCompleted = false;
      this.maestroNewContact = null;
      this.stopMaestroCreationEvents();
      this.clearOnboardingRedirectTimer();
      this.stopWorkflowLoading();
      this._maestroTrackingStarted = false;
      this._maestroKnownContactIds = new Set();
    },

    async openOnboarding() {
      this.resetOnboardingState();
      this.showOnboarding = true;
      await this.loadMaestroWorkflow();
    },

    closeOnboarding() {
      this.resetOnboardingState();
    },

    clearOnboardingRedirectTimer() {
      if (this._maestroRedirectTimer) {
        window.clearTimeout(this._maestroRedirectTimer);
        this._maestroRedirectTimer = null;
      }
    },

    async fetchMaestroCustomers() {
      try {
        return await TGK_API.getCustomers();
      } catch (e) {
        return [];
      }
    },

    async snapshotMaestroCustomers() {
      const customers = await this.fetchMaestroCustomers();
      this._maestroKnownContactIds = new Set((customers || []).map((customer) => customer.id));
    },

    async refreshContactsAfterOnboarding(targetId) {
      try {
        const customers = await TGK_API.getCustomers();
        this.customers = customers;
        return customers.find((customer) => customer.id === targetId) || null;
      } catch (e) {
        return null;
      }
    },

    async handleOnboardingFrameLoad() {
      if (this._maestroTrackingStarted || this.maestroCompleted || this.maestroError) {
        return;
      }
      this._maestroTrackingStarted = true;
      await this.snapshotMaestroCustomers();
      if (!this.showOnboarding || this.maestroCompleted) {
        return;
      }
      this.startMaestroCreationEvents();
    },

    findNewMaestroCustomer(extensionCustomers) {
      const knownIds = this._maestroKnownContactIds || new Set();
      const newCustomers = (extensionCustomers || []).filter((customer) => !knownIds.has(customer.id));
      if (newCustomers.length === 0) return null;
      return newCustomers.reduce(function (a, b) {
        return new Date(b.created_at) > new Date(a.created_at) ? b : a;
      });
    },

    async checkForNewMaestroCustomer() {
      if (!this.showOnboarding || this.maestroCompleted) return;
      try {
        const extensionCustomers = await this.fetchMaestroCustomers();
        const target = this.findNewMaestroCustomer(extensionCustomers);
        if (target) {
          await this.completeOnboardingWithContact(target);
        }
      } catch (e) {
        console.warn('Could not check for Maestro-created customers:', e);
      }
    },

    startMaestroCreationEvents() {
      this.stopMaestroCreationEvents();
      const app = this;
      const subscription = TGK_API.subscribeDataEvents({
        onConnected() {
          void app.checkForNewMaestroCustomer();
        },
        onChange(event) {
          if (event?.resource !== 'customers' || event.action !== 'create' || !event.id) {
            return;
          }
          if (app._maestroKnownContactIds?.has(event.id)) {
            return;
          }
          void app.completeOnboardingWithContact({ ...(event.record || {}), id: event.id });
        },
        onError(error) {
          console.warn('Maestro customer event stream error:', error);
        }
      });

      if (!subscription.supported) {
        console.warn('Server-Sent Events are not supported in this browser.');
        return;
      }

      this._maestroCreationEventsSubscription = subscription;
    },

    stopMaestroCreationEvents() {
      if (this._maestroCreationEventsSubscription) {
        this._maestroCreationEventsSubscription.close();
        this._maestroCreationEventsSubscription = null;
      }
    },

    async completeOnboardingWithContact(target) {
      if (!target || this.maestroCompleted || this._maestroRedirectTimer) return;
      this.stopMaestroCreationEvents();
      this.clearOnboardingRedirectTimer();
      if (this._maestroKnownContactIds) {
        this._maestroKnownContactIds.add(target.id);
      }
      const resolvedTarget = await this.refreshContactsAfterOnboarding(target.id) || target;
      const app = this;
      this._maestroRedirectTimer = window.setTimeout(function () {
        app.maestroCompleted = true;
        app.maestroNewContact = resolvedTarget;
        app._maestroRedirectTimer = window.setTimeout(function () {
          app.resetOnboardingState();
          app.viewClient(resolvedTarget);
        }, MAESTRO_SUCCESS_REDIRECT_DELAY_MS);
      }, MAESTRO_COMPLETION_SETTLE_DELAY_MS);
    },

    async loadMaestroWorkflow() {
      this.stopMaestroCreationEvents();
      this.clearOnboardingRedirectTimer();
      this._maestroTrackingStarted = false;
      this._maestroKnownContactIds = new Set();
      this.maestroLoading = true;
      this.maestroError = null;
      this.maestroInstanceUrl = '';
      this.startWorkflowLoading();

      try {
        const workflowId = this.getAccountOpeningWorkflowId();
        if (!workflowId) {
          throw new Error('No account opening workflow is configured.');
        }

        const result = await TGK_API.triggerMaestroWorkflow(workflowId, {
          instance_name: `${getTerminology('portalName', 'Acme CRM')} ${getTerminology('onboardingWorkflowLabel', 'Contact Onboarding')} ${new Date().toISOString()}`,
          trigger_inputs: {
            appSlug: window.TGK_CONFIG?.appSlug
          }
        });

        if (!result?.instance_url) {
          throw new Error('Docusign IAM did not return a launch URL.');
        }

        this.maestroInstanceUrl = result.instance_url;
      } catch (e) {
        console.error('Failed to load Maestro workflow:', e);
        this.maestroError = e.message || 'Failed to launch contact onboarding.';
        this.stopMaestroCreationEvents();
      } finally {
        this.maestroLoading = false;
        this.stopWorkflowLoading();
      }
    }
  };
}
