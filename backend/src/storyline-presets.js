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

// Lookup helpers
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

module.exports = {
  VERTICALS,
  STORYLINE_PRESETS,
  PRESETS_BY_KEY,
  PRESETS_BY_VERTICAL,
  buildConfigFromPreset
};
