const BASE_URL = String(process.env.TGK_SEED_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const APP_SLUG = process.env.TGK_SEED_APP_SLUG || 'tgk-wealth';

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

function transaction(id, employeeId, customerId, type, status, name) {
  return {
    id,
    employeeId,
    customerId,
    type,
    status,
    name
  };
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
      workflow: 'asset-transfer',
      ...extra.data
    }
  };
}

function buildAssetTransferTask(customer, index) {
  const sequence = String(index + 1).padStart(3, '0');
  const displayName = String(customer.displayName || `Investor ${index + 1}`).trim();

  return task(
    `ec52a1b8-2e88-4b85-8b4d-8e9cda92d${sequence}`,
    customer.employeeId,
    customer.id,
    `Asset transfer for ${displayName}`,
    `Launch the asset transfer workflow for ${displayName}.`
  );
}

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
      netWorth: 21700000,
      changePct: 0.028,
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
      netWorth: 24300000,
      changePct: 0.019,
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
      netWorth: 27200000,
      changePct: 0.013,
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
      netWorth: 36200000,
      changePct: 0.022,
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
      netWorth: 19100000,
      changePct: 0.017,
      accounts: [
        account('acct-paige-1', 'Dividend Core Strategy', 'Brokerage', 4600000, 0.049, { equity: 32, fixed: 41, alt: 12, cash: 15 }),
        account('acct-paige-2', 'Estate Liquidity Reserve', 'Trust', 3800000, 0.028, { equity: 12, fixed: 48, alt: 8, cash: 32 })
      ]
    }
  }
];

const transactions = [
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1011', employees[0].id, customers[0].id, 'envelope', 'completed', 'Account Opening Packet'),
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1012', employees[1].id, customers[1].id, 'envelope', 'sent', 'Transfer Authorization'),
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1013', employees[0].id, customers[0].id, 'envelope', 'completed', 'Beneficiary Update'),
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1014', employees[0].id, customers[2].id, 'envelope', 'delivered', 'ACAT Transfer Packet'),
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1015', employees[1].id, customers[3].id, 'envelope', 'completed', 'Wire Authorization Update'),
  transaction('6a0478f8-0d95-4a12-8e76-3fb7ca0a1016', employees[1].id, customers[3].id, 'envelope', 'completed', 'Account Opening Packet')
];

const tasks = customers.map(buildAssetTransferTask);

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
  for (const employee of employees) {
    await upsertRecord('/api/data/employees', employee);
  }

  for (const customer of customers) {
    await upsertRecord('/api/data/customers', customer);
  }

  for (const transactionRecord of transactions) {
    await upsertRecord('/api/data/transactions', transactionRecord);
  }

  for (const taskRecord of tasks) {
    await upsertRecord('/api/data/tasks', taskRecord);
  }

  const [seededEmployees, seededCustomers, seededTasks, seededTransactions] = await Promise.all([
    request('/api/data/employees'),
    request('/api/data/customers'),
    request('/api/data/tasks'),
    request('/api/data/transactions')
  ]);

  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    appSlug: APP_SLUG,
    employees: seededEmployees.length,
    customers: seededCustomers.length,
    tasks: seededTasks.length,
    transactions: seededTransactions.length,
    totalAum: seededCustomers.reduce((sum, customer) => sum + customerAum(customer), 0)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
