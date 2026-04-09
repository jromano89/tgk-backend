// Default instance configurations that are seeded on first run.

const WEALTH_CONFIG = {
  metadata: {
    name: 'TGK Wealth',
    vertical: 'wealth',
    description: 'Financial services wealth management demo portal',
    presetKey: 'account-opening'
  },
  branding: {
    color: '#3b5bdb',
    logo: null
  },
  terminology: {
    portalName: 'TGK Wealth',
    advisorRole: 'Advisor',
    advisorRolePlural: 'Advisors',
    clientRole: 'Investor',
    clientRolePlural: 'Investors',
    advisorPortalLabel: 'Advisor Portal',
    clientPortalLabel: 'Investor Portal',
    clientBookLabel: 'Investor Book',
    onboardingAction: 'Open Account',
    onboardingWorkflowLabel: 'Account Opening',
    maintenanceAction: 'Transfer Assets',
    maintenanceWorkflowLabel: 'Asset Transfer'
  },
  docusign: {
    userId: '26016859-d095-4c40-8892-0de438e2a226',
    accountId: '18ecd535-9f12-4c7f-8cf3-caf870d86437',
    scopes: 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read',
    baseUrl: 'https://api-d.docusign.com'
  },
  workflows: {
    onboardingId: 'e26e565e-fb6a-433b-b004-bd2083c8963b',
    maintenanceId: 'b59acbee-8052-403a-a752-c04287ad6ee1'
  },
  kpis: {
    advisor: [
      { key: 'totalAum', label: 'Total AUM', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+2.9% this quarter' },
      { key: 'aggregateNetWorth', label: 'Aggregate Net Worth', format: 'currency', computeFrom: 'data.netWorth', aggregate: 'sum', trend: '+2 this week' },
      { key: 'pendingReviews', label: 'Pending Reviews', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: '+12 this month' },
      { key: 'complianceAlerts', label: 'Compliance Alerts', format: 'number', static: 3, trend: '-72% vs manual' }
    ],
    client: [
      { key: 'portfolioValue', label: 'Portfolio Value', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
      { key: 'ytdReturn', label: 'YTD Return', format: 'percent', computeFrom: 'data.ytdReturn', aggregate: 'first' }
    ]
  },
  agreements: {
    taxonomy: [
      { type: 'account-opening', label: 'Account Opening', icon: 'folder-plus' },
      { type: 'asset-transfer', label: 'Asset Transfer', icon: 'arrow-right-left' },
      { type: 'ria-agreement', label: 'RIA Agreement', icon: 'file-text' },
      { type: 'trust-document', label: 'Trust Document', icon: 'shield' },
      { type: 'beneficiary-update', label: 'Beneficiary Update', icon: 'users' }
    ],
    summaryMetrics: { totalCount: 128, completionRate: 87 },
    turnaroundHours: 7.1,
    volumeSeries: [5, 6, 4, 8, 9, 11, 8, 12, 14, 15, 16, 20]
  },
  advisorId: '4871abfa-8868-4501-b068-5936c6363e6b',
  defaultMode: 'advanced',
  iamProducts: [
    { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
    { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
    { key: 'monitor', label: 'Monitor', icon: 'monitor' },
    { key: 'notary', label: 'Notary', icon: 'notary' },
    { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
    { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
  ],
  defaultIamProducts: ['id-verification', 'web-forms', 'doc-gen'],
  maestro: {
    publisherName: 'TGK Wealth',
    publisherEmail: 'demo@tgkwealth.com',
    publisherPhone: '800-555-0100'
  }
};

const HEALTHCARE_CONFIG = {
  metadata: {
    name: 'MedFlow Health',
    vertical: 'healthcare',
    description: 'Healthcare provider management demo portal',
    presetKey: 'patient-intake'
  },
  branding: {
    color: '#0d9488',
    logo: null
  },
  terminology: {
    portalName: 'MedFlow Health',
    advisorRole: 'Care Coordinator',
    advisorRolePlural: 'Care Coordinators',
    clientRole: 'Patient',
    clientRolePlural: 'Patients',
    advisorPortalLabel: 'Coordinator Portal',
    clientPortalLabel: 'Patient Portal',
    clientBookLabel: 'Patient Roster',
    onboardingAction: 'New Patient Intake',
    onboardingWorkflowLabel: 'Patient Intake',
    maintenanceAction: 'Request Records Transfer',
    maintenanceWorkflowLabel: 'Records Transfer'
  },
  docusign: {
    userId: '',
    accountId: '',
    scopes: 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read',
    baseUrl: 'https://api-d.docusign.com'
  },
  workflows: {
    onboardingId: '',
    maintenanceId: ''
  },
  kpis: {
    advisor: [
      { key: 'totalPatients', label: 'Active Patients', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+8 this month' },
      { key: 'claimVolume', label: 'Claim Volume', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+5.1% this quarter' },
      { key: 'pendingIntakes', label: 'Pending Intakes', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+3 this week' },
      { key: 'complianceAlerts', label: 'HIPAA Alerts', format: 'number', static: 1, trend: '-45% vs last month' }
    ],
    client: [
      { key: 'outstandingBalance', label: 'Outstanding Balance', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
      { key: 'nextAppointment', label: 'Next Appointment', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' }
    ]
  },
  agreements: {
    taxonomy: [
      { type: 'patient-intake', label: 'Patient Intake', icon: 'folder-plus' },
      { type: 'records-transfer', label: 'Records Transfer', icon: 'arrow-right-left' },
      { type: 'hipaa-consent', label: 'HIPAA Consent', icon: 'shield' },
      { type: 'treatment-plan', label: 'Treatment Plan', icon: 'file-text' },
      { type: 'insurance-auth', label: 'Insurance Authorization', icon: 'users' }
    ],
    summaryMetrics: { totalCount: 94, completionRate: 92 },
    turnaroundHours: 4.2,
    volumeSeries: [8, 7, 9, 11, 10, 13, 12, 14, 16, 15, 18, 21]
  },
  advisorId: '',
  defaultMode: 'advanced',
  iamProducts: [
    { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
    { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
    { key: 'monitor', label: 'Monitor', icon: 'monitor' },
    { key: 'notary', label: 'Notary', icon: 'notary' },
    { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
    { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
  ],
  defaultIamProducts: ['web-forms', 'id-verification', 'doc-gen'],
  maestro: {
    publisherName: 'MedFlow Health',
    publisherEmail: 'demo@medflowhealth.com',
    publisherPhone: '800-555-0200'
  }
};

const DEFAULT_INSTANCES = {
  'tgk-wealth': WEALTH_CONFIG,
  'medflow-health': HEALTHCARE_CONFIG
};

module.exports = { DEFAULT_INSTANCES, WEALTH_CONFIG, HEALTHCARE_CONFIG };
