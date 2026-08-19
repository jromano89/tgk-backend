const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { config } = require('./config');

const TABLE_DEFINITIONS = {
  employees: {
    createSql: `
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        phone TEXT,
        title TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  customers: {
    createSql: `
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        display_name TEXT,
        email TEXT,
        phone TEXT,
        organization TEXT,
        status TEXT DEFAULT 'active',
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  transactions: {
    createSql: `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        type TEXT DEFAULT 'envelope',
        status TEXT DEFAULT 'created',
        name TEXT,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  tasks: {
    createSql: `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        due_at DATETIME,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  quotes: {
    createSql: `
      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
        quote_number TEXT,
        name TEXT,
        status TEXT DEFAULT 'draft',
        total REAL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  quoteLineItems: {
    createSql: `
      CREATE TABLE IF NOT EXISTS quote_line_items (
        id TEXT PRIMARY KEY,
        app_slug TEXT NOT NULL,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        name TEXT,
        description TEXT,
        quantity REAL DEFAULT 1,
        unit_price REAL,
        total REAL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
};

const INDEX_SCHEMA = `
  CREATE INDEX IF NOT EXISTS idx_employees_app_slug ON employees(app_slug);
  CREATE INDEX IF NOT EXISTS idx_customers_app_slug ON customers(app_slug);
  CREATE INDEX IF NOT EXISTS idx_customers_app_slug_status ON customers(app_slug, status);
  CREATE INDEX IF NOT EXISTS idx_customers_app_slug_employee ON customers(app_slug, employee_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_app_slug ON transactions(app_slug);
  CREATE INDEX IF NOT EXISTS idx_transactions_app_slug_customer ON transactions(app_slug, customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_app_slug_employee ON transactions(app_slug, employee_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_app_slug_type ON transactions(app_slug, type);
  CREATE INDEX IF NOT EXISTS idx_tasks_app_slug ON tasks(app_slug);
  CREATE INDEX IF NOT EXISTS idx_tasks_app_slug_customer ON tasks(app_slug, customer_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_app_slug_employee ON tasks(app_slug, employee_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_quotes_app_slug ON quotes(app_slug);
  CREATE INDEX IF NOT EXISTS idx_quotes_app_slug_customer ON quotes(app_slug, customer_id);
  CREATE INDEX IF NOT EXISTS idx_quotes_app_slug_status ON quotes(app_slug, status);
  CREATE INDEX IF NOT EXISTS idx_quotes_app_slug_number ON quotes(app_slug, quote_number);
  CREATE INDEX IF NOT EXISTS idx_quote_line_items_app_slug ON quote_line_items(app_slug);
  CREATE INDEX IF NOT EXISTS idx_quote_line_items_app_slug_quote ON quote_line_items(app_slug, quote_id);
`;

const SCHEMA = `${Object.values(TABLE_DEFINITIONS).map((definition) => definition.createSql).join(';\n')};\n${INDEX_SCHEMA}`;

let db;
let activeDbPath = null;
let activeConfiguredDbPath = null;

function resolveConfiguredDbPath() {
  return config.database.path;
}

function getDbPath() {
  return activeDbPath || resolveConfiguredDbPath();
}

function initializeDb(dbPath) {
  const dbDir = path.dirname(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  const nextDb = new Database(dbPath);
  nextDb.pragma('journal_mode = WAL');
  nextDb.pragma('foreign_keys = ON');
  nextDb.exec(SCHEMA);
  return nextDb;
}

function getDb() {
  const configuredDbPath = resolveConfiguredDbPath();
  if (db && activeConfiguredDbPath === configuredDbPath) {
    return db;
  }

  if (db) {
    db.close();
  }

  try {
    db = initializeDb(configuredDbPath);
  } catch (error) {
    throw new Error(`Unable to initialize SQLite database at ${configuredDbPath}: ${error.message}`, { cause: error });
  }

  activeDbPath = configuredDbPath;
  activeConfiguredDbPath = configuredDbPath;

  return db;
}

function closeDb() {
  if (!db) {
    return;
  }

  db.close();
  db = null;
  activeDbPath = null;
  activeConfiguredDbPath = null;
}

module.exports = {
  closeDb,
  getDb,
  getDbPath
};
