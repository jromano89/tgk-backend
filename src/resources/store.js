const { asObject, createError, parseJsonFields, serializeJson } = require('../utils');

function parseRecord(row) {
  if (!row) {
    return row;
  }

  const parsed = parseJsonFields(row);
  return {
    ...parsed,
    data: asObject(parsed.data)
  };
}

function buildListQuery(table, appSlug, options = {}) {
  const conditions = options.conditions || [];
  const params = options.params || [];
  const orderBy = options.orderBy || 'created_at DESC';
  const whereClause = conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';

  return {
    query: `SELECT * FROM ${table} WHERE app_slug = ?${whereClause} ORDER BY ${orderBy}`,
    params: [appSlug, ...params]
  };
}

function buildUpdate(table, recordId, appSlug, fields) {
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return null;
  }

  const assignments = entries.map(([column]) => `${column} = ?`);
  const values = entries.map(([, value]) => value);
  assignments.push('updated_at = CURRENT_TIMESTAMP');

  return {
    query: `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ? AND app_slug = ?`,
    params: [...values, recordId, appSlug]
  };
}

function readColumnValue(columnName, record) {
  const value = record[columnName];

  if (columnName === 'data') {
    return serializeJson(asObject(value));
  }

  return value ?? null;
}

function getRecord(db, table, appSlug, recordId, parser = parseRecord) {
  return parser(
    db.prepare(`SELECT * FROM ${table} WHERE id = ? AND app_slug = ?`).get(recordId, appSlug)
  );
}

function getRecordById(db, table, recordId, parser = parseRecord) {
  return parser(
    db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(recordId)
  );
}

function requireRecord(db, table, appSlug, recordId, label, parser = parseRecord) {
  const record = getRecord(db, table, appSlug, recordId, parser);
  if (!record) {
    throw createError(404, `${label} not found`);
  }

  return record;
}

function ensureRecordBelongsToApp(db, table, appSlug, recordId, label) {
  if (!recordId) {
    return null;
  }

  const record = getRecord(db, table, appSlug, recordId);
  if (!record) {
    throw createError(400, `${label} must belong to the current app`);
  }

  return record;
}

function listRecords(db, resource, appSlug, options = {}) {
  const { query, params } = buildListQuery(resource.table, appSlug, options);
  return db.prepare(query).all(...params).map(parseRecord);
}

function createRecord(db, resource, appSlug, record) {
  const columns = ['id', 'app_slug', ...resource.columns, 'created_at', 'updated_at'];
  const placeholders = columns.map(() => '?').join(', ');
  const timestamp = new Date().toISOString();
  const params = [
    record.id,
    appSlug,
    ...resource.columns.map((column) => readColumnValue(column, record)),
    record.created_at || timestamp,
    record.updated_at || record.created_at || timestamp
  ];

  db.prepare(`
    INSERT INTO ${resource.table} (${columns.join(', ')})
    VALUES (${placeholders})
  `).run(...params);

  return getRecord(db, resource.table, appSlug, record.id);
}

function updateRecord(db, resource, appSlug, recordId, record) {
  const statement = buildUpdate(
    resource.table,
    recordId,
    appSlug,
    Object.fromEntries(resource.columns.map((column) => [column, column === 'data' && record.data !== undefined
      ? readColumnValue(column, record)
      : record[column]
    ]))
  );

  if (statement) {
    db.prepare(statement.query).run(...statement.params);
  }

  return getRecord(db, resource.table, appSlug, recordId);
}

function deleteRecord(db, resource, appSlug, recordId) {
  db.prepare(`DELETE FROM ${resource.table} WHERE id = ? AND app_slug = ?`).run(recordId, appSlug);
}

module.exports = {
  createRecord,
  deleteRecord,
  ensureRecordBelongsToApp,
  getRecord,
  getRecordById,
  listRecords,
  parseRecord,
  requireRecord,
  updateRecord
};
