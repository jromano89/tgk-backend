// Storyline presets — 15 demo storylines across 6 verticals.
// Each preset pre-fills terminology, KPIs, agreements, branding, and highlighted DS products.

const ALL_IAM_PRODUCTS = [
  { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
  { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
  { key: 'monitor', label: 'Monitor', icon: 'monitor' },
  { key: 'notary', label: 'Notary', icon: 'notary' },
  { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
  { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
];

const VERTICALS = [
  { key: 'healthcare', title: 'Healthcare', desc: 'Providers & patients', icon: 'heart-pulse' },
  { key: 'insurance', title: 'Insurance', desc: 'Carriers & policyholders', icon: 'shield-check' },
  { key: 'wealth', title: 'Wealth Management', desc: 'Advisors & investors', icon: 'trending-up' },
  { key: 'public-sector', title: 'Public Sector', desc: 'Agencies & constituents', icon: 'landmark' },
  { key: 'banking', title: 'Banking', desc: 'Lenders & borrowers', icon: 'building-2' },
  { key: 'education', title: 'Education', desc: 'Institutions & students', icon: 'graduation-cap' }
];

const STORYLINE_PRESETS = [
  // ── Healthcare ──────────────────────────────────────────────
  {
    key: 'patient-intake',
    vertical: 'healthcare',
    title: 'Patient Intake',
    description: 'Digitize new-patient onboarding with consent forms, ID capture, and insurance verification.',
    highlightedProducts: ['web-forms', 'id-verification', 'doc-gen'],
    brandColor: '#0d9488',
    portalName: 'MedFlow Health',
    terminology: {
      advisorRole: 'Care Coordinator', advisorRolePlural: 'Care Coordinators',
      clientRole: 'Patient', clientRolePlural: 'Patients',
      advisorPortalLabel: 'Coordinator Portal', clientPortalLabel: 'Patient Portal',
      clientBookLabel: 'Patient Roster',
      onboardingAction: 'New Patient Intake', onboardingWorkflowLabel: 'Patient Intake',
      maintenanceAction: 'Request Records Transfer', maintenanceWorkflowLabel: 'Records Transfer'
    },
    kpis: {
      advisor: [
        { key: 'totalPatients', label: 'Active Patients', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+8 this month' },
        { key: 'intakeVolume', label: 'Intake Volume', format: 'number', computeFrom: 'data.value', aggregate: 'count', trend: '+12% this quarter' },
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
        { type: 'hipaa-consent', label: 'HIPAA Consent', icon: 'shield' },
        { type: 'insurance-auth', label: 'Insurance Authorization', icon: 'users' },
        { type: 'records-transfer', label: 'Records Transfer', icon: 'arrow-right-left' },
        { type: 'treatment-plan', label: 'Treatment Plan', icon: 'file-text' }
      ],
      summaryMetrics: { totalCount: 94, completionRate: 92 },
      turnaroundHours: 4.2,
      volumeSeries: [8, 7, 9, 11, 10, 13, 12, 14, 16, 15, 18, 21]
    }
  },
  {
    key: 'surgical-preauth',
    vertical: 'healthcare',
    title: 'Surgical Pre-Authorization',
    description: 'Streamline surgical approvals with payer pre-auth forms, clinical documentation, and e-signatures.',
    highlightedProducts: ['doc-gen', 'monitor', 'web-forms'],
    brandColor: '#0891b2',
    portalName: 'SurgiAuth Pro',
    terminology: {
      advisorRole: 'Surgical Coordinator', advisorRolePlural: 'Surgical Coordinators',
      clientRole: 'Patient', clientRolePlural: 'Patients',
      advisorPortalLabel: 'Coordinator Portal', clientPortalLabel: 'Patient Portal',
      clientBookLabel: 'Surgery Schedule',
      onboardingAction: 'New Pre-Auth Request', onboardingWorkflowLabel: 'Pre-Authorization',
      maintenanceAction: 'Update Clinical Docs', maintenanceWorkflowLabel: 'Clinical Update'
    },
    kpis: {
      advisor: [
        { key: 'pendingAuths', label: 'Pending Authorizations', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+5 this week' },
        { key: 'approvalRate', label: 'Approval Rate', format: 'percent', static: 94, trend: '+2% this month' },
        { key: 'avgTurnaround', label: 'Avg Turnaround', format: 'text', static: '2.1 days', trend: '-18% vs last quarter' },
        { key: 'denialAlerts', label: 'Denial Alerts', format: 'number', static: 2, trend: '-30% this month' }
      ],
      client: [
        { key: 'surgeryDate', label: 'Surgery Date', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' },
        { key: 'authStatus', label: 'Authorization Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'preauth-request', label: 'Pre-Auth Request', icon: 'folder-plus' },
        { type: 'clinical-summary', label: 'Clinical Summary', icon: 'file-text' },
        { type: 'payer-approval', label: 'Payer Approval', icon: 'shield' },
        { type: 'surgical-consent', label: 'Surgical Consent', icon: 'users' },
        { type: 'anesthesia-consent', label: 'Anesthesia Consent', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 67, completionRate: 89 },
      turnaroundHours: 50.4,
      volumeSeries: [4, 5, 3, 6, 7, 5, 8, 6, 9, 7, 10, 8]
    }
  },
  {
    key: 'prescription-management',
    vertical: 'healthcare',
    title: 'Prescription Management',
    description: 'Manage prescription renewals, prior authorizations, and patient consent with automated workflows.',
    highlightedProducts: ['monitor', 'doc-gen', 'web-forms'],
    brandColor: '#7c3aed',
    portalName: 'RxFlow',
    terminology: {
      advisorRole: 'Pharmacist', advisorRolePlural: 'Pharmacists',
      clientRole: 'Patient', clientRolePlural: 'Patients',
      advisorPortalLabel: 'Pharmacy Portal', clientPortalLabel: 'Patient Portal',
      clientBookLabel: 'Patient Prescriptions',
      onboardingAction: 'New Prescription', onboardingWorkflowLabel: 'Prescription Intake',
      maintenanceAction: 'Renewal Request', maintenanceWorkflowLabel: 'Prescription Renewal'
    },
    kpis: {
      advisor: [
        { key: 'activeRx', label: 'Active Prescriptions', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+15 this month' },
        { key: 'pendingRenewals', label: 'Pending Renewals', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: '+4 this week' },
        { key: 'priorAuths', label: 'Prior Authorizations', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+7 this month' },
        { key: 'expiringAlerts', label: 'Expiring Soon', format: 'number', static: 6, trend: '+2 vs last week' }
      ],
      client: [
        { key: 'activeMeds', label: 'Active Medications', format: 'number', computeFrom: 'data.value', aggregate: 'count' },
        { key: 'nextRefill', label: 'Next Refill', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'new-prescription', label: 'New Prescription', icon: 'folder-plus' },
        { type: 'renewal-auth', label: 'Renewal Authorization', icon: 'arrow-right-left' },
        { type: 'prior-auth', label: 'Prior Authorization', icon: 'shield' },
        { type: 'patient-consent', label: 'Patient Consent', icon: 'users' },
        { type: 'transfer-request', label: 'Pharmacy Transfer', icon: 'file-text' }
      ],
      summaryMetrics: { totalCount: 156, completionRate: 95 },
      turnaroundHours: 6.5,
      volumeSeries: [12, 14, 11, 16, 18, 15, 20, 17, 22, 19, 24, 26]
    }
  },

  // ── Insurance ───────────────────────────────────────────────
  {
    key: 'auto-policy',
    vertical: 'insurance',
    title: 'Auto Policy Issuance',
    description: 'Issue new auto policies with driver verification, coverage selection, and instant binding.',
    highlightedProducts: ['id-verification', 'web-forms', 'doc-gen'],
    brandColor: '#2563eb',
    portalName: 'AutoShield',
    terminology: {
      advisorRole: 'Agent', advisorRolePlural: 'Agents',
      clientRole: 'Policyholder', clientRolePlural: 'Policyholders',
      advisorPortalLabel: 'Agent Portal', clientPortalLabel: 'Policyholder Portal',
      clientBookLabel: 'Policy Book',
      onboardingAction: 'New Policy', onboardingWorkflowLabel: 'Policy Issuance',
      maintenanceAction: 'File Claim', maintenanceWorkflowLabel: 'Claims Processing'
    },
    kpis: {
      advisor: [
        { key: 'activePolicies', label: 'Active Policies', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+12 this month' },
        { key: 'premiumVolume', label: 'Premium Volume', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+8.3% this quarter' },
        { key: 'pendingApps', label: 'Pending Applications', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+6 this week' },
        { key: 'claimAlerts', label: 'Open Claims', format: 'number', static: 4, trend: '-15% vs last month' }
      ],
      client: [
        { key: 'coverageAmount', label: 'Coverage Amount', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'nextRenewal', label: 'Next Renewal', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'policy-application', label: 'Policy Application', icon: 'folder-plus' },
        { type: 'coverage-selection', label: 'Coverage Selection', icon: 'shield' },
        { type: 'driver-verification', label: 'Driver Verification', icon: 'users' },
        { type: 'binding-agreement', label: 'Binding Agreement', icon: 'file-text' },
        { type: 'endorsement', label: 'Policy Endorsement', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 215, completionRate: 91 },
      turnaroundHours: 3.8,
      volumeSeries: [15, 18, 14, 22, 25, 20, 28, 24, 30, 26, 32, 35]
    }
  },
  {
    key: 'homeowner-claim',
    vertical: 'insurance',
    title: 'Homeowner Claim',
    description: 'Process homeowner claims with damage documentation, adjuster assignments, and settlement tracking.',
    highlightedProducts: ['monitor', 'doc-gen', 'workspaces'],
    brandColor: '#dc2626',
    portalName: 'HomeGuard Claims',
    terminology: {
      advisorRole: 'Claims Adjuster', advisorRolePlural: 'Claims Adjusters',
      clientRole: 'Claimant', clientRolePlural: 'Claimants',
      advisorPortalLabel: 'Adjuster Portal', clientPortalLabel: 'Claimant Portal',
      clientBookLabel: 'Claims Book',
      onboardingAction: 'New Claim', onboardingWorkflowLabel: 'Claim Intake',
      maintenanceAction: 'Update Claim', maintenanceWorkflowLabel: 'Claim Update'
    },
    kpis: {
      advisor: [
        { key: 'openClaims', label: 'Open Claims', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+7 this week' },
        { key: 'claimValue', label: 'Total Claim Value', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$142K this month' },
        { key: 'pendingReview', label: 'Pending Review', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: '+3 this week' },
        { key: 'fraudAlerts', label: 'Fraud Alerts', format: 'number', static: 1, trend: '-50% vs last month' }
      ],
      client: [
        { key: 'claimAmount', label: 'Claim Amount', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'claimStatus', label: 'Claim Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'claim-form', label: 'Claim Form', icon: 'folder-plus' },
        { type: 'damage-report', label: 'Damage Report', icon: 'file-text' },
        { type: 'proof-of-loss', label: 'Proof of Loss', icon: 'shield' },
        { type: 'settlement-offer', label: 'Settlement Offer', icon: 'arrow-right-left' },
        { type: 'release-form', label: 'Release Form', icon: 'users' }
      ],
      summaryMetrics: { totalCount: 78, completionRate: 84 },
      turnaroundHours: 72,
      volumeSeries: [6, 8, 5, 10, 12, 9, 14, 11, 15, 13, 16, 18]
    }
  },
  {
    key: 'life-underwriting',
    vertical: 'insurance',
    title: 'Life Underwriting',
    description: 'Automate life insurance underwriting with health questionnaires, risk scoring, and policy generation.',
    highlightedProducts: ['web-forms', 'id-verification', 'doc-gen'],
    brandColor: '#059669',
    portalName: 'LifeSecure',
    terminology: {
      advisorRole: 'Underwriter', advisorRolePlural: 'Underwriters',
      clientRole: 'Applicant', clientRolePlural: 'Applicants',
      advisorPortalLabel: 'Underwriter Portal', clientPortalLabel: 'Applicant Portal',
      clientBookLabel: 'Applicant Book',
      onboardingAction: 'New Application', onboardingWorkflowLabel: 'Application Review',
      maintenanceAction: 'Request Medical Records', maintenanceWorkflowLabel: 'Medical Review'
    },
    kpis: {
      advisor: [
        { key: 'pendingApps', label: 'Pending Applications', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+9 this month' },
        { key: 'coverageIssued', label: 'Coverage Issued', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$2.1M this quarter' },
        { key: 'medicalReviews', label: 'Medical Reviews', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: '+4 this week' },
        { key: 'riskFlags', label: 'Risk Flags', format: 'number', static: 3, trend: '-20% vs last month' }
      ],
      client: [
        { key: 'requestedCoverage', label: 'Requested Coverage', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'appStatus', label: 'Application Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'life-application', label: 'Life Application', icon: 'folder-plus' },
        { type: 'health-questionnaire', label: 'Health Questionnaire', icon: 'file-text' },
        { type: 'medical-auth', label: 'Medical Authorization', icon: 'shield' },
        { type: 'beneficiary-designation', label: 'Beneficiary Designation', icon: 'users' },
        { type: 'policy-delivery', label: 'Policy Delivery', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 142, completionRate: 86 },
      turnaroundHours: 120,
      volumeSeries: [10, 12, 9, 14, 16, 13, 18, 15, 20, 17, 22, 24]
    }
  },

  // ── Wealth ──────────────────────────────────────────────────
  {
    key: 'account-opening',
    vertical: 'wealth',
    title: 'Account Opening',
    description: 'Streamline new account onboarding with KYC checks, suitability reviews, and digital agreements.',
    highlightedProducts: ['id-verification', 'web-forms', 'doc-gen'],
    brandColor: '#3b5bdb',
    portalName: 'TGK Wealth',
    terminology: {
      advisorRole: 'Advisor', advisorRolePlural: 'Advisors',
      clientRole: 'Investor', clientRolePlural: 'Investors',
      advisorPortalLabel: 'Advisor Portal', clientPortalLabel: 'Investor Portal',
      clientBookLabel: 'Investor Book',
      onboardingAction: 'Open Account', onboardingWorkflowLabel: 'Account Opening',
      maintenanceAction: 'Transfer Assets', maintenanceWorkflowLabel: 'Asset Transfer'
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
    }
  },
  {
    key: 'beneficiary-change',
    vertical: 'wealth',
    title: 'Beneficiary Change',
    description: 'Process beneficiary updates across trusts, retirement accounts, and insurance policies.',
    highlightedProducts: ['doc-gen', 'notary', 'monitor'],
    brandColor: '#6366f1',
    portalName: 'TrustPoint',
    terminology: {
      advisorRole: 'Trust Officer', advisorRolePlural: 'Trust Officers',
      clientRole: 'Account Holder', clientRolePlural: 'Account Holders',
      advisorPortalLabel: 'Trust Officer Portal', clientPortalLabel: 'Account Holder Portal',
      clientBookLabel: 'Account Book',
      onboardingAction: 'New Beneficiary Update', onboardingWorkflowLabel: 'Beneficiary Change',
      maintenanceAction: 'Review Trust Documents', maintenanceWorkflowLabel: 'Trust Review'
    },
    kpis: {
      advisor: [
        { key: 'pendingChanges', label: 'Pending Changes', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+6 this week' },
        { key: 'completedChanges', label: 'Completed This Month', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+18 this month' },
        { key: 'trustValue', label: 'Trust Assets', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+1.2% this quarter' },
        { key: 'reviewAlerts', label: 'Review Alerts', format: 'number', static: 2, trend: '-35% vs last month' }
      ],
      client: [
        { key: 'accountValue', label: 'Account Value', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'lastUpdate', label: 'Last Update', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'beneficiary-change', label: 'Beneficiary Change', icon: 'users' },
        { type: 'trust-amendment', label: 'Trust Amendment', icon: 'file-text' },
        { type: 'notarized-affidavit', label: 'Notarized Affidavit', icon: 'shield' },
        { type: 'retirement-update', label: 'Retirement Update', icon: 'folder-plus' },
        { type: 'spousal-consent', label: 'Spousal Consent', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 84, completionRate: 93 },
      turnaroundHours: 12.5,
      volumeSeries: [3, 4, 5, 6, 4, 7, 5, 8, 6, 9, 7, 10]
    }
  },

  // ── Public Sector ───────────────────────────────────────────
  {
    key: 'permit-application',
    vertical: 'public-sector',
    title: 'Permit Application',
    description: 'Manage building and business permit applications with multi-department review workflows.',
    highlightedProducts: ['web-forms', 'workspaces', 'monitor'],
    brandColor: '#0369a1',
    portalName: 'PermitHub',
    terminology: {
      advisorRole: 'Case Officer', advisorRolePlural: 'Case Officers',
      clientRole: 'Applicant', clientRolePlural: 'Applicants',
      advisorPortalLabel: 'Officer Portal', clientPortalLabel: 'Applicant Portal',
      clientBookLabel: 'Application Queue',
      onboardingAction: 'New Permit Application', onboardingWorkflowLabel: 'Permit Review',
      maintenanceAction: 'Request Amendment', maintenanceWorkflowLabel: 'Permit Amendment'
    },
    kpis: {
      advisor: [
        { key: 'openApps', label: 'Open Applications', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+14 this month' },
        { key: 'approvedThisMonth', label: 'Approved This Month', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+22 this month' },
        { key: 'avgReviewDays', label: 'Avg Review Days', format: 'text', static: '4.3 days', trend: '-28% vs last quarter' },
        { key: 'escalations', label: 'Escalations', format: 'number', static: 2, trend: '-60% vs manual' }
      ],
      client: [
        { key: 'permitStatus', label: 'Permit Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' },
        { key: 'feesPaid', label: 'Fees Paid', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'permit-application', label: 'Permit Application', icon: 'folder-plus' },
        { type: 'site-plan', label: 'Site Plan', icon: 'file-text' },
        { type: 'zoning-review', label: 'Zoning Review', icon: 'shield' },
        { type: 'inspection-report', label: 'Inspection Report', icon: 'users' },
        { type: 'permit-issuance', label: 'Permit Issuance', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 312, completionRate: 78 },
      turnaroundHours: 103.2,
      volumeSeries: [20, 24, 18, 28, 32, 26, 35, 30, 38, 34, 40, 42]
    }
  },
  {
    key: 'benefits-enrollment',
    vertical: 'public-sector',
    title: 'Benefits Enrollment',
    description: 'Streamline public benefits enrollment with eligibility checks, document collection, and case tracking.',
    highlightedProducts: ['web-forms', 'id-verification', 'doc-gen'],
    brandColor: '#4338ca',
    portalName: 'BenefitsConnect',
    terminology: {
      advisorRole: 'Caseworker', advisorRolePlural: 'Caseworkers',
      clientRole: 'Enrollee', clientRolePlural: 'Enrollees',
      advisorPortalLabel: 'Caseworker Portal', clientPortalLabel: 'Enrollee Portal',
      clientBookLabel: 'Caseload',
      onboardingAction: 'New Enrollment', onboardingWorkflowLabel: 'Benefits Enrollment',
      maintenanceAction: 'Recertification', maintenanceWorkflowLabel: 'Annual Recertification'
    },
    kpis: {
      advisor: [
        { key: 'activeCases', label: 'Active Cases', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+23 this month' },
        { key: 'pendingEnrollments', label: 'Pending Enrollments', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+8 this week' },
        { key: 'avgProcessing', label: 'Avg Processing', format: 'text', static: '2.8 days', trend: '-40% vs manual' },
        { key: 'eligibilityFlags', label: 'Eligibility Flags', format: 'number', static: 5, trend: '+2 this week' }
      ],
      client: [
        { key: 'benefitAmount', label: 'Monthly Benefit', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'enrollmentStatus', label: 'Enrollment Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'enrollment-form', label: 'Enrollment Form', icon: 'folder-plus' },
        { type: 'eligibility-docs', label: 'Eligibility Documents', icon: 'file-text' },
        { type: 'income-verification', label: 'Income Verification', icon: 'shield' },
        { type: 'authorization-release', label: 'Authorization Release', icon: 'users' },
        { type: 'recertification', label: 'Recertification', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 487, completionRate: 82 },
      turnaroundHours: 67.2,
      volumeSeries: [35, 40, 32, 45, 50, 42, 55, 48, 60, 52, 65, 70]
    }
  },
  {
    key: 'court-filing',
    vertical: 'public-sector',
    title: 'Court Filing',
    description: 'Digitize court document filing with e-signatures, notarization, and case management.',
    highlightedProducts: ['notary', 'doc-gen', 'workspaces'],
    brandColor: '#1e3a5f',
    portalName: 'CourtFile',
    terminology: {
      advisorRole: 'Court Clerk', advisorRolePlural: 'Court Clerks',
      clientRole: 'Filer', clientRolePlural: 'Filers',
      advisorPortalLabel: 'Clerk Portal', clientPortalLabel: 'Filer Portal',
      clientBookLabel: 'Filing Queue',
      onboardingAction: 'New Filing', onboardingWorkflowLabel: 'Document Filing',
      maintenanceAction: 'Amend Filing', maintenanceWorkflowLabel: 'Filing Amendment'
    },
    kpis: {
      advisor: [
        { key: 'pendingFilings', label: 'Pending Filings', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+11 this week' },
        { key: 'processedToday', label: 'Processed Today', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+34 today' },
        { key: 'avgProcessing', label: 'Avg Processing', format: 'text', static: '1.2 days', trend: '-55% vs paper' },
        { key: 'rejections', label: 'Rejections', format: 'number', static: 3, trend: '-40% vs last month' }
      ],
      client: [
        { key: 'filingStatus', label: 'Filing Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' },
        { key: 'filingFees', label: 'Filing Fees', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'court-petition', label: 'Court Petition', icon: 'folder-plus' },
        { type: 'sworn-affidavit', label: 'Sworn Affidavit', icon: 'shield' },
        { type: 'notarized-docs', label: 'Notarized Documents', icon: 'file-text' },
        { type: 'summons', label: 'Summons', icon: 'users' },
        { type: 'order-judgment', label: 'Order / Judgment', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 234, completionRate: 90 },
      turnaroundHours: 28.8,
      volumeSeries: [18, 22, 16, 26, 30, 24, 32, 28, 36, 32, 38, 42]
    }
  },

  // ── Banking ─────────────────────────────────────────────────
  {
    key: 'mortgage-closing',
    vertical: 'banking',
    title: 'Mortgage Closing',
    description: 'Accelerate mortgage closings with digital document packages, e-notarization, and compliance checks.',
    highlightedProducts: ['notary', 'doc-gen', 'id-verification'],
    brandColor: '#b45309',
    portalName: 'ClosingEdge',
    terminology: {
      advisorRole: 'Loan Officer', advisorRolePlural: 'Loan Officers',
      clientRole: 'Borrower', clientRolePlural: 'Borrowers',
      advisorPortalLabel: 'Loan Officer Portal', clientPortalLabel: 'Borrower Portal',
      clientBookLabel: 'Loan Pipeline',
      onboardingAction: 'New Loan Application', onboardingWorkflowLabel: 'Loan Origination',
      maintenanceAction: 'Document Request', maintenanceWorkflowLabel: 'Document Collection'
    },
    kpis: {
      advisor: [
        { key: 'activePipeline', label: 'Active Pipeline', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+8 this month' },
        { key: 'loanVolume', label: 'Loan Volume', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$4.2M this quarter' },
        { key: 'pendingClosings', label: 'Pending Closings', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+5 this week' },
        { key: 'complianceFlags', label: 'Compliance Flags', format: 'number', static: 2, trend: '-65% vs manual' }
      ],
      client: [
        { key: 'loanAmount', label: 'Loan Amount', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'closingDate', label: 'Closing Date', format: 'text', computeFrom: 'data.nextAppointment', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'loan-application', label: 'Loan Application', icon: 'folder-plus' },
        { type: 'closing-disclosure', label: 'Closing Disclosure', icon: 'file-text' },
        { type: 'title-insurance', label: 'Title Insurance', icon: 'shield' },
        { type: 'deed-of-trust', label: 'Deed of Trust', icon: 'users' },
        { type: 'notarized-closing', label: 'Notarized Closing', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 96, completionRate: 88 },
      turnaroundHours: 168,
      volumeSeries: [7, 9, 6, 11, 13, 10, 15, 12, 17, 14, 19, 22]
    }
  },
  {
    key: 'business-account',
    vertical: 'banking',
    title: 'Business Account Opening',
    description: 'Onboard business clients with entity verification, authorized signer setup, and compliance review.',
    highlightedProducts: ['id-verification', 'web-forms', 'workspaces'],
    brandColor: '#15803d',
    portalName: 'BizBank',
    terminology: {
      advisorRole: 'Relationship Manager', advisorRolePlural: 'Relationship Managers',
      clientRole: 'Business Client', clientRolePlural: 'Business Clients',
      advisorPortalLabel: 'RM Portal', clientPortalLabel: 'Client Portal',
      clientBookLabel: 'Client Portfolio',
      onboardingAction: 'New Business Account', onboardingWorkflowLabel: 'Account Opening',
      maintenanceAction: 'Update Signers', maintenanceWorkflowLabel: 'Signer Update'
    },
    kpis: {
      advisor: [
        { key: 'activeAccounts', label: 'Active Accounts', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+6 this month' },
        { key: 'totalDeposits', label: 'Total Deposits', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$1.8M this quarter' },
        { key: 'pendingKyb', label: 'Pending KYB', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+3 this week' },
        { key: 'complianceAlerts', label: 'AML Alerts', format: 'number', static: 1, trend: '-80% vs manual' }
      ],
      client: [
        { key: 'accountBalance', label: 'Account Balance', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'accountStatus', label: 'Account Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'business-application', label: 'Business Application', icon: 'folder-plus' },
        { type: 'entity-verification', label: 'Entity Verification', icon: 'shield' },
        { type: 'signer-authorization', label: 'Signer Authorization', icon: 'users' },
        { type: 'operating-agreement', label: 'Operating Agreement', icon: 'file-text' },
        { type: 'treasury-services', label: 'Treasury Services', icon: 'arrow-right-left' }
      ],
      summaryMetrics: { totalCount: 64, completionRate: 91 },
      turnaroundHours: 24,
      volumeSeries: [4, 5, 3, 7, 8, 6, 9, 7, 11, 9, 12, 14]
    }
  },

  // ── Education ───────────────────────────────────────────────
  {
    key: 'financial-aid',
    vertical: 'education',
    title: 'Financial Aid',
    description: 'Process financial aid applications with document collection, eligibility verification, and award letters.',
    highlightedProducts: ['web-forms', 'doc-gen', 'id-verification'],
    brandColor: '#9333ea',
    portalName: 'AidFlow',
    terminology: {
      advisorRole: 'Aid Counselor', advisorRolePlural: 'Aid Counselors',
      clientRole: 'Student', clientRolePlural: 'Students',
      advisorPortalLabel: 'Counselor Portal', clientPortalLabel: 'Student Portal',
      clientBookLabel: 'Student Roster',
      onboardingAction: 'New Aid Application', onboardingWorkflowLabel: 'Aid Application',
      maintenanceAction: 'Appeal Request', maintenanceWorkflowLabel: 'Aid Appeal'
    },
    kpis: {
      advisor: [
        { key: 'pendingApps', label: 'Pending Applications', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+32 this month' },
        { key: 'aidDisbursed', label: 'Aid Disbursed', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$890K this semester' },
        { key: 'verificationQueue', label: 'Verification Queue', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'review', trend: '+12 this week' },
        { key: 'missingDocs', label: 'Missing Documents', format: 'number', static: 8, trend: '-25% vs last cycle' }
      ],
      client: [
        { key: 'aidAmount', label: 'Aid Amount', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'appStatus', label: 'Application Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'aid-application', label: 'Aid Application', icon: 'folder-plus' },
        { type: 'verification-docs', label: 'Verification Documents', icon: 'file-text' },
        { type: 'award-letter', label: 'Award Letter', icon: 'shield' },
        { type: 'loan-agreement', label: 'Loan Agreement', icon: 'arrow-right-left' },
        { type: 'enrollment-verification', label: 'Enrollment Verification', icon: 'users' }
      ],
      summaryMetrics: { totalCount: 524, completionRate: 76 },
      turnaroundHours: 96,
      volumeSeries: [45, 52, 38, 60, 68, 55, 72, 65, 80, 72, 85, 90]
    }
  },
  {
    key: 'research-grant',
    vertical: 'education',
    title: 'Research Grant',
    description: 'Manage research grant proposals, IRB approvals, and fund disbursement with collaborative workflows.',
    highlightedProducts: ['workspaces', 'doc-gen', 'monitor'],
    brandColor: '#be185d',
    portalName: 'GrantTrack',
    terminology: {
      advisorRole: 'Grants Officer', advisorRolePlural: 'Grants Officers',
      clientRole: 'Researcher', clientRolePlural: 'Researchers',
      advisorPortalLabel: 'Grants Portal', clientPortalLabel: 'Researcher Portal',
      clientBookLabel: 'Grant Portfolio',
      onboardingAction: 'New Grant Proposal', onboardingWorkflowLabel: 'Grant Proposal',
      maintenanceAction: 'Progress Report', maintenanceWorkflowLabel: 'Grant Reporting'
    },
    kpis: {
      advisor: [
        { key: 'activeGrants', label: 'Active Grants', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'active', trend: '+4 this quarter' },
        { key: 'totalFunding', label: 'Total Funding', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum', trend: '+$1.2M this year' },
        { key: 'pendingProposals', label: 'Pending Proposals', format: 'number', computeFrom: 'status', aggregate: 'countWhere', countWhereValue: 'pending', trend: '+7 this month' },
        { key: 'complianceReviews', label: 'IRB Reviews', format: 'number', static: 4, trend: '-15% vs last quarter' }
      ],
      client: [
        { key: 'grantAmount', label: 'Grant Amount', format: 'currency', computeFrom: 'accounts.balance', aggregate: 'sum' },
        { key: 'grantStatus', label: 'Grant Status', format: 'text', computeFrom: 'data.authStatus', aggregate: 'first' }
      ]
    },
    agreements: {
      taxonomy: [
        { type: 'grant-proposal', label: 'Grant Proposal', icon: 'folder-plus' },
        { type: 'irb-approval', label: 'IRB Approval', icon: 'shield' },
        { type: 'budget-justification', label: 'Budget Justification', icon: 'file-text' },
        { type: 'subaward-agreement', label: 'Subaward Agreement', icon: 'arrow-right-left' },
        { type: 'progress-report', label: 'Progress Report', icon: 'users' }
      ],
      summaryMetrics: { totalCount: 38, completionRate: 84 },
      turnaroundHours: 240,
      volumeSeries: [2, 3, 2, 4, 5, 3, 6, 4, 7, 5, 8, 6]
    }
  }
];

// ---------------------------------------------------------------------------
// Seed helpers — shared by presets (auto-seed) and CLI seed script
// ---------------------------------------------------------------------------

function account(id, name, accountType, value, ytdReturn, allocations, extra = {}) {
  return {
    id,
    status: extra.status || 'active',
    name,
    accountType,
    value,
    ytdReturn,
    allocEquity: allocations.equity,
    allocFixed: allocations.fixed,
    allocAlt: allocations.alt,
    allocCash: allocations.cash,
    ...extra
  };
}

function envelope(id, employeeId, customerId, status, name) {
  return { id, employeeId, customerId, status, name };
}

function task(id, employeeId, customerId, title, description, extra = {}) {
  return {
    id,
    employeeId,
    customerId,
    title,
    description,
    status: extra.status || 'pending',
    data: {
      workflow: extra.workflow || 'asset-transfer',
      ...extra.data
    }
  };
}

function buildProfileFromDescriptor(desc, slugOverride) {
  const pfx = slugOverride || desc.prefix;
  const employees = desc.employees.map((e, i) => ({
    id: `${pfx}-emp-${String(i + 1).padStart(3, '0')}`,
    displayName: e.name,
    email: e.email,
    phone: e.phone,
    title: e.title
  }));

  const customers = desc.customers.map((c, i) => {
    const empIdx = i % employees.length;
    const custId = `${pfx}-cust-${String(i + 1).padStart(3, '0')}`;
    return {
      id: custId,
      employeeId: employees[empIdx].id,
      displayName: c.name,
      email: c.email,
      phone: c.phone,
      organization: c.org,
      status: c.status,
      data: {
        riskProfile: c.risk || 'Medium',
        value: c.value, netWorth: c.netWorth || 0, changePct: c.changePct || 0,
        nextAppointment: c.nextDate || '',
        authStatus: c.authStatus || '',
        accounts: (c.accounts || []).map((a, ai) =>
          account(`${custId}-acct-${ai + 1}`, a.name, a.type, a.value, a.ytd || 0,
            { equity: a.eq || 0, fixed: a.fi || 0, alt: a.alt || 0, cash: a.cash || 0 },
            a.extra || {}
          )
        )
      }
    };
  });

  const envelopes = desc.envelopes.map((e, i) => {
    const empIdx = i % employees.length;
    const custIdx = i % customers.length;
    return envelope(
      `${pfx}-env-${String(i + 1).padStart(3, '0')}`,
      employees[empIdx].id,
      customers[custIdx].id,
      e.status,
      e.name
    );
  });

  const tasks = desc.tasks.map((t, i) => {
    const custIdx = i % customers.length;
    const empIdx = i % employees.length;
    return task(
      `${pfx}-task-${String(i + 1).padStart(3, '0')}`,
      employees[empIdx].id,
      customers[custIdx].id,
      t.title.replace('{customer}', customers[custIdx].displayName),
      t.desc.replace('{customer}', customers[custIdx].displayName),
      { workflow: t.workflow || desc.workflow || 'asset-transfer' }
    );
  });

  return { employees, customers, envelopes, tasks };
}

// ---------------------------------------------------------------------------
// 15 Seed descriptors — one per preset
// ---------------------------------------------------------------------------

const SEED_DESCRIPTORS = {
  'patient-intake': {
    prefix: 'pi', workflow: 'patient-intake',
    employees: [
      { name: 'Dr. Sarah Chen', email: 's.chen@medflowhealth.com', phone: '(415) 555-0201', title: 'Lead Care Coordinator' },
      { name: 'Marcus Rivera', email: 'm.rivera@medflowhealth.com', phone: '(415) 555-0202', title: 'Patient Services Coordinator' }
    ],
    customers: [
      { name: 'James Mitchell', email: 'j.mitchell@email.com', phone: '(510) 555-0301', org: 'Primary Care', status: 'active', value: 4200, nextDate: 'Apr 15, 2026', accounts: [{ name: 'Treatment Plan', type: 'Medical', value: 2800, fi: 100 }, { name: 'Lab & Diagnostics', type: 'Lab', value: 1400, alt: 100 }] },
      { name: 'Maria Santos', email: 'm.santos@email.com', phone: '(510) 555-0302', org: 'Cardiology', status: 'active', value: 8900, nextDate: 'Apr 22, 2026', accounts: [{ name: 'Cardiology Treatment', type: 'Medical', value: 6200, fi: 100 }, { name: 'Prescription Plan', type: 'Pharmacy', value: 2700, alt: 100 }] },
      { name: 'Robert Kim', email: 'r.kim@email.com', phone: '(510) 555-0303', org: 'Orthopedics', status: 'pending', value: 15600, nextDate: 'Apr 10, 2026', accounts: [{ name: 'Surgical Plan', type: 'Medical', value: 12000, fi: 100 }, { name: 'Rehabilitation', type: 'Therapy', value: 3600, alt: 100 }] },
      { name: 'Linda Patel', email: 'l.patel@email.com', phone: '(510) 555-0304', org: 'Endocrinology', status: 'review', value: 3100, nextDate: 'May 1, 2026', accounts: [{ name: 'Ongoing Treatment', type: 'Medical', value: 2100, fi: 100 }, { name: 'Lab Monitoring', type: 'Lab', value: 1000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Patient Intake Form', status: 'completed' },
      { name: 'HIPAA Consent', status: 'completed' },
      { name: 'Records Transfer Request', status: 'sent' },
      { name: 'Insurance Authorization', status: 'delivered' },
      { name: 'Treatment Plan Agreement', status: 'completed' }
    ],
    tasks: [
      { title: 'Patient intake for {customer}', desc: 'Complete patient intake workflow for {customer}.' },
      { title: 'Records transfer for {customer}', desc: 'Initiate records transfer for {customer}.' },
      { title: 'Insurance verification for {customer}', desc: 'Verify insurance for {customer}.' },
      { title: 'Follow-up scheduling for {customer}', desc: 'Schedule follow-up for {customer}.' }
    ]
  },

  'surgical-preauth': {
    prefix: 'sp', workflow: 'preauth',
    employees: [
      { name: 'Dr. Angela Torres', email: 'a.torres@surgiauth.com', phone: '(312) 555-0101', title: 'Surgical Coordinator' },
      { name: 'David Park', email: 'd.park@surgiauth.com', phone: '(312) 555-0102', title: 'Pre-Auth Specialist' }
    ],
    customers: [
      { name: 'Thomas Wright', email: 't.wright@email.com', phone: '(773) 555-0201', org: 'Orthopedic Surgery', status: 'pending', value: 45000, nextDate: 'Apr 20, 2026', authStatus: 'Pending Payer Review', accounts: [{ name: 'Knee Replacement', type: 'Surgical', value: 38000, fi: 100 }, { name: 'Post-Op Rehab', type: 'Therapy', value: 7000, alt: 100 }] },
      { name: 'Susan Clark', email: 's.clark@email.com', phone: '(773) 555-0202', org: 'Cardiac Surgery', status: 'active', value: 82000, nextDate: 'Apr 25, 2026', authStatus: 'Approved', accounts: [{ name: 'Bypass Surgery', type: 'Surgical', value: 72000, fi: 100 }, { name: 'ICU Recovery', type: 'Recovery', value: 10000, alt: 100 }] },
      { name: 'Michael Brown', email: 'm.brown@email.com', phone: '(773) 555-0203', org: 'Neurosurgery', status: 'review', value: 120000, nextDate: 'May 2, 2026', authStatus: 'Additional Info Required', accounts: [{ name: 'Spinal Fusion', type: 'Surgical', value: 95000, fi: 100 }, { name: 'Imaging & Diagnostics', type: 'Diagnostic', value: 25000, alt: 100 }] },
      { name: 'Jennifer Lee', email: 'j.lee@email.com', phone: '(773) 555-0204', org: 'General Surgery', status: 'active', value: 28000, nextDate: 'Apr 18, 2026', authStatus: 'Approved', accounts: [{ name: 'Laparoscopic Procedure', type: 'Surgical', value: 22000, fi: 100 }, { name: 'Anesthesia', type: 'Anesthesia', value: 6000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Pre-Auth Request Form', status: 'completed' },
      { name: 'Clinical Summary Report', status: 'sent' },
      { name: 'Payer Approval Letter', status: 'completed' },
      { name: 'Surgical Consent Form', status: 'delivered' },
      { name: 'Anesthesia Consent', status: 'completed' }
    ],
    tasks: [
      { title: 'Pre-auth review for {customer}', desc: 'Review surgical pre-authorization for {customer}.' },
      { title: 'Clinical docs for {customer}', desc: 'Compile clinical documentation for {customer}.' },
      { title: 'Payer follow-up for {customer}', desc: 'Follow up with payer for {customer} authorization.' },
      { title: 'Consent collection for {customer}', desc: 'Collect surgical consent from {customer}.' }
    ]
  },

  'prescription-management': {
    prefix: 'rx', workflow: 'prescription',
    employees: [
      { name: 'Dr. Rachel Green', email: 'r.green@rxflow.com', phone: '(617) 555-0101', title: 'Lead Pharmacist' },
      { name: 'Kevin Nguyen', email: 'k.nguyen@rxflow.com', phone: '(617) 555-0102', title: 'Pharmacy Technician' }
    ],
    customers: [
      { name: 'Patricia Moore', email: 'p.moore@email.com', phone: '(857) 555-0201', org: 'Chronic Care', status: 'active', value: 1200, nextDate: 'Apr 12, 2026', accounts: [{ name: 'Blood Pressure Meds', type: 'Prescription', value: 800, fi: 100 }, { name: 'Cholesterol Meds', type: 'Prescription', value: 400, alt: 100 }] },
      { name: 'Daniel Garcia', email: 'd.garcia@email.com', phone: '(857) 555-0202', org: 'Diabetes Management', status: 'review', value: 2400, nextDate: 'Apr 16, 2026', accounts: [{ name: 'Insulin Supply', type: 'Prescription', value: 1800, fi: 100 }, { name: 'Monitoring Supplies', type: 'Medical Supply', value: 600, alt: 100 }] },
      { name: 'Nancy Wilson', email: 'n.wilson@email.com', phone: '(857) 555-0203', org: 'Pain Management', status: 'active', value: 900, nextDate: 'Apr 20, 2026', accounts: [{ name: 'Pain Management Rx', type: 'Prescription', value: 650, fi: 100 }, { name: 'Physical Therapy', type: 'Therapy', value: 250, alt: 100 }] },
      { name: 'Steven Taylor', email: 's.taylor@email.com', phone: '(857) 555-0204', org: 'Mental Health', status: 'pending', value: 600, nextDate: 'May 5, 2026', accounts: [{ name: 'Antidepressant Rx', type: 'Prescription', value: 400, fi: 100 }, { name: 'Counseling Sessions', type: 'Therapy', value: 200, alt: 100 }] }
    ],
    envelopes: [
      { name: 'New Prescription Order', status: 'completed' },
      { name: 'Renewal Authorization', status: 'sent' },
      { name: 'Prior Authorization Request', status: 'delivered' },
      { name: 'Patient Consent Form', status: 'completed' },
      { name: 'Pharmacy Transfer Request', status: 'completed' }
    ],
    tasks: [
      { title: 'Renewal review for {customer}', desc: 'Review prescription renewal for {customer}.' },
      { title: 'Prior auth for {customer}', desc: 'Process prior authorization for {customer}.' },
      { title: 'Refill notification for {customer}', desc: 'Send refill reminder to {customer}.' },
      { title: 'Drug interaction check for {customer}', desc: 'Verify drug interactions for {customer}.' }
    ]
  },

  'auto-policy': {
    prefix: 'ap', workflow: 'policy-issuance',
    employees: [
      { name: 'Amanda Foster', email: 'a.foster@autoshield.com', phone: '(214) 555-0101', title: 'Senior Agent' },
      { name: 'Brian Walker', email: 'b.walker@autoshield.com', phone: '(214) 555-0102', title: 'Policy Specialist' }
    ],
    customers: [
      { name: 'Chris Donovan', email: 'c.donovan@email.com', phone: '(469) 555-0201', org: 'Personal Auto', status: 'active', value: 2400, nextDate: 'Oct 15, 2026', accounts: [{ name: 'Full Coverage', type: 'Auto Policy', value: 1800, fi: 100 }, { name: 'Roadside Assistance', type: 'Add-on', value: 600, alt: 100 }] },
      { name: 'Emily Reeves', email: 'e.reeves@email.com', phone: '(469) 555-0202', org: 'Personal Auto', status: 'pending', value: 3200, nextDate: 'Jul 1, 2026', accounts: [{ name: 'Comprehensive Plan', type: 'Auto Policy', value: 2800, fi: 100 }, { name: 'Gap Insurance', type: 'Add-on', value: 400, alt: 100 }] },
      { name: 'Frank Hernandez', email: 'f.hernandez@email.com', phone: '(469) 555-0203', org: 'Commercial Fleet', status: 'active', value: 18500, nextDate: 'Jan 10, 2027', accounts: [{ name: 'Fleet Coverage', type: 'Commercial', value: 15000, fi: 100 }, { name: 'Liability Umbrella', type: 'Commercial', value: 3500, alt: 100 }] },
      { name: 'Grace Kim', email: 'g.kim@email.com', phone: '(469) 555-0204', org: 'Personal Auto', status: 'review', value: 1900, nextDate: 'Aug 20, 2026', accounts: [{ name: 'Liability Only', type: 'Auto Policy', value: 1200, fi: 100 }, { name: 'Uninsured Motorist', type: 'Add-on', value: 700, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Policy Application', status: 'completed' },
      { name: 'Driver Verification', status: 'completed' },
      { name: 'Coverage Selection Form', status: 'sent' },
      { name: 'Binding Agreement', status: 'delivered' },
      { name: 'Policy Endorsement', status: 'completed' }
    ],
    tasks: [
      { title: 'Policy review for {customer}', desc: 'Review auto policy application for {customer}.', workflow: 'policy-issuance' },
      { title: 'Driver verification for {customer}', desc: 'Verify driver records for {customer}.', workflow: 'policy-issuance' },
      { title: 'Coverage quote for {customer}', desc: 'Generate coverage quote for {customer}.', workflow: 'policy-issuance' },
      { title: 'Bind policy for {customer}', desc: 'Execute policy binding for {customer}.', workflow: 'policy-issuance' }
    ]
  },

  'homeowner-claim': {
    prefix: 'hc', workflow: 'claims',
    employees: [
      { name: 'Patricia Marsh', email: 'p.marsh@homeguard.com', phone: '(305) 555-0101', title: 'Senior Claims Adjuster' },
      { name: 'Ricardo Vega', email: 'r.vega@homeguard.com', phone: '(305) 555-0102', title: 'Field Adjuster' }
    ],
    customers: [
      { name: 'Harold Jenkins', email: 'h.jenkins@email.com', phone: '(786) 555-0201', org: 'Residential', status: 'active', value: 45000, authStatus: 'Under Review', accounts: [{ name: 'Storm Damage Claim', type: 'Property', value: 35000, fi: 100 }, { name: 'Temporary Housing', type: 'Living Expense', value: 10000, alt: 100 }] },
      { name: 'Karen Stewart', email: 'k.stewart@email.com', phone: '(786) 555-0202', org: 'Residential', status: 'review', value: 12000, authStatus: 'Pending Inspection', accounts: [{ name: 'Water Damage Claim', type: 'Property', value: 9500, fi: 100 }, { name: 'Mold Remediation', type: 'Additional', value: 2500, alt: 100 }] },
      { name: 'Larry Thompson', email: 'l.thompson@email.com', phone: '(786) 555-0203', org: 'Residential', status: 'pending', value: 78000, authStatus: 'Awaiting Documentation', accounts: [{ name: 'Fire Damage Claim', type: 'Property', value: 65000, fi: 100 }, { name: 'Contents Replacement', type: 'Personal Property', value: 13000, alt: 100 }] },
      { name: 'Monica Reyes', email: 'm.reyes@email.com', phone: '(786) 555-0204', org: 'Residential', status: 'active', value: 8500, authStatus: 'Settlement Offered', accounts: [{ name: 'Theft Claim', type: 'Property', value: 6500, fi: 100 }, { name: 'Security Upgrade', type: 'Mitigation', value: 2000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Claim Report Form', status: 'completed' },
      { name: 'Damage Documentation', status: 'completed' },
      { name: 'Proof of Loss Statement', status: 'sent' },
      { name: 'Settlement Offer Letter', status: 'delivered' },
      { name: 'Release and Waiver', status: 'completed' }
    ],
    tasks: [
      { title: 'Damage assessment for {customer}', desc: 'Conduct damage assessment for {customer} claim.', workflow: 'claims' },
      { title: 'Documentation review for {customer}', desc: 'Review claim documentation for {customer}.', workflow: 'claims' },
      { title: 'Settlement calculation for {customer}', desc: 'Calculate settlement for {customer} claim.', workflow: 'claims' },
      { title: 'Follow-up inspection for {customer}', desc: 'Schedule follow-up inspection for {customer}.', workflow: 'claims' }
    ]
  },

  'life-underwriting': {
    prefix: 'lu', workflow: 'underwriting',
    employees: [
      { name: 'Catherine Wells', email: 'c.wells@lifesecure.com', phone: '(860) 555-0101', title: 'Chief Underwriter' },
      { name: 'Nathan Brooks', email: 'n.brooks@lifesecure.com', phone: '(860) 555-0102', title: 'Medical Underwriter' }
    ],
    customers: [
      { name: 'Andrew Chapman', email: 'a.chapman@email.com', phone: '(203) 555-0201', org: 'Term Life', status: 'pending', value: 500000, authStatus: 'Medical Review', risk: 'Low', accounts: [{ name: '20-Year Term', type: 'Life Policy', value: 500000, fi: 100 }] },
      { name: 'Barbara Ford', email: 'b.ford@email.com', phone: '(203) 555-0202', org: 'Whole Life', status: 'review', value: 1000000, authStatus: 'Awaiting Lab Results', risk: 'Medium', accounts: [{ name: 'Whole Life Policy', type: 'Life Policy', value: 750000, fi: 100 }, { name: 'Accidental Death Rider', type: 'Rider', value: 250000, alt: 100 }] },
      { name: 'Carl Davidson', email: 'c.davidson@email.com', phone: '(203) 555-0203', org: 'Universal Life', status: 'active', value: 750000, authStatus: 'Approved', risk: 'Low', accounts: [{ name: 'Universal Life Policy', type: 'Life Policy', value: 750000, fi: 100 }] },
      { name: 'Diana Ellis', email: 'd.ellis@email.com', phone: '(203) 555-0204', org: 'Term Life', status: 'pending', value: 350000, authStatus: 'Pending Questionnaire', risk: 'High', accounts: [{ name: '10-Year Term', type: 'Life Policy', value: 350000, fi: 100 }] }
    ],
    envelopes: [
      { name: 'Life Application Form', status: 'completed' },
      { name: 'Health Questionnaire', status: 'sent' },
      { name: 'Medical Authorization', status: 'completed' },
      { name: 'Beneficiary Designation', status: 'delivered' },
      { name: 'Policy Delivery Receipt', status: 'completed' }
    ],
    tasks: [
      { title: 'Risk assessment for {customer}', desc: 'Complete risk assessment for {customer}.', workflow: 'underwriting' },
      { title: 'Medical records review for {customer}', desc: 'Review medical records for {customer}.', workflow: 'underwriting' },
      { title: 'Policy generation for {customer}', desc: 'Generate policy documents for {customer}.', workflow: 'underwriting' },
      { title: 'Beneficiary verification for {customer}', desc: 'Verify beneficiary designation for {customer}.', workflow: 'underwriting' }
    ]
  },

  'account-opening': {
    prefix: 'ao', workflow: 'account-opening',
    employees: [
      { name: 'Gordon Gecko', email: 'g.gecko@tgkwealth.com', phone: '(212) 555-0100', title: 'Senior Advisor' },
      { name: 'Serena Blake', email: 's.blake@tgkwealth.com', phone: '(212) 555-0144', title: 'Private Wealth Advisor' }
    ],
    customers: [
      { name: 'Anita Margin', email: 'anita.margin@margincallventures.com', phone: '(917) 555-0111', org: 'Margin Call Ventures', status: 'review', risk: 'Balanced Growth', value: 9600000, netWorth: 21700000, changePct: 0.028, accounts: [{ name: 'Global Growth Portfolio', type: 'Brokerage', value: 6100000, ytd: 0.083, eq: 61, fi: 15, alt: 18, cash: 6 }, { name: 'Impact Reserve', type: 'Trust', value: 3500000, ytd: 0.051, eq: 34, fi: 32, alt: 20, cash: 14 }] },
      { name: 'Robin Banks', email: 'robin@vaultstreetholdings.com', phone: '(646) 555-0112', org: 'Vault Street Holdings', status: 'active', risk: 'Moderate', value: 10800000, netWorth: 24300000, changePct: 0.019, accounts: [{ name: 'Family Opportunity Account', type: 'Brokerage', value: 6800000, ytd: 0.072, eq: 52, fi: 22, alt: 16, cash: 10 }, { name: 'Municipal Income Sleeve', type: 'Trust', value: 4000000, ytd: 0.039, eq: 16, fi: 61, alt: 8, cash: 15 }] },
      { name: 'Barry Bull', email: 'barry@bullmarketgroup.com', phone: '(347) 555-0115', org: 'Bull Market Group', status: 'pending', risk: 'Growth', value: 12300000, netWorth: 27200000, changePct: 0.013, accounts: [{ name: 'Founder Liquidity Account', type: 'Brokerage', value: 7300000, ytd: 0.058, eq: 57, fi: 12, alt: 16, cash: 15 }, { name: 'Short Duration Reserve', type: 'Cash Management', value: 5000000, ytd: 0.021, eq: 0, fi: 28, alt: 0, cash: 72 }] },
      { name: 'Penny Worth', email: 'penny@compoundinterestpartners.com', phone: '(646) 555-0118', org: 'Compound Interest Partners', status: 'active', risk: 'Moderate Growth', value: 16800000, netWorth: 36200000, changePct: 0.022, accounts: [{ name: 'Strategic Growth Portfolio', type: 'Brokerage', value: 9900000, ytd: 0.074, eq: 49, fi: 14, alt: 25, cash: 12 }, { name: 'Private Credit Reserve', type: 'Alternative', value: 6900000, ytd: 0.056, eq: 10, fi: 33, alt: 45, cash: 12 }] }
    ],
    envelopes: [
      { name: 'Account Opening Packet', status: 'completed' },
      { name: 'Transfer Authorization', status: 'sent' },
      { name: 'Beneficiary Update', status: 'completed' },
      { name: 'ACAT Transfer Packet', status: 'delivered' },
      { name: 'Wire Authorization Update', status: 'completed' }
    ],
    tasks: [
      { title: 'Asset transfer for {customer}', desc: 'Launch the asset transfer workflow for {customer}.' },
      { title: 'KYC review for {customer}', desc: 'Complete KYC verification for {customer}.' },
      { title: 'Suitability assessment for {customer}', desc: 'Run suitability review for {customer}.' },
      { title: 'Account funding for {customer}', desc: 'Process account funding for {customer}.' }
    ]
  },

  'beneficiary-change': {
    prefix: 'bc', workflow: 'beneficiary-change',
    employees: [
      { name: 'Eleanor Vance', email: 'e.vance@trustpoint.com', phone: '(617) 555-0101', title: 'Senior Trust Officer' },
      { name: 'Raymond Scott', email: 'r.scott@trustpoint.com', phone: '(617) 555-0102', title: 'Trust Administrator' }
    ],
    customers: [
      { name: 'Margaret Hayes', email: 'm.hayes@email.com', phone: '(508) 555-0201', org: 'Hayes Family Trust', status: 'pending', value: 4200000, netWorth: 8500000, nextDate: 'Apr 14, 2026', accounts: [{ name: 'Family Trust', type: 'Trust', value: 3200000, ytd: 0.041, eq: 30, fi: 45, alt: 15, cash: 10 }, { name: 'IRA Account', type: 'Retirement', value: 1000000, ytd: 0.055, eq: 50, fi: 30, alt: 10, cash: 10 }] },
      { name: 'William Porter', email: 'w.porter@email.com', phone: '(508) 555-0202', org: 'Porter Estate', status: 'active', value: 6800000, netWorth: 14200000, nextDate: 'Apr 22, 2026', accounts: [{ name: 'Revocable Trust', type: 'Trust', value: 5200000, ytd: 0.038, eq: 25, fi: 50, alt: 15, cash: 10 }, { name: 'Life Insurance Policy', type: 'Insurance', value: 1600000, fi: 100 }] },
      { name: 'Dorothy Murray', email: 'd.murray@email.com', phone: '(508) 555-0203', org: 'Murray Foundation', status: 'review', value: 2900000, netWorth: 5800000, nextDate: 'May 5, 2026', accounts: [{ name: 'Charitable Trust', type: 'Trust', value: 2100000, ytd: 0.032, eq: 20, fi: 55, alt: 10, cash: 15 }, { name: '401(k) Rollover', type: 'Retirement', value: 800000, ytd: 0.048, eq: 45, fi: 35, alt: 10, cash: 10 }] },
      { name: 'George Simmons', email: 'g.simmons@email.com', phone: '(508) 555-0204', org: 'Simmons Holdings', status: 'active', value: 3500000, netWorth: 7100000, nextDate: 'Apr 28, 2026', accounts: [{ name: 'Generation-Skipping Trust', type: 'Trust', value: 2500000, ytd: 0.036, eq: 22, fi: 48, alt: 18, cash: 12 }, { name: 'Annuity Contract', type: 'Annuity', value: 1000000, fi: 100 }] }
    ],
    envelopes: [
      { name: 'Beneficiary Change Form', status: 'completed' },
      { name: 'Trust Amendment', status: 'sent' },
      { name: 'Notarized Affidavit', status: 'completed' },
      { name: 'Spousal Consent Form', status: 'delivered' },
      { name: 'Retirement Plan Update', status: 'completed' }
    ],
    tasks: [
      { title: 'Beneficiary update for {customer}', desc: 'Process beneficiary change for {customer}.', workflow: 'beneficiary-change' },
      { title: 'Trust amendment for {customer}', desc: 'Draft trust amendment for {customer}.', workflow: 'beneficiary-change' },
      { title: 'Notarization for {customer}', desc: 'Schedule notarization for {customer}.', workflow: 'beneficiary-change' },
      { title: 'Compliance review for {customer}', desc: 'Complete compliance review for {customer}.', workflow: 'beneficiary-change' }
    ]
  },

  'permit-application': {
    prefix: 'pa', workflow: 'permit-review',
    employees: [
      { name: 'Janet Collins', email: 'j.collins@permithub.gov', phone: '(202) 555-0101', title: 'Senior Case Officer' },
      { name: 'Roberto Diaz', email: 'r.diaz@permithub.gov', phone: '(202) 555-0102', title: 'Permit Analyst' }
    ],
    customers: [
      { name: 'Apex Builders LLC', email: 'permits@apexbuilders.com', phone: '(703) 555-0201', org: 'Commercial Construction', status: 'pending', value: 2500, authStatus: 'Zoning Review', accounts: [{ name: 'Building Permit Fee', type: 'Fee', value: 1800, fi: 100 }, { name: 'Impact Fee', type: 'Fee', value: 700, alt: 100 }] },
      { name: 'Sarah Martinez', email: 's.martinez@email.com', phone: '(703) 555-0202', org: 'Residential', status: 'active', value: 450, authStatus: 'Approved', accounts: [{ name: 'Home Renovation Permit', type: 'Fee', value: 350, fi: 100 }, { name: 'Inspection Fee', type: 'Fee', value: 100, alt: 100 }] },
      { name: 'Metro Restaurants Inc', email: 'ops@metrorestaurants.com', phone: '(703) 555-0203', org: 'Food Service', status: 'review', value: 1200, authStatus: 'Health Dept Review', accounts: [{ name: 'Business License', type: 'Fee', value: 800, fi: 100 }, { name: 'Health Permit', type: 'Fee', value: 400, alt: 100 }] },
      { name: 'David Chen', email: 'd.chen@email.com', phone: '(703) 555-0204', org: 'Residential', status: 'pending', value: 650, authStatus: 'Submitted', accounts: [{ name: 'ADU Permit', type: 'Fee', value: 500, fi: 100 }, { name: 'Plan Review Fee', type: 'Fee', value: 150, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Permit Application Form', status: 'completed' },
      { name: 'Site Plan Submission', status: 'sent' },
      { name: 'Zoning Compliance Review', status: 'completed' },
      { name: 'Inspection Schedule', status: 'delivered' },
      { name: 'Permit Certificate', status: 'completed' }
    ],
    tasks: [
      { title: 'Zoning review for {customer}', desc: 'Complete zoning review for {customer} application.', workflow: 'permit-review' },
      { title: 'Plan check for {customer}', desc: 'Review submitted plans for {customer}.', workflow: 'permit-review' },
      { title: 'Inspection scheduling for {customer}', desc: 'Schedule site inspection for {customer}.', workflow: 'permit-review' },
      { title: 'Permit issuance for {customer}', desc: 'Issue permit for {customer}.', workflow: 'permit-review' }
    ]
  },

  'benefits-enrollment': {
    prefix: 'be', workflow: 'enrollment',
    employees: [
      { name: 'Lisa Washington', email: 'l.washington@benefits.gov', phone: '(916) 555-0101', title: 'Senior Caseworker' },
      { name: 'James Ortega', email: 'j.ortega@benefits.gov', phone: '(916) 555-0102', title: 'Eligibility Specialist' }
    ],
    customers: [
      { name: 'Maria Gonzalez', email: 'm.gonzalez@email.com', phone: '(916) 555-0201', org: 'CalFresh', status: 'active', value: 680, authStatus: 'Enrolled', accounts: [{ name: 'Monthly Benefit', type: 'Benefits', value: 680, fi: 100 }] },
      { name: 'Robert Johnson', email: 'r.johnson@email.com', phone: '(916) 555-0202', org: 'Medi-Cal', status: 'pending', value: 0, authStatus: 'Pending Verification', accounts: [{ name: 'Health Coverage', type: 'Benefits', value: 0, fi: 100 }] },
      { name: 'Kim Nguyen', email: 'k.nguyen2@email.com', phone: '(916) 555-0203', org: 'CalWORKs', status: 'review', value: 1100, authStatus: 'Recertification Due', accounts: [{ name: 'Cash Aid', type: 'Benefits', value: 800, fi: 100 }, { name: 'Childcare Subsidy', type: 'Benefits', value: 300, alt: 100 }] },
      { name: 'Anthony Davis', email: 'a.davis@email.com', phone: '(916) 555-0204', org: 'General Assistance', status: 'active', value: 400, authStatus: 'Active', accounts: [{ name: 'GA Payment', type: 'Benefits', value: 400, fi: 100 }] }
    ],
    envelopes: [
      { name: 'Enrollment Application', status: 'completed' },
      { name: 'Income Verification', status: 'sent' },
      { name: 'Eligibility Determination', status: 'completed' },
      { name: 'Authorization Release', status: 'delivered' },
      { name: 'Recertification Form', status: 'completed' }
    ],
    tasks: [
      { title: 'Eligibility check for {customer}', desc: 'Verify eligibility for {customer}.', workflow: 'enrollment' },
      { title: 'Document collection for {customer}', desc: 'Collect required documents from {customer}.', workflow: 'enrollment' },
      { title: 'Benefits calculation for {customer}', desc: 'Calculate benefit amount for {customer}.', workflow: 'enrollment' },
      { title: 'Recertification for {customer}', desc: 'Process annual recertification for {customer}.', workflow: 'enrollment' }
    ]
  },

  'court-filing': {
    prefix: 'cf', workflow: 'filing',
    employees: [
      { name: 'Sandra Reeves', email: 's.reeves@courtfile.gov', phone: '(312) 555-0101', title: 'Senior Court Clerk' },
      { name: 'Michael Torres', email: 'm.torres@courtfile.gov', phone: '(312) 555-0102', title: 'Filing Specialist' }
    ],
    customers: [
      { name: 'Johnson & Associates', email: 'filings@johnsonlaw.com', phone: '(312) 555-0201', org: 'Civil Litigation', status: 'active', value: 435, authStatus: 'Filed', accounts: [{ name: 'Civil Complaint Filing', type: 'Filing Fee', value: 435, fi: 100 }] },
      { name: 'Maria Rodriguez', email: 'm.rodriguez@email.com', phone: '(312) 555-0202', org: 'Family Court', status: 'pending', value: 350, authStatus: 'Pending Review', accounts: [{ name: 'Divorce Petition', type: 'Filing Fee', value: 350, fi: 100 }] },
      { name: 'Smith Legal Group', email: 'clerk@smithlegal.com', phone: '(312) 555-0203', org: 'Probate', status: 'review', value: 275, authStatus: 'Under Review', accounts: [{ name: 'Probate Filing', type: 'Filing Fee', value: 275, fi: 100 }] },
      { name: 'David Park', email: 'd.park2@email.com', phone: '(312) 555-0204', org: 'Small Claims', status: 'active', value: 75, authStatus: 'Hearing Scheduled', accounts: [{ name: 'Small Claims Filing', type: 'Filing Fee', value: 75, fi: 100 }] }
    ],
    envelopes: [
      { name: 'Court Petition', status: 'completed' },
      { name: 'Sworn Affidavit', status: 'completed' },
      { name: 'Notarized Declaration', status: 'sent' },
      { name: 'Summons', status: 'delivered' },
      { name: 'Court Order', status: 'completed' }
    ],
    tasks: [
      { title: 'Filing review for {customer}', desc: 'Review filing submission from {customer}.', workflow: 'filing' },
      { title: 'Document verification for {customer}', desc: 'Verify filing documents for {customer}.', workflow: 'filing' },
      { title: 'Hearing scheduling for {customer}', desc: 'Schedule hearing for {customer} case.', workflow: 'filing' },
      { title: 'Order processing for {customer}', desc: 'Process court order for {customer}.', workflow: 'filing' }
    ]
  },

  'mortgage-closing': {
    prefix: 'mc', workflow: 'loan-origination',
    employees: [
      { name: 'Jennifer Adams', email: 'j.adams@closingedge.com', phone: '(480) 555-0101', title: 'Senior Loan Officer' },
      { name: 'Carlos Ruiz', email: 'c.ruiz@closingedge.com', phone: '(480) 555-0102', title: 'Closing Coordinator' }
    ],
    customers: [
      { name: 'Michael & Sarah Chen', email: 'm.chen@email.com', phone: '(602) 555-0201', org: 'Residential Purchase', status: 'active', value: 485000, nextDate: 'Apr 30, 2026', accounts: [{ name: 'Conventional 30-Year', type: 'Mortgage', value: 485000, fi: 100 }] },
      { name: 'Jessica Williams', email: 'j.williams@email.com', phone: '(602) 555-0202', org: 'Refinance', status: 'pending', value: 320000, nextDate: 'May 15, 2026', accounts: [{ name: 'Cash-Out Refinance', type: 'Mortgage', value: 320000, fi: 100 }] },
      { name: 'Greenfield Properties', email: 'closing@greenfield.com', phone: '(602) 555-0203', org: 'Commercial', status: 'review', value: 1200000, nextDate: 'Jun 1, 2026', accounts: [{ name: 'Commercial Mortgage', type: 'Commercial', value: 1200000, fi: 100 }] },
      { name: "Patrick O'Brien", email: 'p.obrien@email.com', phone: '(602) 555-0204', org: 'FHA Purchase', status: 'active', value: 275000, nextDate: 'Apr 22, 2026', accounts: [{ name: 'FHA 30-Year', type: 'Mortgage', value: 275000, fi: 100 }] }
    ],
    envelopes: [
      { name: 'Loan Application Package', status: 'completed' },
      { name: 'Closing Disclosure', status: 'sent' },
      { name: 'Title Insurance Commitment', status: 'completed' },
      { name: 'Deed of Trust', status: 'delivered' },
      { name: 'Notarized Closing Package', status: 'completed' }
    ],
    tasks: [
      { title: 'Loan processing for {customer}', desc: 'Process loan application for {customer}.', workflow: 'loan-origination' },
      { title: 'Title search for {customer}', desc: 'Order title search for {customer} property.', workflow: 'loan-origination' },
      { title: 'Closing schedule for {customer}', desc: 'Schedule closing for {customer}.', workflow: 'loan-origination' },
      { title: 'Document preparation for {customer}', desc: 'Prepare closing documents for {customer}.', workflow: 'loan-origination' }
    ]
  },

  'business-account': {
    prefix: 'ba', workflow: 'account-opening',
    employees: [
      { name: 'Richard Lawson', email: 'r.lawson@bizbank.com', phone: '(404) 555-0101', title: 'Senior Relationship Manager' },
      { name: 'Alicia Wong', email: 'a.wong@bizbank.com', phone: '(404) 555-0102', title: 'Business Banking Specialist' }
    ],
    customers: [
      { name: 'TechStart Inc', email: 'finance@techstart.io', phone: '(770) 555-0201', org: 'Technology', status: 'active', value: 250000, authStatus: 'Active', accounts: [{ name: 'Business Checking', type: 'Checking', value: 180000, fi: 100 }, { name: 'Business Savings', type: 'Savings', value: 70000, alt: 100 }] },
      { name: 'Green Valley Farms', email: 'office@greenvalley.com', phone: '(770) 555-0202', org: 'Agriculture', status: 'pending', value: 85000, authStatus: 'KYB Pending', accounts: [{ name: 'Operating Account', type: 'Checking', value: 65000, fi: 100 }, { name: 'Equipment Fund', type: 'Savings', value: 20000, alt: 100 }] },
      { name: 'Metro Consulting Group', email: 'admin@metrocg.com', phone: '(770) 555-0203', org: 'Professional Services', status: 'active', value: 420000, authStatus: 'Active', accounts: [{ name: 'Operating Account', type: 'Checking', value: 300000, fi: 100 }, { name: 'Payroll Account', type: 'Checking', value: 120000, alt: 100 }] },
      { name: 'Sunrise Medical Group', email: 'billing@sunrisemed.com', phone: '(770) 555-0204', org: 'Healthcare', status: 'review', value: 175000, authStatus: 'Compliance Review', accounts: [{ name: 'Practice Account', type: 'Checking', value: 125000, fi: 100 }, { name: 'Reserve Fund', type: 'Savings', value: 50000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Business Application', status: 'completed' },
      { name: 'Entity Verification Package', status: 'completed' },
      { name: 'Authorized Signer Forms', status: 'sent' },
      { name: 'Operating Agreement', status: 'delivered' },
      { name: 'Treasury Services Agreement', status: 'completed' }
    ],
    tasks: [
      { title: 'KYB verification for {customer}', desc: 'Complete KYB verification for {customer}.', workflow: 'account-opening' },
      { title: 'Signer setup for {customer}', desc: 'Configure authorized signers for {customer}.', workflow: 'account-opening' },
      { title: 'Treasury onboarding for {customer}', desc: 'Set up treasury services for {customer}.', workflow: 'account-opening' },
      { title: 'Compliance review for {customer}', desc: 'Complete AML/BSA compliance for {customer}.', workflow: 'account-opening' }
    ]
  },

  'financial-aid': {
    prefix: 'fa', workflow: 'aid-application',
    employees: [
      { name: 'Dr. Karen Phillips', email: 'k.phillips@aidflow.edu', phone: '(213) 555-0101', title: 'Director of Financial Aid' },
      { name: 'Marcus Lee', email: 'm.lee@aidflow.edu', phone: '(213) 555-0102', title: 'Aid Counselor' }
    ],
    customers: [
      { name: 'Emma Rodriguez', email: 'e.rodriguez@student.edu', phone: '(310) 555-0201', org: 'Undergraduate', status: 'active', value: 28500, authStatus: 'Aid Awarded', accounts: [{ name: 'Pell Grant', type: 'Grant', value: 7395, fi: 100 }, { name: 'Subsidized Loan', type: 'Loan', value: 5500, alt: 100 }, { name: 'Institutional Scholarship', type: 'Scholarship', value: 15605, cash: 100 }] },
      { name: 'Jason Park', email: 'j.park@student.edu', phone: '(310) 555-0202', org: 'Graduate', status: 'pending', value: 45000, authStatus: 'Verification Required', accounts: [{ name: 'Graduate Unsubsidized', type: 'Loan', value: 20500, fi: 100 }, { name: 'Teaching Assistantship', type: 'Assistantship', value: 24500, alt: 100 }] },
      { name: 'Ashley Thompson', email: 'a.thompson@student.edu', phone: '(310) 555-0203', org: 'Undergraduate', status: 'review', value: 18200, authStatus: 'Documents Under Review', accounts: [{ name: 'Need-Based Grant', type: 'Grant', value: 12000, fi: 100 }, { name: 'Work-Study', type: 'Employment', value: 6200, alt: 100 }] },
      { name: 'Tyler Washington', email: 't.washington@student.edu', phone: '(310) 555-0204', org: 'Professional', status: 'pending', value: 52000, authStatus: 'FAFSA Submitted', accounts: [{ name: 'Health Professions Loan', type: 'Loan', value: 42000, fi: 100 }, { name: 'Scholarship', type: 'Scholarship', value: 10000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'FAFSA Verification', status: 'completed' },
      { name: 'Award Letter', status: 'sent' },
      { name: 'Loan Entrance Counseling', status: 'completed' },
      { name: 'Master Promissory Note', status: 'delivered' },
      { name: 'Enrollment Verification', status: 'completed' }
    ],
    tasks: [
      { title: 'FAFSA verification for {customer}', desc: 'Verify FAFSA data for {customer}.', workflow: 'aid-application' },
      { title: 'Award packaging for {customer}', desc: 'Package financial aid award for {customer}.', workflow: 'aid-application' },
      { title: 'Loan processing for {customer}', desc: 'Process loan documents for {customer}.', workflow: 'aid-application' },
      { title: 'Enrollment confirmation for {customer}', desc: 'Confirm enrollment for {customer} aid disbursement.', workflow: 'aid-application' }
    ]
  },

  'research-grant': {
    prefix: 'rg', workflow: 'grant-proposal',
    employees: [
      { name: 'Dr. Helen Park', email: 'h.park@granttrack.edu', phone: '(617) 555-0101', title: 'Senior Grants Officer' },
      { name: 'Thomas Rivera', email: 't.rivera@granttrack.edu', phone: '(617) 555-0102', title: 'Pre-Award Specialist' }
    ],
    customers: [
      { name: 'Dr. Sarah Chen', email: 's.chen@research.edu', phone: '(617) 555-0201', org: 'Biomedical Research', status: 'active', value: 450000, authStatus: 'Funded', accounts: [{ name: 'NIH R01 Grant', type: 'Federal Grant', value: 450000, fi: 100 }] },
      { name: 'Dr. James Wilson', email: 'j.wilson@research.edu', phone: '(617) 555-0202', org: 'Computer Science', status: 'pending', value: 280000, authStatus: 'Under Review', accounts: [{ name: 'NSF CAREER Award', type: 'Federal Grant', value: 280000, fi: 100 }] },
      { name: 'Dr. Maria Lopez', email: 'm.lopez@research.edu', phone: '(617) 555-0203', org: 'Environmental Science', status: 'review', value: 175000, authStatus: 'IRB Pending', accounts: [{ name: 'EPA Research Grant', type: 'Federal Grant', value: 125000, fi: 100 }, { name: 'Foundation Supplement', type: 'Private Grant', value: 50000, alt: 100 }] },
      { name: 'Dr. Robert Kim', email: 'r.kim@research.edu', phone: '(617) 555-0204', org: 'Physics', status: 'active', value: 620000, authStatus: 'Year 2 Active', accounts: [{ name: 'DOE Research Grant', type: 'Federal Grant', value: 520000, fi: 100 }, { name: 'Industry Partnership', type: 'Corporate', value: 100000, alt: 100 }] }
    ],
    envelopes: [
      { name: 'Grant Proposal Package', status: 'completed' },
      { name: 'IRB Application', status: 'sent' },
      { name: 'Budget Justification', status: 'completed' },
      { name: 'Subaward Agreement', status: 'delivered' },
      { name: 'Annual Progress Report', status: 'completed' }
    ],
    tasks: [
      { title: 'Proposal review for {customer}', desc: 'Review grant proposal for {customer}.', workflow: 'grant-proposal' },
      { title: 'Budget review for {customer}', desc: 'Review budget justification for {customer}.', workflow: 'grant-proposal' },
      { title: 'IRB coordination for {customer}', desc: 'Coordinate IRB review for {customer}.', workflow: 'grant-proposal' },
      { title: 'Subaward processing for {customer}', desc: 'Process subaward for {customer} grant.', workflow: 'grant-proposal' }
    ]
  }
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const PRESETS_BY_KEY = {};
const PRESETS_BY_VERTICAL = {};

for (const preset of STORYLINE_PRESETS) {
  PRESETS_BY_KEY[preset.key] = preset;
  if (!PRESETS_BY_VERTICAL[preset.vertical]) {
    PRESETS_BY_VERTICAL[preset.vertical] = [];
  }
  PRESETS_BY_VERTICAL[preset.vertical].push(preset);
}

/**
 * Build a full instance config from a preset, with optional overrides.
 */
function buildConfigFromPreset(preset, overrides = {}) {
  const name = overrides.companyName || preset.portalName;
  const brandColor = overrides.brandColor || preset.brandColor;
  const terminology = overrides.terminology
    ? { ...preset.terminology, ...overrides.terminology }
    : { ...preset.terminology };

  return {
    metadata: {
      name,
      vertical: preset.vertical,
      description: `${name} — ${preset.title} demo portal`,
      presetKey: preset.key
    },
    branding: { color: brandColor, logo: null },
    terminology: { portalName: name, ...terminology },
    docusign: {
      userId: '', accountId: '',
      scopes: 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read',
      baseUrl: 'https://api-d.docusign.com'
    },
    workflows: { onboardingId: '', maintenanceId: '' },
    kpis: preset.kpis,
    agreements: preset.agreements,
    advisorId: '',
    defaultMode: 'advanced',
    iamProducts: ALL_IAM_PRODUCTS.map(p => ({ ...p })),
    defaultIamProducts: preset.highlightedProducts || null,
    maestro: { publisherName: name, publisherEmail: '', publisherPhone: '' }
  };
}

/**
 * Build seed profile data from a preset's seed descriptor.
 */
function buildProfileFromPreset(preset, slug) {
  const desc = SEED_DESCRIPTORS[preset.key];
  if (!desc) return null;
  return buildProfileFromDescriptor(desc, slug);
}

/**
 * Validate a config object has the required shape for rendering.
 */
function validateConfig(config) {
  const errors = [];
  if (!config?.metadata?.name) errors.push('metadata.name is required');
  if (!config?.metadata?.vertical) errors.push('metadata.vertical is required');
  if (!config?.terminology?.advisorRole) errors.push('terminology.advisorRole is required');
  if (!Array.isArray(config?.kpis?.advisor)) errors.push('kpis.advisor must be an array');
  if (!Array.isArray(config?.agreements?.taxonomy)) errors.push('agreements.taxonomy must be an array');
  if (errors.length > 0) {
    const err = new Error(`Invalid config: ${errors.join('; ')}`);
    err.status = 400;
    throw err;
  }
}

module.exports = {
  VERTICALS,
  STORYLINE_PRESETS,
  PRESETS_BY_KEY,
  PRESETS_BY_VERTICAL,
  SEED_DESCRIPTORS,
  buildConfigFromPreset,
  buildProfileFromPreset,
  buildProfileFromDescriptor,
  validateConfig,
  account,
  envelope,
  task
};
