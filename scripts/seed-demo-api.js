const BASE_URL = String(process.env.TGK_SEED_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Parse --instance=slug or --preset=key from CLI args
const instanceArg = process.argv.find(a => a.startsWith('--instance='));
const presetArg = process.argv.find(a => a.startsWith('--preset='));
const APP_SLUG = instanceArg
  ? instanceArg.split('=')[1]
  : presetArg
    ? presetArg.split('=')[1]
    : (process.env.TGK_SEED_APP_SLUG || 'tgk-wealth');

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Demo-App': APP_SLUG
};

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

function customerAum(customer) {
  return (customer.data?.accounts || []).reduce((sum, accountRecord) => {
    const value = Number(accountRecord.value || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function envelope(id, employeeId, customerId, status, name) {
  return { id, employeeId, customerId, status, name };
}
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

// ---------------------------------------------------------------------------
// Compact seed descriptor → full profile factory
// ---------------------------------------------------------------------------

function buildProfileFromDescriptor(desc) {
  const employees = desc.employees.map((e, i) => ({
    id: `${desc.prefix}-emp-${String(i + 1).padStart(3, '0')}`,
    displayName: e.name,
    email: e.email,
    phone: e.phone,
    title: e.title
  }));

  const customers = desc.customers.map((c, i) => {
    const empIdx = i % employees.length;
    const custId = `${desc.prefix}-cust-${String(i + 1).padStart(3, '0')}`;
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
      `${desc.prefix}-env-${String(i + 1).padStart(3, '0')}`,
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
      `${desc.prefix}-task-${String(i + 1).padStart(3, '0')}`,
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
// 15 Seed descriptors
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
      { name: 'Barry Bull', email: 'barry@bullmarketgroup.com', phone: '(347) 555-0115', org: 'Bull Market Group', status: 'pending', risk: 'Growth', value: 12300000, netWorth: 27200000, changePct: 0.013, accounts: [{ name: 'Founder Liquidity Account', type: 'Brokerage', value: 7300000, ytd: 0.058, eq: 57, fi: 12, alt: 16, cash: 15 }, { name: 'Short Duration Reserve', type: 'Cash Management', value: 5000000, ytd: 0.021, eq: 0, fi: 28, alt: 0, cash: 72, extra: { status: 'pending' } }] },
      { name: 'Penny Worth', email: 'penny@compoundinterestpartners.com', phone: '(646) 555-0118', org: 'Compound Interest Partners', status: 'active', risk: 'Moderate Growth', value: 16800000, netWorth: 36200000, changePct: 0.022, accounts: [{ name: 'Strategic Growth Portfolio', type: 'Brokerage', value: 9900000, ytd: 0.074, eq: 49, fi: 14, alt: 25, cash: 12 }, { name: 'Private Credit Reserve', type: 'Alternative', value: 6900000, ytd: 0.056, eq: 10, fi: 33, alt: 45, cash: 12 }] },
      { name: 'Paige Turner', email: 'paige@turnkeycapital.co', phone: '(917) 555-0119', org: 'Turnkey Capital', status: 'active', risk: 'Income Plus', value: 8400000, netWorth: 19100000, changePct: 0.017, accounts: [{ name: 'Dividend Core Strategy', type: 'Brokerage', value: 4600000, ytd: 0.049, eq: 32, fi: 41, alt: 12, cash: 15 }, { name: 'Estate Liquidity Reserve', type: 'Trust', value: 3800000, ytd: 0.028, eq: 12, fi: 48, alt: 8, cash: 32 }] }
    ],
    envelopes: [
      { name: 'Account Opening Packet', status: 'completed' },
      { name: 'Transfer Authorization', status: 'sent' },
      { name: 'Beneficiary Update', status: 'completed' },
      { name: 'ACAT Transfer Packet', status: 'delivered' },
      { name: 'Wire Authorization Update', status: 'completed' },
      { name: 'Account Opening Packet', status: 'completed' }
    ],
    tasks: [
      { title: 'Asset transfer for {customer}', desc: 'Launch the asset transfer workflow for {customer}.' },
      { title: 'Account setup for {customer}', desc: 'Complete account setup for {customer}.' },
      { title: 'KYC review for {customer}', desc: 'Complete KYC review for {customer}.' },
      { title: 'Suitability review for {customer}', desc: 'Review suitability questionnaire for {customer}.' },
      { title: 'Transfer processing for {customer}', desc: 'Process asset transfer for {customer}.' }
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
      { name: 'Patrick O\'Brien', email: 'p.obrien@email.com', phone: '(602) 555-0204', org: 'FHA Purchase', status: 'active', value: 275000, nextDate: 'Apr 22, 2026', accounts: [{ name: 'FHA 30-Year', type: 'Mortgage', value: 275000, fi: 100 }] }
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
// Seed profiles — each profile provides employees, customers, envelopes, tasks
// ---------------------------------------------------------------------------

const PROFILES = {
  'tgk-wealth': buildWealthProfile,
  'medflow-health': buildHealthcareProfile
};

// Register all seed descriptors as profiles
for (const [key, desc] of Object.entries(SEED_DESCRIPTORS)) {
  PROFILES[key] = () => buildProfileFromDescriptor(desc);
}

function buildWealthProfile() {
  const employees = [
    {
      id: '4871abfa-8868-4501-b068-5936c6363e6b',
      displayName: 'Gordon Gecko',
      email: 'g.gecko@tgkwealth.com',
      phone: '(212) 555-0100',
      title: 'Senior Advisor'
    },
    {
      id: '0cb0b7b2-78db-4e38-9c14-d665bbbe8ad9',
      displayName: 'Serena Blake',
      email: 's.blake@tgkwealth.com',
      phone: '(212) 555-0144',
      title: 'Private Wealth Advisor'
    }
  ];

  const customers = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      employeeId: employees[0].id,
      displayName: 'Anita Margin',
      email: 'anita.margin@margincallventures.com',
      phone: '(917) 555-0111',
      organization: 'Margin Call Ventures',
      status: 'review',
      data: {
        riskProfile: 'Balanced Growth',
        value: 9600000, netWorth: 21700000, changePct: 0.028,
        accounts: [
          account('acct-amina-1', 'Global Growth Portfolio', 'Brokerage', 6100000, 0.083, { equity: 61, fixed: 15, alt: 18, cash: 6 }),
          account('acct-amina-2', 'Impact Reserve', 'Trust', 3500000, 0.051, { equity: 34, fixed: 32, alt: 20, cash: 14 })
        ]
      }
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      employeeId: employees[1].id,
      displayName: 'Robin Banks',
      email: 'robin@vaultstreetholdings.com',
      phone: '(646) 555-0112',
      organization: 'Vault Street Holdings',
      status: 'active',
      data: {
        riskProfile: 'Moderate',
        value: 10800000, netWorth: 24300000, changePct: 0.019,
        accounts: [
          account('acct-camila-1', 'Family Opportunity Account', 'Brokerage', 6800000, 0.072, { equity: 52, fixed: 22, alt: 16, cash: 10 }),
          account('acct-camila-2', 'Municipal Income Sleeve', 'Trust', 4000000, 0.039, { equity: 16, fixed: 61, alt: 8, cash: 15 })
        ]
      }
    },
    {
      id: '55555555-5555-4555-8555-555555555555',
      employeeId: employees[0].id,
      displayName: 'Barry Bull',
      email: 'barry@bullmarketgroup.com',
      phone: '(347) 555-0115',
      organization: 'Bull Market Group',
      status: 'pending',
      data: {
        riskProfile: 'Growth',
        value: 12300000, netWorth: 27200000, changePct: 0.013,
        accounts: [
          account('acct-julian-1', 'Founder Liquidity Account', 'Brokerage', 7300000, 0.058, { equity: 57, fixed: 12, alt: 16, cash: 15 }),
          account('acct-julian-2', 'Short Duration Reserve', 'Cash Management', 5000000, 0.021, { equity: 0, fixed: 28, alt: 0, cash: 72 }, { status: 'pending' })
        ]
      }
    },
    {
      id: '88888888-8888-4888-8888-888888888888',
      employeeId: employees[1].id,
      displayName: 'Penny Worth',
      email: 'penny@compoundinterestpartners.com',
      phone: '(646) 555-0118',
      organization: 'Compound Interest Partners',
      status: 'active',
      data: {
        riskProfile: 'Moderate Growth',
        value: 16800000, netWorth: 36200000, changePct: 0.022,
        accounts: [
          account('acct-victor-1', 'Strategic Growth Portfolio', 'Brokerage', 9900000, 0.074, { equity: 49, fixed: 14, alt: 25, cash: 12 }),
          account('acct-victor-2', 'Private Credit Reserve', 'Alternative', 6900000, 0.056, { equity: 10, fixed: 33, alt: 45, cash: 12 })
        ]
      }
    },
    {
      id: '99999999-9999-4999-8999-999999999999',
      employeeId: employees[0].id,
      displayName: 'Paige Turner',
      email: 'paige@turnkeycapital.co',
      phone: '(917) 555-0119',
      organization: 'Turnkey Capital',
      status: 'active',
      data: {
        riskProfile: 'Income Plus',
        value: 8400000, netWorth: 19100000, changePct: 0.017,
        accounts: [
          account('acct-paige-1', 'Dividend Core Strategy', 'Brokerage', 4600000, 0.049, { equity: 32, fixed: 41, alt: 12, cash: 15 }),
          account('acct-paige-2', 'Estate Liquidity Reserve', 'Trust', 3800000, 0.028, { equity: 12, fixed: 48, alt: 8, cash: 32 })
        ]
      }
    }
  ];

  const envelopes = [
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1011', employees[0].id, customers[0].id, 'completed', 'Account Opening Packet'),
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1012', employees[1].id, customers[1].id, 'sent', 'Transfer Authorization'),
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1013', employees[0].id, customers[0].id, 'completed', 'Beneficiary Update'),
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1014', employees[0].id, customers[2].id, 'delivered', 'ACAT Transfer Packet'),
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1015', employees[1].id, customers[3].id, 'completed', 'Wire Authorization Update'),
    envelope('6a0478f8-0d95-4a12-8e76-3fb7ca0a1016', employees[1].id, customers[3].id, 'completed', 'Account Opening Packet')
  ];

  const tasks = customers.map((customer, index) => {
    const seq = String(index + 1).padStart(3, '0');
    return task(
      `ec52a1b8-2e88-4b85-8b4d-8e9cda92d${seq}`,
      customer.employeeId, customer.id,
      `Asset transfer for ${customer.displayName}`,
      `Launch the asset transfer workflow for ${customer.displayName}.`
    );
  });

  return { employees, customers, envelopes, tasks };
}

function buildHealthcareProfile() {
  const employees = [
    {
      id: 'hc-emp-001',
      displayName: 'Dr. Sarah Chen',
      email: 's.chen@medflowhealth.com',
      phone: '(415) 555-0201',
      title: 'Lead Care Coordinator'
    },
    {
      id: 'hc-emp-002',
      displayName: 'Marcus Rivera',
      email: 'm.rivera@medflowhealth.com',
      phone: '(415) 555-0202',
      title: 'Patient Services Coordinator'
    }
  ];

  const customers = [
    {
      id: 'hc-pat-001',
      employeeId: employees[0].id,
      displayName: 'James Mitchell',
      email: 'j.mitchell@email.com',
      phone: '(510) 555-0301',
      organization: 'Primary Care',
      status: 'active',
      data: {
        riskProfile: 'Low',
        value: 4200, netWorth: 0, changePct: 0,
        nextAppointment: 'Apr 15, 2026',
        accounts: [
          account('hc-acct-001', 'Current Treatment Plan', 'Medical', 2800, 0, { equity: 0, fixed: 100, alt: 0, cash: 0 }),
          account('hc-acct-002', 'Lab & Diagnostics', 'Lab', 1400, 0, { equity: 0, fixed: 0, alt: 100, cash: 0 })
        ]
      }
    },
    {
      id: 'hc-pat-002',
      employeeId: employees[1].id,
      displayName: 'Maria Santos',
      email: 'm.santos@email.com',
      phone: '(510) 555-0302',
      organization: 'Cardiology',
      status: 'active',
      data: {
        riskProfile: 'Medium',
        value: 8900, netWorth: 0, changePct: 0,
        nextAppointment: 'Apr 22, 2026',
        accounts: [
          account('hc-acct-003', 'Cardiology Treatment', 'Medical', 6200, 0, { equity: 0, fixed: 100, alt: 0, cash: 0 }),
          account('hc-acct-004', 'Prescription Plan', 'Pharmacy', 2700, 0, { equity: 0, fixed: 0, alt: 100, cash: 0 })
        ]
      }
    },
    {
      id: 'hc-pat-003',
      employeeId: employees[0].id,
      displayName: 'Robert Kim',
      email: 'r.kim@email.com',
      phone: '(510) 555-0303',
      organization: 'Orthopedics',
      status: 'pending',
      data: {
        riskProfile: 'High',
        value: 15600, netWorth: 0, changePct: 0,
        nextAppointment: 'Apr 10, 2026',
        accounts: [
          account('hc-acct-005', 'Surgical Plan', 'Medical', 12000, 0, { equity: 0, fixed: 100, alt: 0, cash: 0 }),
          account('hc-acct-006', 'Rehabilitation', 'Therapy', 3600, 0, { equity: 0, fixed: 0, alt: 100, cash: 0 })
        ]
      }
    },
    {
      id: 'hc-pat-004',
      employeeId: employees[1].id,
      displayName: 'Linda Patel',
      email: 'l.patel@email.com',
      phone: '(510) 555-0304',
      organization: 'Endocrinology',
      status: 'review',
      data: {
        riskProfile: 'Medium',
        value: 3100, netWorth: 0, changePct: 0,
        nextAppointment: 'May 1, 2026',
        accounts: [
          account('hc-acct-007', 'Ongoing Treatment', 'Medical', 2100, 0, { equity: 0, fixed: 100, alt: 0, cash: 0 }),
          account('hc-acct-008', 'Lab Monitoring', 'Lab', 1000, 0, { equity: 0, fixed: 0, alt: 100, cash: 0 })
        ]
      }
    }
  ];

  const envelopes = [
    envelope('hc-env-001', employees[0].id, customers[0].id, 'completed', 'Patient Intake Form'),
    envelope('hc-env-002', employees[1].id, customers[1].id, 'completed', 'HIPAA Consent'),
    envelope('hc-env-003', employees[0].id, customers[2].id, 'sent', 'Records Transfer Request'),
    envelope('hc-env-004', employees[1].id, customers[3].id, 'delivered', 'Insurance Authorization'),
    envelope('hc-env-005', employees[0].id, customers[0].id, 'completed', 'Treatment Plan Agreement')
  ];

  const tasks = customers.map((customer, index) => {
    const seq = String(index + 1).padStart(3, '0');
    return task(
      `hc-task-${seq}`,
      customer.employeeId, customer.id,
      `Records transfer for ${customer.displayName}`,
      `Initiate records transfer workflow for ${customer.displayName}.`,
      { workflow: 'asset-transfer' }
    );
  });

  return { employees, customers, envelopes, tasks };
}

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
    ...options
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    payload = text;
  }

  if (!response.ok) {
    const error = new Error(`${response.status} ${path} ${JSON.stringify(payload)}`);
    error.status = response.status;
    error.path = path;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function upsertRecord(collectionPath, record) {
  const itemPath = `${collectionPath}/${encodeURIComponent(record.id)}`;

  try {
    return await request(collectionPath, { method: 'POST', body: JSON.stringify(record) });
  } catch (error) {
    const message = String(error?.message || '');
    const isDuplicate = error?.status === 409
      || (error?.status === 500 && /UNIQUE constraint failed|constraint failed/i.test(message));

    if (!isDuplicate) {
      throw error;
    }
  }

  return request(itemPath, { method: 'PUT', body: JSON.stringify(record) });
}

async function main() {
  const profileBuilder = PROFILES[APP_SLUG];
  if (!profileBuilder) {
    console.log(`No built-in seed profile for "${APP_SLUG}". Available: ${Object.keys(PROFILES).join(', ')}`);
    console.log('Seeding with wealth profile as fallback.');
  }
  const profile = (profileBuilder || buildWealthProfile)();

  console.log(`Seeding ${APP_SLUG} at ${BASE_URL}...`);

  for (const employee of profile.employees) {
    await upsertRecord('/api/data/employees', employee);
  }

  for (const customer of profile.customers) {
    await upsertRecord('/api/data/customers', customer);
  }

  for (const envelopeRecord of profile.envelopes) {
    await upsertRecord('/api/data/envelopes', envelopeRecord);
  }

  for (const taskRecord of profile.tasks) {
    await upsertRecord('/api/data/tasks', taskRecord);
  }

  const [seededEmployees, seededCustomers, seededTasks, seededEnvelopes] = await Promise.all([
    request('/api/data/employees'),
    request('/api/data/customers'),
    request('/api/data/tasks'),
    request('/api/data/envelopes')
  ]);

  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    appSlug: APP_SLUG,
    employees: seededEmployees.length,
    customers: seededCustomers.length,
    tasks: seededTasks.length,
    envelopes: seededEnvelopes.length,
    totalAum: seededCustomers.reduce((sum, customer) => sum + customerAum(customer), 0)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
