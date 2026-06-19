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
  return String(view || 'home').trim() || 'home';
}

function erpApp() {
  const preferredUserId = String(window.TGK_CONFIG?.advisorId || '').trim();

  return {
    ...createPortalChromeState({
      currentKey: 'view',
      defaultView: 'home',
      coreViews: ['home', 'orders', 'vendors', 'invoices', 'vendorDetail', 'monitor', 'orderDetail', 'grossToNet', 'deals', 'contracts', 'contractDetail']
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

    view: 'home',
    currentUser: null,
    vendors: [],
    selectedVendor: null,
    selectedOrder: null,
    searchQuery: '',
    loading: true,

    // P2P closed loop
    selectedContract: null,
    contractAgreement: null,   // matched Navigator agreement for the selected contract
    contractAgreementLoading: false,
    syncedContracts: [],       // contracts pulled live from Agreement Manager
    syncing: false,
    syncError: null,
    syncMessage: '',
    reqRuntimePOs: {},         // contractId -> [generated PO names] (in-memory, resets on reload)
    reqSpendDelta: {},         // contractId -> added spend (in-memory)
    req: { open: false, contractId: null, lines: [], submitted: false, poNumber: '', seq: 0 },

    // Navigator agreements for the selected vendor
    navAgreements: [],
    navLoading: false,
    navError: null,

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

    // Integration inspector (live Docusign API activity drawer)
    apiDrawerOpen: false,
    apiLog: [],
    apiExpanded: {},

    // Supplier intake — direct-launch, prefilled Docusign Web Form (Block 2 Scenario C)
    showIntake: false,
    intakePrefill: {},
    intakeEmbedding: false,
    intakeError: null,
    intakeMissing: false,
    _intakeInstance: null,

    // Sticky footer status bar
    lastSavedAt: '—',
    footerEnvLabel: (window.TGK_CONFIG?.environmentLabel) || 'Demo environment · v2026.6',
    recordSaveTime() {
      this.lastSavedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    },

    async init() {
      this.initializePortalChrome();
      this.initApiInspector();
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
      // Stamp the initial load as the baseline "saved" moment so the footer
      // always shows a real time; write actions update it from here.
      this.recordSaveTime();
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

    // --- Launchpad (home) ---
    get launchpadGroups() {
      return window.ERP_MOCK?.launchpadGroups || [];
    },

    // --- Order object page (drill-down from an Orders row) ---
    viewOrder(order) {
      this.selectedOrder = order;
      this.setView('orderDetail');
    },

    backToOrders() {
      this.setView('orders');
      this.selectedOrder = null;
    },

    get orderFacets() {
      return window.ERP_MOCK?.orderFacets || {};
    },

    // order.name is the PO display name, e.g. "PO-10482".
    get selectedOrderPo() {
      return String(this.selectedOrder?.name || '').trim();
    },

    get selectedOrderLineItems() {
      return window.ERP_MOCK?.orderLineItemsByPo?.[this.selectedOrderPo] || [];
    },

    get selectedOrderLinkedDocs() {
      return window.ERP_MOCK?.orderLinkedDocsByPo?.[this.selectedOrderPo] || [];
    },

    lineNetAmount(li) {
      return (Number(li?.qty) || 0) * (Number(li?.unitPrice) || 0);
    },

    get selectedOrderNet() {
      return this.selectedOrderLineItems.reduce((sum, li) => sum + this.lineNetAmount(li), 0);
    },

    // --- Gross-to-Net bridge ---
    get grossToNetRows() {
      const steps = window.ERP_MOCK?.grossToNet?.steps || [];
      const gross = steps.find((s) => s.kind === 'base')?.amount || 1;
      let running = 0;
      return steps.map((s) => {
        if (s.kind === 'deduction') running += s.amount; // deduction amounts are negative
        else running = s.amount; // base / net are absolute running balances
        return { ...s, running, pct: Math.max(0, (running / gross) * 100) };
      });
    },

    get grossToNetPeriod() {
      return window.ERP_MOCK?.grossToNet?.period || '';
    },

    get grossToNetGross() {
      return window.ERP_MOCK?.grossToNet?.steps?.find((s) => s.kind === 'base')?.amount || 0;
    },

    get grossToNetNet() {
      return window.ERP_MOCK?.grossToNet?.steps?.find((s) => s.kind === 'net')?.amount || 0;
    },

    get grossToNetPct() {
      const gross = this.grossToNetGross;
      return gross ? this.grossToNetNet / gross : 0;
    },

    // --- Deals & Rebates ---
    get deals() {
      return window.ERP_MOCK?.deals || [];
    },

    get rebatePrograms() {
      return window.ERP_MOCK?.rebatePrograms || [];
    },

    dealNetUnit(li) {
      return (Number(li?.list) || 0) * (1 - (Number(li?.discountPct) || 0) / 100);
    },

    rebateAttainment(program) {
      return program?.targetVol ? program.actualVol / program.targetVol : 0;
    },

    rebateOutstanding(program) {
      return (Number(program?.accrued) || 0) - (Number(program?.paid) || 0);
    },

    // Plain percentage (no leading sign) for ratios like GTN % and attainment.
    fmtRatioPct(ratio) {
      const pct = (Number(ratio) || 0) * 100;
      return pct.toFixed(1) + '%';
    },

    // ===== P2P closed loop (Block 5 / Flow 2) =====
    get p2pConfig() {
      return window.ERP_MOCK?.p2pConfig || { priceTolerancePct: 5, priceHardCeilingPct: 15, spendAlertPct: 80, currency: 'USD' };
    },

    get contracts() {
      return [...(window.ERP_MOCK?.contracts || []), ...this.syncedContracts];
    },

    // Action: pull executed agreements from Docusign Agreement Manager and add any
    // not already tracked as contract records (demonstrates data arriving from DS).
    async syncContractsFromDocusign() {
      this.syncing = true;
      this.syncError = null;
      this.syncMessage = '';
      const TYPE_LABELS = { Msa: 'MSA', ServicesAgreement: 'Services Agreement', Subscription: 'Subscription', License: 'License Agreement' };
      try {
        const agreements = await TGK_API.getNavigatorAgreements({ limit: 100 });
        const existing = this.contracts;
        const seenTitles = new Set(existing.map((c) => String(c.navigatorTitle || '').toLowerCase()));
        const seenSuppliers = new Set(existing.map((c) => String(c.supplier || '').toLowerCase()));
        const bySupplier = {};
        for (const a of agreements) {
          const label = TYPE_LABELS[a.type];
          if (!label) continue; // only contract-grade types
          const supplier = (a.parties || []).find((p) => p && !/fontara/i.test(p));
          if (!supplier) continue;
          const key = supplier.toLowerCase();
          if (seenSuppliers.has(key) || seenTitles.has(String(a.title || '').toLowerCase())) continue;
          // One row per supplier; prefer an MSA over other contract types.
          if (!bySupplier[key] || (a.type === 'Msa' && bySupplier[key].agreement.type !== 'Msa')) {
            bySupplier[key] = { agreement: a, supplier };
          }
        }
        const added = Object.values(bySupplier).map(({ agreement, supplier }) => ({
          id: 'CT-DS-' + String(agreement.id || '').slice(-5).toUpperCase(),
          name: `${supplier} — ${TYPE_LABELS[agreement.type]}`,
          supplier, supplierId: '',
          navigatorParty: supplier,
          navigatorTitle: agreement.title,
          type: TYPE_LABELS[agreement.type],
          owner: 'Unassigned',
          paymentTerms: '—',
          effectiveDate: (agreement.effectiveDate || '').slice(0, 10) || null,
          expiryDate: (agreement.expirationDate || '').slice(0, 10) || null,
          committedValue: Number(agreement.value) || 0,
          spendToDate: 0,
          status: 'active',
          commodityCodes: [],
          pricing: [],   // no price book yet — entitlement stays gated until terms are modeled
          linkedPOs: [],
          _synced: true
        }));
        this.syncedContracts = [...this.syncedContracts, ...added];
        this.syncMessage = added.length
          ? `Synced ${added.length} new contract${added.length === 1 ? '' : 's'} from Agreement Manager`
          : 'No new contracts — already up to date';
        this.recordSaveTime();
      } catch (e) {
        console.error('Sync from Agreement Manager failed:', e);
        this.syncError = e?.message || 'Sync failed';
      } finally {
        this.syncing = false;
      }
    },

    contractById(id) {
      return this.contracts.find((c) => c.id === id) || null;
    },

    // Effective spend = baseline + in-memory requisitions submitted this session.
    contractSpend(c) {
      return (Number(c?.spendToDate) || 0) + (Number(this.reqSpendDelta[c?.id]) || 0);
    },
    contractSpendPct(c) {
      const committed = Number(c?.committedValue) || 0;
      return committed ? this.contractSpend(c) / committed : 0;
    },
    contractSpendRemaining(c) {
      return (Number(c?.committedValue) || 0) - this.contractSpend(c);
    },
    contractSpendTone(c) {
      return this.contractSpendPct(c) * 100 >= this.p2pConfig.spendAlertPct ? 'over' : 'ok';
    },

    contractRenewsInDays(c) {
      if (!c?.expiryDate) return null;
      const exp = new Date(c.expiryDate + 'T00:00:00');
      if (Number.isNaN(exp.getTime())) return null;
      return Math.round((exp.getTime() - Date.now()) / 864e5);
    },
    contractRenewalDue(c) {
      const d = this.contractRenewsInDays(c);
      return d !== null && d <= 60;
    },
    contractRenewsLabel(c) {
      const d = this.contractRenewsInDays(c);
      if (d === null) return 'No fixed term';
      if (d < 0) return `Overdue ${Math.abs(d)}d`;
      return `${d}d`;
    },

    contractLinkedPOs(c) {
      const runtime = this.reqRuntimePOs[c?.id] || [];
      return [
        ...(c?.linkedPOs || []).map((name) => ({ name, runtime: false })),
        ...runtime.map((name) => ({ name, runtime: true }))
      ];
    },
    openLinkedPo(poName) {
      const order = this.orders.find((o) => o.name === poName);
      if (order) this.viewOrder(order);
    },

    viewContract(contract) {
      this.selectedContract = contract;
      this.setView('contractDetail');
      void this.loadContractAgreement(contract);
    },
    backToContracts() {
      this.setView('contracts');
      this.selectedContract = null;
      this.contractAgreement = null;
    },

    // Tie the governing contract to a real Navigator agreement for authenticity.
    async loadContractAgreement(contract) {
      this.contractAgreement = null;
      const party = String(contract?.navigatorParty || contract?.supplier || '').trim();
      const wanted = String(contract?.navigatorTitle || '').trim().toLowerCase();
      if (!party) return;
      this.contractAgreementLoading = true;
      try {
        const agreements = await TGK_API.getNavigatorAgreements({ party, limit: 50 });
        // Prefer an exact file-name match; otherwise fall back to the first hit for the party.
        this.contractAgreement =
          (wanted && agreements.find((a) => String(a.title || '').trim().toLowerCase() === wanted)) ||
          agreements[0] || null;
      } catch (e) {
        console.error('Failed to match Navigator agreement:', e);
      } finally {
        this.contractAgreementLoading = false;
      }
    },
    // Deep-link into the real Docusign Agreement Manager (formerly Navigator) in a new tab.
    agreementManagerUrl(agreement) {
      const id = String(agreement?.id || '').trim();
      if (!id) return '';
      const base = String(window.TGK_CONFIG?.docusignAgreementManagerUrl || 'https://apps-d.docusign.com').replace(/\/+$/, '');
      return `${base}/send/agreement-manager/agreements/${encodeURIComponent(id)}`;
    },
    openContractAgreementDoc() {
      const url = this.agreementManagerUrl(this.contractAgreement);
      if (!url) return;
      window.open(url, '_blank', 'noopener');
    },

    // ---- Requisition flow (in-memory; resets on reload) ----
    get reqContract() {
      return this.contractById(this.req.contractId);
    },
    reqMaterialOptions(contract) {
      const priced = (contract?.pricing || []).map((p) => ({ ...p, offContract: false }));
      const off = (window.ERP_MOCK?.offContractSuppliers || [])[0];
      priced.push({
        material: off ? off.commodity : 'RAW-CERAMIC',
        description: 'Ceramic substrate — no governing contract',
        uom: 'EA', contractedRate: null, offContract: true
      });
      return priced;
    },
    openRequisition(contract) {
      const first = (contract?.pricing || [])[0];
      this.req = {
        open: true,
        contractId: contract.id,
        submitted: false,
        poNumber: '',
        seq: this.req.seq || 0,
        lines: first
          ? [{ material: first.material, qty: 100, unitPrice: first.contractedRate }]
          : []
      };
    },
    closeRequisition() {
      this.req = { open: false, contractId: null, lines: [], submitted: false, poNumber: '', seq: this.req.seq || 0 };
    },
    addReqLine() {
      const c = this.reqContract;
      const first = (c?.pricing || [])[0];
      this.req.lines.push(first
        ? { material: first.material, qty: 100, unitPrice: first.contractedRate }
        : { material: '', qty: 1, unitPrice: 0 });
    },
    removeReqLine(idx) {
      this.req.lines.splice(idx, 1);
    },
    reqLineContractRate(line) {
      const c = this.reqContract;
      const match = (c?.pricing || []).find((p) => p.material === line.material);
      return match ? Number(match.contractedRate) : null;
    },
    // Entitlement (P2P-03) + contracted-price enforcement (P2P-04).
    reqLineState(line) {
      const rate = this.reqLineContractRate(line);
      if (rate === null) {
        return { status: 'block', reason: 'No active contract for this commodity', variancePct: null };
      }
      const price = Number(line.unitPrice) || 0;
      const variancePct = rate ? ((price - rate) / rate) * 100 : 0;
      const cfg = this.p2pConfig;
      if (variancePct <= cfg.priceTolerancePct) return { status: 'ok', reason: 'Within contracted rate', variancePct };
      if (variancePct <= cfg.priceHardCeilingPct) return { status: 'flag', reason: 'Above contracted rate', variancePct };
      return { status: 'block', reason: 'Exceeds price ceiling', variancePct };
    },
    reqLineAmount(line) {
      return (Number(line?.qty) || 0) * (Number(line?.unitPrice) || 0);
    },
    get reqTotal() {
      return this.req.lines.reduce((sum, l) => sum + this.reqLineAmount(l), 0);
    },
    get reqEntitled() {
      return this.req.lines.length > 0 && this.req.lines.every((l) => this.reqLineContractRate(l) !== null);
    },
    get reqBlocked() {
      return this.req.lines.length === 0 || this.req.lines.some((l) => this.reqLineState(l).status === 'block');
    },
    get reqHasFlags() {
      return this.req.lines.some((l) => this.reqLineState(l).status === 'flag');
    },
    submitRequisition() {
      if (this.reqBlocked) return;
      const c = this.reqContract;
      if (!c) return;
      this.req.seq += 1;
      const poNumber = 'PO-' + (10600 + this.req.seq);
      this.reqRuntimePOs[c.id] = [...(this.reqRuntimePOs[c.id] || []), poNumber];
      this.reqSpendDelta[c.id] = (this.reqSpendDelta[c.id] || 0) + this.reqTotal;
      this.req.submitted = true;
      this.req.poNumber = poNumber;
      this.applyP2pAlerts();
      this.recordSaveTime();
    },

    // ---- P2P alerts surfaced in the shared Monitor view ----
    get p2pAlerts() {
      const cfg = this.p2pConfig;
      const out = [];
      const stamp = new Date().toISOString();
      for (const c of this.contracts) {
        const pct = this.contractSpendPct(c) * 100;
        if (pct >= cfg.spendAlertPct) {
          out.push({
            id: 'p2p-spend-' + c.id,
            severity: 'high',
            title: `Spend at ${pct.toFixed(0)}% of committed value`,
            description: `${c.id} — ${c.supplier}: ${fmtMoney(this.contractSpend(c))} of ${fmtMoney(c.committedValue)} committed. Routed to contract owner ${c.owner}.`,
            timestamp: stamp
          });
        }
        const days = this.contractRenewsInDays(c);
        if (days !== null && days <= 60) {
          const overdue = days < 0;
          out.push({
            id: 'p2p-renew-' + c.id,
            severity: overdue ? 'high' : 'medium',
            title: overdue ? `Renewal overdue by ${Math.abs(days)} days` : `Contract renews in ${days} days`,
            description: `${c.id} — ${c.supplier} ${overdue ? 'expired' : 'expires'} ${c.expiryDate}. Renewal obligation routed to contract owner ${c.owner}.`,
            timestamp: stamp
          });
        }
      }
      return out;
    },
    applyP2pAlerts() {
      const base = (this.monitorAlerts || []).filter((a) => !String(a.id || '').startsWith('p2p-'));
      this.monitorAlerts = [...this.p2pAlerts, ...base];
    },

    // ===== Integration inspector — live Docusign API activity =====
    initApiInspector() {
      this.apiLog = (window.__TGK_DS_LOG || []).slice();
      window.addEventListener('tgk:ds-api', () => {
        // window.__TGK_DS_LOG entries are mutated in place; re-slice for Alpine reactivity.
        this.apiLog = (window.__TGK_DS_LOG || []).slice();
      });
    },
    toggleApiDrawer() {
      this.apiDrawerOpen = !this.apiDrawerOpen;
    },
    clearApiInspector() {
      if (window.__TGK_DS_LOG) window.__TGK_DS_LOG.length = 0;
      this.apiLog = [];
      this.apiExpanded = {};
    },
    toggleApiEntry(id) {
      this.apiExpanded[id] = !this.apiExpanded[id];
    },
    get apiPendingCount() {
      return this.apiLog.filter((e) => e.pending).length;
    },

    // ===== Supplier Intake — launch the "Supplier Intake" Web Form, prefilled =====
    openSupplierIntake(prefill = {}) {
      this.intakePrefill = prefill || {};
      this.intakeError = null;
      this.intakeMissing = false;
      this.showIntake = true;
    },
    closeSupplierIntake() {
      this._teardownIntake();
      this.showIntake = false;
      this.intakePrefill = {};
      this.intakeError = null;
      this.intakeMissing = false;
    },
    _teardownIntake() {
      if (this._intakeInstance && typeof this._intakeInstance.destroy === 'function') {
        try { this._intakeInstance.destroy(); } catch (e) { /* ignore */ }
      }
      this._intakeInstance = null;
    },

    // Map an originating record to the form's prefill values. Resolves each field's
    // real componentName by matching its label (typo-tolerant), and formats per type
    // (Currency must be { amount, currency }; Select must use the option's API value).
    buildIntakeFormValues(prefill = {}, fields = []) {
      const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const find = (...kw) => fields.find((f) => {
        const l = norm(f.label);
        return kw.every((k) => l.includes(norm(k)));
      });
      const optionValue = (field, val) => {
        if (!field || !field.options) return val;
        const n = norm(val);
        const opt = field.options.find((o) => norm(o.value) === n || norm(o.label) === n);
        return opt ? opt.value : val;
      };
      const values = {};
      const set = (field, val) => {
        if (!field || val == null || val === '') return;
        if (field.type === 'Currency') {
          values[field.componentName] = { amount: Number(val) || 0, currency: this.p2pConfig?.currency || 'USD' };
        } else if (field.type === 'Select' || field.type === 'RadioGroup') {
          values[field.componentName] = optionValue(field, val);
        } else {
          values[field.componentName] = String(val);
        }
      };
      if (prefill.supplier) set(find('supplier'), prefill.supplier);
      if (prefill.email) set(find('email'), prefill.email);
      if (prefill.signerName) set(find('signer', 'name'), prefill.signerName);
      if (prefill.commodity) set(find('commodity'), prefill.commodity);
      if (prefill.agreementType) set(find('agreement', 'type'), prefill.agreementType);
      if (prefill.value != null && prefill.value !== '') {
        set(find('value') || fields.find((f) => f.type === 'Currency'), prefill.value);
      }
      return values;
    },

    // Find the "Supplier Intake" form, create a prefilled instance, embed it (no picker).
    async embedSupplierIntake() {
      this.intakeEmbedding = true;
      this.intakeError = null;
      this.intakeMissing = false;
      this._teardownIntake();
      const mountEl = this.$refs.intakeMount;
      if (mountEl) mountEl.innerHTML = '';
      try {
        const forms = await TGK_API.getWebForms();
        const form = forms.find((f) => String(f.name || '').trim().toLowerCase() === 'supplier intake');
        if (!form) {
          this.intakeMissing = true;
          return;
        }
        const clientId = TGK_API.docusignClientId;
        if (!clientId) throw new Error('Missing Docusign client ID (config.docusignClientId).');

        // Resolve the form's real field names so prefill keys bind correctly.
        const fields = await TGK_API.getWebFormFields(form.id);
        const formValues = this.buildIntakeFormValues(this.intakePrefill, fields);
        const [instance, ds] = await Promise.all([
          TGK_API.createWebFormInstance(form.id, '', formValues),
          loadDocusignWebFormsSdk()
        ]);
        if (!instance?.formUrl || !instance?.instanceToken) {
          throw new Error('Web form instance did not return an embeddable URL/token.');
        }
        const docusign = await ds.loadDocuSign(clientId);
        this._intakeInstance = docusign.webforms({ url: instance.formUrl, instanceToken: instance.instanceToken });
        this._intakeInstance.mount(this.$refs.intakeMount);
      } catch (e) {
        console.error('Supplier Intake embed failed:', e);
        this.intakeError = e?.message || 'Could not embed the Supplier Intake form.';
      } finally {
        this.intakeEmbedding = false;
      }
    },

    // Contracted suppliers (from the P2P contracts) rendered as vendor rows so
    // they appear in the Vendors list alongside the seeded vendor master.
    get contractVendors() {
      return this.contracts.map((c) => ({
        id: 'contract:' + c.id,
        name: c.supplier,
        company: c.type,
        email: '',
        phone: '',
        metadata: { status: c.status, value: c.committedValue },
        accounts: [],
        _contractId: c.id
      }));
    },

    get allVendors() {
      // De-dupe by name so a contracted supplier that also exists in the seed
      // vendor master isn't listed twice (contract row wins).
      const seen = new Set(this.contractVendors.map((v) => v.name.toLowerCase()));
      const seed = this.vendors.filter((v) => !seen.has(String(v.name || '').toLowerCase()));
      return [...this.contractVendors, ...seed];
    },

    get filteredVendors() {
      if (!this.searchQuery.trim()) return this.allVendors;
      const q = this.searchQuery.toLowerCase();
      return this.allVendors.filter((v) =>
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
        this.applyP2pAlerts();
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
        this.recordSaveTime();
      } catch (e) {
        console.error('Failed to approve task:', e);
      }
    },

    // --- Vendor detail ---
    async viewVendor(vendor) {
      // Contract-backed vendor rows have no backend customer record — route to
      // the governing contract (its richer system-of-record) instead.
      if (vendor?._contractId) {
        const contract = this.contractById(vendor._contractId);
        if (contract) { this.viewContract(contract); return; }
      }
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
      // Vendor name is the company — query Navigator for matching agreements.
      void this.loadNavigatorAgreements(this.selectedVendor?.name);
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
