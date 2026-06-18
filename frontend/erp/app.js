// Generic ERP portal.
// Reuses the shared TGK primitives, relabeled for operations:
//   customers -> Vendors/Suppliers, accounts -> Orders, tasks -> Approvals,
//   transactions -> Invoices/Agreements.
// All formatting/account/transaction-modal helpers come from shared/js/shared-ui.js.

function getTerminology(key, fallback) {
  return window.TGK_CONFIG?.terminology?.[key] || fallback;
}

function getKpisConfig(role) {
  return window.TGK_CONFIG?.kpis?.[role] || [];
}

function normalizeStatusValue(value) {
  return String(value || '').trim().toLowerCase();
}

// Local KPI fallbacks so the dashboard populates with no instance config.
const ERP_DEFAULT_KPIS = [
  { key: 'openOrders', label: 'Open Orders', format: 'number', trend: 'In fulfillment' },
  { key: 'orderValue', label: 'Order Value', format: 'currency', trend: '+5.1% this quarter' },
  { key: 'pendingApprovals', label: 'Pending Approvals', format: 'number', trend: 'Awaiting sign-off' },
  { key: 'alerts', label: 'Alerts', format: 'number', aggregate: 'countWhere', countWhereValue: 'review', trend: 'Needs attention' }
];

function getInitialErpView() {
  const view = new URL(window.location.href).searchParams.get('view');
  return String(view || 'orders').trim() || 'orders';
}

function erpApp() {
  const preferredUserId = String(window.TGK_CONFIG?.advisorId || '').trim();

  return {
    ...createPortalChromeState({
      currentKey: 'view',
      defaultView: 'orders',
      coreViews: ['orders', 'vendors', 'invoices', 'vendorDetail', 'monitor']
    }),
    ...createWorkflowLoadingState({
      loadingKey: 'erpSendLoading',
      loadingIndexKey: 'erpSendStepIndex',
      loadingTimerKey: 'erpSendStepTimer',
      stepsKey: 'erpSendSteps',
      steps: [
        'Connecting to Docusign IAM',
        'Preparing the agreement',
        'Launching the embedded experience'
      ]
    }),
    ...createTransactionModalHelpers(),

    view: 'orders',
    currentUser: null,
    vendors: [],
    selectedVendor: null,
    searchQuery: '',
    loading: true,

    // Invoices (transactions)
    invoices: [],
    invoicesLoading: false,
    invoicesLoaded: false,
    invoiceSearchQuery: '',

    // Approvals (tasks)
    approvals: [],
    approvalsLoading: false,
    approvalsLoaded: false,

    // Send-for-signature modal
    showSend: false,
    sendKind: null,
    sendInstanceUrl: '',
    sendError: null,

    async init() {
      this.initializePortalChrome();
      void TGK_API.prefetchDocusignAccessToken();
      try {
        const [employees, vendors] = await Promise.all([
          TGK_API.getEmployees(),
          TGK_API.getCustomers()
        ]);
        this.currentUser = employees.find((employee) => employee.id === preferredUserId) || employees[0] || null;
        this.vendors = vendors;
        // Load approvals up front so the Pending Approvals KPI is accurate on the dashboard.
        void this.ensureApprovalsFeed();
        this.setView(getInitialErpView());
      } catch (e) {
        console.error('Failed to load vendors:', e);
      }
      this.loading = false;
    },

    // --- Terminology getters (config-driven, ERP fallbacks) ---
    get t() {
      const t = window.TGK_CONFIG?.terminology || {};
      return {
        portalName: t.portalName || 'Acme Operations',
        advisorRole: t.advisorRole || 'Operations User',
        clientRole: t.clientRole || 'Vendor',
        clientRolePlural: t.clientRolePlural || 'Vendors',
        advisorPortalLabel: t.advisorPortalLabel || 'ERP Portal',
        clientBookLabel: t.clientBookLabel || 'Vendors & Suppliers',
        onboardingAction: t.onboardingAction || 'Add Vendor'
      };
    },

    get kpiDefinitions() {
      const configured = getKpisConfig('advisor');
      return configured.length > 0 ? configured : ERP_DEFAULT_KPIS;
    },

    computeKpi(kpiDef) {
      if (kpiDef.static != null) return kpiDef.static;
      if (kpiDef.key === 'openOrders') return this.openOrdersCount;
      if (kpiDef.key === 'orderValue') return this.totalOrderValue;
      if (kpiDef.key === 'pendingApprovals') return this.openApprovalsCount;
      if (kpiDef.aggregate === 'countWhere') {
        return this.vendors.filter((v) => normalizeStatusValue(v.metadata?.status) === kpiDef.countWhereValue).length;
      }
      if (kpiDef.computeFrom === 'accounts.balance' || kpiDef.computeFrom === 'data.value') {
        return this.vendors.reduce((sum, v) => sum + (v.metadata?.value || 0), 0);
      }
      return 0;
    },

    formatKpi(kpiDef, value) {
      if (kpiDef.format === 'currency') return fmtMoney(value);
      if (kpiDef.format === 'percent') return fmtPct(value);
      return String(value);
    },

    // --- Orders (accounts flattened across vendors) ---
    get orders() {
      return this.vendors.flatMap((vendor) =>
        customerAccounts(vendor).map((acct) => ({
          id: acct.id,
          name: accountName(acct),
          label: accountLabel(acct),
          value: accountValue(acct),
          status: acct.status || vendor.metadata?.status || 'open',
          vendorName: vendor.name,
          vendor
        }))
      );
    },

    get totalOrderValue() {
      return this.orders.reduce((sum, order) => sum + (order.value || 0), 0);
    },

    get openOrdersCount() {
      return this.orders.filter((order) => normalizeStatusValue(order.status) !== 'completed').length;
    },

    get filteredVendors() {
      if (!this.searchQuery.trim()) return this.vendors;
      const q = this.searchQuery.toLowerCase();
      return this.vendors.filter((v) =>
        `${v.name} ${v.email} ${v.company || ''}`.toLowerCase().includes(q)
      );
    },

    setView(nextView) {
      const resolvedView = this.setPortalView(nextView);
      if (resolvedView === 'invoices') {
        void this.ensureInvoiceFeed();
        void this.ensureApprovalsFeed();
      }
      if (resolvedView === 'monitor') {
        this.ensureMonitorAlerts(this.vendors);
      }
    },

    // --- Invoices (transactions) ---
    async ensureInvoiceFeed(force = false) {
      if (this.invoicesLoading || (this.invoicesLoaded && !force)) return;
      this.invoicesLoading = true;
      try {
        const transactions = await TGK_API.getTransactions();
        this.invoices = transactions.filter(isEnvelopeTransaction);
        this.invoicesLoaded = true;
      } catch (e) {
        console.error('Failed to load invoices:', e);
      } finally {
        this.invoicesLoading = false;
      }
    },

    get filteredInvoices() {
      const q = this.invoiceSearchQuery.trim().toLowerCase();
      const list = [...this.invoices].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      if (!q) return list;
      return list.filter((inv) =>
        [inv.name, inv.id, inv.status].some((x) => String(x || '').toLowerCase().includes(q))
      );
    },

    // --- Approvals (tasks) ---
    async ensureApprovalsFeed(force = false) {
      if (this.approvalsLoading || (this.approvalsLoaded && !force)) return;
      this.approvalsLoading = true;
      try {
        this.approvals = await TGK_API.getTasks();
        this.approvalsLoaded = true;
      } catch (e) {
        console.error('Failed to load approvals:', e);
      } finally {
        this.approvalsLoading = false;
      }
    },

    get openApprovals() {
      return this.approvals.filter((a) => normalizeStatusValue(a.status) !== 'completed');
    },

    get openApprovalsCount() {
      return this.openApprovals.length;
    },

    async approveTask(task) {
      try {
        await TGK_API.updateTask(task.id, { status: 'completed' });
        const idx = this.approvals.findIndex((a) => a.id === task.id);
        if (idx !== -1) {
          this.approvals[idx] = { ...this.approvals[idx], status: 'completed' };
        }
      } catch (e) {
        console.error('Failed to approve task:', e);
      }
    },

    // --- Vendor detail ---
    async viewVendor(vendor) {
      TGK_API.setPreferredCustomerId(vendor?.id);
      this.selectedVendor = vendor;
      try {
        const detail = await TGK_API.getCustomer(vendor.id, { includeTasks: false });
        this.selectedVendor = detail;
        TGK_API.setPreferredCustomerId(detail.id);
      } catch (e) {
        console.error('Failed to load vendor detail:', e);
      }
      this.setView('vendorDetail');
    },

    goBack() {
      this.setView('vendors');
      this.selectedVendor = null;
    },

    // --- Send for signature (Docusign IAM) ---
    erpSendTitle() {
      return this.sendKind === 'vendorAgreement' ? 'New Vendor Agreement' : 'Send Invoice';
    },

    sendWorkflowId() {
      const workflows = window.TGK_CONFIG?.workflows || {};
      const id = this.sendKind === 'vendorAgreement' ? workflows.maintenanceId : workflows.accountOpeningId;
      return String(id || '').trim();
    },

    openErpSend(kind) {
      this.sendKind = kind || 'invoice';
      this.showSend = true;
      this.sendInstanceUrl = '';
      this.sendError = null;
      void this.loadSendWorkflow();
    },

    closeErpSend() {
      this.showSend = false;
      this.sendKind = null;
      this.sendInstanceUrl = '';
      this.sendError = null;
      this.erpSendLoading = false;
      this.stopWorkflowLoading();
    },

    async loadSendWorkflow() {
      this.erpSendLoading = true;
      this.sendError = null;
      this.sendInstanceUrl = '';
      this.startWorkflowLoading();
      try {
        const workflowId = this.sendWorkflowId();
        if (!workflowId) {
          throw new Error('No workflow is configured for this action.');
        }
        const result = await TGK_API.triggerMaestroWorkflow(workflowId, {
          instance_name: `${getTerminology('portalName', 'Acme Operations')} ${this.erpSendTitle()} ${new Date().toISOString()}`,
          trigger_inputs: {
            appSlug: window.TGK_CONFIG?.appSlug
          }
        });
        if (!result?.instance_url) {
          throw new Error('Docusign IAM did not return a launch URL.');
        }
        this.sendInstanceUrl = result.instance_url;
      } catch (e) {
        console.error('Failed to load send workflow:', e);
        this.sendError = e.message || 'Failed to launch the workflow.';
      } finally {
        this.erpSendLoading = false;
        this.stopWorkflowLoading();
      }
    }
  };
}
