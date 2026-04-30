function investorApp() {
  const preferredAdvisorId = String(window.TGK_CONFIG?.advisorId || '').trim();

  return {
    ...createPortalChromeState({
      currentKey: 'tab',
      defaultView: 'overview',
      coreViews: ['overview', 'documents', 'tasks']
    }),
    ...createWorkflowLoadingState({
      loadingKey: 'taskWorkflowLoading',
      loadingIndexKey: 'taskWorkflowLoadingIndex',
      loadingTimerKey: 'taskWorkflowLoadingTimer',
      stepsKey: 'taskWorkflowLoadingSteps',
      steps: [
        'Connecting to Docusign IAM',
        'Preparing asset transfer',
        'Launching the embedded experience'
      ]
    }),
    ...createEnvelopeModalHelpers(),
    tab: 'overview',
    advisors: [],
    assignedAdvisor: null,
    customers: [],
    selectedClientId: null,
    selectedClient: null,
    accounts: [],
    envelopes: [],
    loading: true,
    tasks: [],
    clientWorkspaces: [],
    workspacesLoading: false,
    selectedWorkspaceDetail: null,
    selectedWorkspaceDetailId: null,
    showTaskWorkflow: false,
    taskWorkflowKind: 'asset-transfer',
    taskWorkflowTask: null,
    taskWorkflowInstanceUrl: '',
    taskWorkflowError: null,

    async init() {
      this.initializePortalChrome();
      void TGK_API.prefetchDocusignAccessToken();
      try {
        const [advisors, customers] = await Promise.all([
          TGK_API.getEmployees(),
          TGK_API.getCustomers()
        ]);
        this.advisors = advisors;
        this.assignedAdvisor = this.advisors.find((advisor) => advisor.id === preferredAdvisorId) || this.advisors[0] || null;
        this.customers = this.sortCustomers(customers);
        this.setTab('overview');
        const preferredClientId = TGK_API.getPreferredCustomerId();
        const initialClient = this.customers.find((customer) => customer.id === preferredClientId) || this.customers[0];
        if (initialClient) {
          this.selectedClientId = initialClient.id;
          await this.loadClient();
        }
      } catch (e) {
        console.error('Failed to load:', e);
      }
      this.loading = false;
    },

    isCoreTab(tabName = this.tab) {
      return this.isCorePortalView(tabName);
    },

    sortCustomers(customers) {
      return [...(customers || [])].sort((a, b) => {
        const left = String(a.name || '').trim();
        const right = String(b.name || '').trim();
        return left.localeCompare(right, undefined, { sensitivity: 'base' });
      });
    },

    setTab(nextTab) {
      const resolvedTab = this.setPortalView(nextTab);

      if (resolvedTab === 'monitor') {
        this.ensureMonitorAlerts();
      }
      if (resolvedTab === 'workspaces') {
        void this.loadClientWorkspaces();
      }
    },

    async getWorkspaceDetail(workspaceId) {
      if (this.selectedWorkspaceDetailId === workspaceId) {
        this.selectedWorkspaceDetail = null;
        this.selectedWorkspaceDetailId = null;
        return;
      }
      try {
        const data = await TGK_API.get(`/api/workspace/${workspaceId}`);
        this.selectedWorkspaceDetail = data;
        this.selectedWorkspaceDetailId = workspaceId;
      } catch (e) {
        console.error('Failed to get workspace detail:', e);
      }
    },

    async loadClientWorkspaces() {
      if (!this.selectedClient) return;
      this.workspacesLoading = true;
      try {
        const data = await TGK_API.get('/api/workspace/list');
        const workspaces = data.workspaces || data || [];
        const customerId = this.selectedClient.id || '';
        this.clientWorkspaces = workspaces.filter(w =>
          customerId && (w.name || '').includes(customerId)
        );
      } catch (e) {
        console.error('Failed to load workspaces:', e);
        this.clientWorkspaces = [];
      } finally {
        this.workspacesLoading = false;
      }
    },

    getAssetTransferWorkflowId() {
      return String(window.TGK_CONFIG?.workflows?.assetTransferId || '').trim();
    },

    getAccountMaintenanceWorkflowId() {
      return String(window.TGK_CONFIG?.workflows?.accountMaintenanceId || '').trim();
    },

    async loadClient() {
      if (!this.selectedClientId) return;
      try {
        const detail = await TGK_API.getCustomer(this.selectedClientId);
        this.selectedClient = detail;
        TGK_API.setPreferredCustomerId(detail.id);
        this.accounts = detail.accounts || [];
        this.envelopes = detail.envelopes || [];
        this.tasks = detail.tasks || [];
        this.assignedAdvisor = this.advisors.find((advisor) => advisor.id === detail.employee_id)
          || this.advisors.find((advisor) => advisor.id === preferredAdvisorId)
          || this.advisors[0]
          || null;
      } catch (e) {
        console.error('Failed to load client:', e);
        this.selectedClient = null;
        this.accounts = [];
        this.envelopes = [];
        this.tasks = [];
      }
    },

    async switchClient() {
      await this.loadClient();
    },

    get clientName() {
      return this.selectedClient?.name || '';
    },

    get portfolioDateLabel() {
      return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date());
    },

    get totalPortfolioValue() {
      return this.accounts.reduce((sum, a) => sum + (a.metadata?.value || 0), 0);
    },

    get ytdReturn() {
      const portfolioValue = this.totalPortfolioValue;
      if (this.accounts.length === 0 || portfolioValue === 0) return 0;
      const total = this.accounts.reduce((sum, a) => sum + ((a.metadata?.ytdReturn || 0) * (a.metadata?.value || 0)), 0);
      return total / portfolioValue;
    },

    async dismissTask(id) {
      try {
        const nextTasks = this.tasks.filter((task) => task.id !== id);
        await TGK_API.deleteTask(id);
        this.tasks = nextTasks;
        if (this.selectedClient) {
          this.selectedClient = {
            ...this.selectedClient,
            tasks: nextTasks
          };
        }
      } catch (e) {
        console.error('Failed to dismiss task:', e);
      }
    },

    taskCanLaunchWorkflow(task) {
      return String(task?.data?.workflow || '').trim().toLowerCase() === 'asset-transfer';
    },

    handleTaskClick(task) {
      if (!this.taskCanLaunchWorkflow(task)) {
        return;
      }

      this.openTaskWorkflow(task);
    },

    getTaskWorkflowKind(task = this.taskWorkflowTask) {
      const workflow = String(task?.data?.workflow || this.taskWorkflowKind || 'asset-transfer').trim().toLowerCase();

      if (workflow === 'account-maintenance' || workflow === 'account_maintenance' || workflow === 'maintenance') {
        return 'account-maintenance';
      }

      return 'asset-transfer';
    },

    getTaskWorkflowPresentation(task = this.taskWorkflowTask) {
      const workflowKind = this.getTaskWorkflowKind(task);

      if (workflowKind === 'account-maintenance') {
        return {
          kind: workflowKind,
          workflowId: this.getAccountMaintenanceWorkflowId(),
          loadingTitle: 'Preparing account maintenance',
          loadingCopy: 'Launching the account maintenance workflow for this investor.',
          errorTitle: 'Unable to launch account maintenance',
          frameTitle: 'Docusign IAM Account Maintenance',
          missingWorkflowMessage: 'No account maintenance workflow is configured.',
          launchErrorMessage: 'Failed to launch account maintenance.',
          instanceName: `TGK Wealth Account Maintenance ${this.clientName || ''} ${new Date().toISOString()}`.trim(),
          steps: [
            'Connecting to Docusign IAM',
            'Preparing account maintenance',
            'Launching the embedded experience'
          ]
        };
      }

      return {
        kind: workflowKind,
        workflowId: String(
          task?.data?.workflowId
          || task?.data?.workflow_id
          || this.getAssetTransferWorkflowId()
          || ''
        ).trim(),
        loadingTitle: 'Preparing asset transfer',
        loadingCopy: 'Launching the asset transfer workflow for this investor.',
        errorTitle: 'Unable to launch asset transfer',
        frameTitle: 'Docusign IAM Asset Transfer',
        missingWorkflowMessage: 'No asset transfer workflow is configured.',
        launchErrorMessage: 'Failed to launch asset transfer.',
        instanceName: `TGK Wealth Asset Transfer ${this.clientName || task?.title || ''} ${new Date().toISOString()}`.trim(),
        steps: [
          'Connecting to Docusign IAM',
          'Preparing asset transfer',
          'Launching the embedded experience'
        ]
      };
    },

    syncTaskWorkflowLoadingSteps(task = this.taskWorkflowTask) {
      const presentation = this.getTaskWorkflowPresentation(task);
      this.taskWorkflowLoadingSteps = [...presentation.steps];
    },

    getTaskWorkflowLaunchUrl(task) {
      return String(
        task?.data?.instanceUrl
        || task?.data?.instance_url
        || task?.data?.maestroInstanceUrl
        || ''
      ).trim();
    },

    getTaskWorkflowCustomerId(task) {
      return String(
        task?.customer_id
        || task?.customerId
        || task?.data?.customerId
        || task?.data?.customer_id
        || this.selectedClient?.id
        || this.selectedClientId
        || ''
      ).trim();
    },

    getTaskWorkflowCustomerName(task) {
      return String(
        task?.data?.customerName
        || task?.data?.customer_name
        || this.selectedClient?.name
        || ''
      ).trim();
    },

    getTaskWorkflowCustomerEmail(task) {
      return String(
        task?.data?.customerEmail
        || task?.data?.customer_email
        || this.selectedClient?.email
        || ''
      ).trim();
    },

    getTaskWorkflowTriggerInputs(task) {
      const triggerInputs = task?.data?.triggerInputs || task?.data?.trigger_inputs;
      const payload = triggerInputs && typeof triggerInputs === 'object' && !Array.isArray(triggerInputs)
        ? { ...triggerInputs }
        : {};
      const customerId = this.getTaskWorkflowCustomerId(task);
      const customerName = this.getTaskWorkflowCustomerName(task);
      const customerEmail = this.getTaskWorkflowCustomerEmail(task);

      if (customerId) {
        payload.customerId = customerId;
      }
      if (customerName) {
        payload.customerName = customerName;
      }
      if (customerEmail) {
        payload.customerEmail = customerEmail;
      }

      payload.appSlug = window.TGK_CONFIG?.appSlug;
      delete payload.idv;

      return payload;
    },

    persistTaskWorkflowLaunchUrl(task, instanceUrl) {
      if (!task?.id || !instanceUrl) {
        return;
      }

      void TGK_API.updateTask(task.id, {
        data: {
          instanceUrl
        }
      })
        .then((savedTask) => {
          this.tasks = this.tasks.map((item) => (item.id === savedTask.id ? savedTask : item));

          if (this.selectedClient) {
            this.selectedClient = {
              ...this.selectedClient,
              tasks: (this.selectedClient.tasks || []).map((item) => (item.id === savedTask.id ? savedTask : item))
            };
          }

          if (this.taskWorkflowTask?.id === savedTask.id) {
            this.taskWorkflowTask = savedTask;
          }
        })
        .catch((error) => {
          console.warn('Failed to persist asset transfer launch URL:', error);
        });
    },

    resetTaskWorkflowState() {
      this.showTaskWorkflow = false;
      this.taskWorkflowKind = 'asset-transfer';
      this.taskWorkflowTask = null;
      this.taskWorkflowInstanceUrl = '';
      this.taskWorkflowError = null;
      this.taskWorkflowLoading = false;
      this.syncTaskWorkflowLoadingSteps();
      this.stopWorkflowLoading();
    },

    async openTaskWorkflow(task) {
      this.resetTaskWorkflowState();
      this.showTaskWorkflow = true;
      this.taskWorkflowKind = this.getTaskWorkflowKind(task);
      this.taskWorkflowTask = task || null;
      this.syncTaskWorkflowLoadingSteps(task);
      await this.loadTaskWorkflow(task);
    },

    async openAccountMaintenance() {
      if (!this.selectedClient) {
        return;
      }

      this.resetTaskWorkflowState();
      this.showTaskWorkflow = true;
      this.taskWorkflowKind = 'account-maintenance';
      this.syncTaskWorkflowLoadingSteps();
      await this.loadTaskWorkflow();
    },

    closeTaskWorkflow() {
      this.resetTaskWorkflowState();
    },

    async loadTaskWorkflow(task = this.taskWorkflowTask) {
      const targetTask = task || null;
      const presentation = this.getTaskWorkflowPresentation(targetTask);

      this.taskWorkflowLoading = true;
      this.taskWorkflowError = null;
      this.taskWorkflowInstanceUrl = '';
      this.syncTaskWorkflowLoadingSteps(targetTask);
      this.startWorkflowLoading();

      try {
        const existingInstanceUrl = presentation.kind === 'asset-transfer'
          ? this.getTaskWorkflowLaunchUrl(targetTask)
          : '';
        if (existingInstanceUrl) {
          this.taskWorkflowInstanceUrl = existingInstanceUrl;
          return;
        }

        const workflowId = presentation.workflowId;
        if (!workflowId) {
          throw new Error(presentation.missingWorkflowMessage);
        }

        const result = await TGK_API.triggerMaestroWorkflow(workflowId, {
          instance_name: presentation.instanceName,
          trigger_inputs: this.getTaskWorkflowTriggerInputs(targetTask)
        });

        if (!result?.instance_url) {
          throw new Error('Docusign IAM did not return a launch URL.');
        }

        this.taskWorkflowInstanceUrl = result.instance_url;
        if (presentation.kind === 'asset-transfer') {
          this.persistTaskWorkflowLaunchUrl(targetTask, result.instance_url);
        }
      } catch (e) {
        console.error(`Failed to load ${presentation.kind} workflow:`, e);
        this.taskWorkflowError = e.message || presentation.launchErrorMessage;
      } finally {
        this.taskWorkflowLoading = false;
        this.stopWorkflowLoading();
      }
    },

  };
}
