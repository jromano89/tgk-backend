const BASE_URL = String(process.env.TGK_SEED_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Parse --instance=slug from CLI args, fall back to env var, then default
const instanceArg = process.argv.find(a => a.startsWith('--instance='));
const APP_SLUG = instanceArg
  ? instanceArg.split('=')[1]
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
// Seed profiles — each profile provides employees, customers, envelopes, tasks
// ---------------------------------------------------------------------------

const PROFILES = {
  'tgk-wealth': buildWealthProfile,
  'medflow-health': buildHealthcareProfile
};

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
