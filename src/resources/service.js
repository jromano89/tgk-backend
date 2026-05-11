const { randomUUID } = require('crypto');
const { publishDataChange } = require('../data-events');
const store = require('./store');
const { serializeRecord, serializeRecords } = require('./serializers');
const { asObject, createError, normalizeOptionalString } = require('../utils');

function normalizeRequiredText(value, label) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw createError(400, `Missing ${label}`);
  }

  return normalized;
}

function normalizeOptionalDate(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const normalized = new Date(value);
  if (Number.isNaN(normalized.valueOf())) {
    throw createError(400, 'Invalid date value');
  }

  return normalized.toISOString();
}

function normalizeOptionalPhone(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || null;
  }

  if (value && typeof value === 'object') {
    return normalizeOptionalString(value.number || value.normalizedNumber || value.phone);
  }

  return normalizeOptionalString(value);
}

function mergeData(existingData, nextData) {
  if (nextData === undefined) {
    return undefined;
  }

  if (nextData === null) {
    return {};
  }

  return {
    ...asObject(existingData),
    ...asObject(nextData)
  };
}

function deriveDisplayName({ displayName, email, organization, id }) {
  const explicit = normalizeOptionalString(displayName);
  if (explicit) {
    return explicit;
  }

  return normalizeOptionalString(email)
    || normalizeOptionalString(organization)
    || normalizeOptionalString(id)
    || null;
}

function resolveReference(db, appSlug, value, table, label) {
  const id = normalizeOptionalString(value);
  if (!id) {
    return null;
  }

  return store.ensureRecordBelongsToApp(db, table, appSlug, id, label).id;
}

function buildTextSearch(columns, search) {
  if (!search) {
    return { conditions: [], params: [] };
  }

  const likePattern = `%${search}%`;
  return {
    conditions: [`(${columns.map((column) => `${column} LIKE ?`).join(' OR ')})`],
    params: columns.map(() => likePattern)
  };
}

function buildEqualityFilters(filters = {}, fieldMap = {}) {
  const conditions = [];
  const params = [];

  Object.entries(fieldMap).forEach(([filterKey, column]) => {
    if (!filters[filterKey]) {
      return;
    }

    conditions.push(`${column} = ?`);
    params.push(filters[filterKey]);
  });

  return { conditions, params };
}

function combineListOptions(...optionsList) {
  return optionsList.reduce((combined, options) => ({
    conditions: [...combined.conditions, ...(options?.conditions || [])],
    params: [...combined.params, ...(options?.params || [])]
  }), {
    conditions: [],
    params: []
  });
}

function withTimestamps(record) {
  const timestamp = new Date().toISOString();
  return {
    ...record,
    created_at: record.created_at || timestamp,
    updated_at: record.updated_at || record.created_at || timestamp
  };
}

function normalizeEmployeeWrite({ existingRecord, input = {} }) {
  const id = input.id || existingRecord?.id || randomUUID();
  const data = mergeData(existingRecord?.data, input.data);
  const email = normalizeOptionalString(input.email !== undefined ? input.email : existingRecord?.email);
  const title = normalizeOptionalString(input.title !== undefined ? input.title : existingRecord?.title);
  const displayName = deriveDisplayName({
    displayName: input.displayName !== undefined ? input.displayName : existingRecord?.display_name,
    email,
    organization: title,
    id
  });

  return {
    id,
    display_name: displayName,
    email: input.email !== undefined ? normalizeOptionalString(input.email) : undefined,
    phone: input.phone !== undefined ? normalizeOptionalPhone(input.phone) : undefined,
    title: input.title !== undefined ? normalizeOptionalString(input.title) : undefined,
    data,
    created_at: input.createdAt !== undefined ? normalizeOptionalDate(input.createdAt) : undefined
  };
}

function normalizeCustomerWrite({ db, appSlug, existingRecord, input = {} }) {
  const id = input.id || existingRecord?.id || randomUUID();
  const data = mergeData(existingRecord?.data, input.data);
  const email = normalizeOptionalString(input.email !== undefined ? input.email : existingRecord?.email);
  const organization = normalizeOptionalString(input.organization !== undefined ? input.organization : existingRecord?.organization);
  const displayName = deriveDisplayName({
    displayName: input.displayName !== undefined ? input.displayName : existingRecord?.display_name,
    email,
    organization,
    id
  });

  return {
    id,
    employee_id: input.employeeId !== undefined
      ? resolveReference(db, appSlug, input.employeeId, 'employees', 'employeeId')
      : undefined,
    display_name: displayName,
    email: input.email !== undefined ? normalizeOptionalString(input.email) : undefined,
    phone: input.phone !== undefined ? normalizeOptionalPhone(input.phone) : undefined,
    organization: input.organization !== undefined ? normalizeOptionalString(input.organization) : undefined,
    status: input.status !== undefined ? normalizeOptionalString(input.status) : undefined,
    data,
    created_at: input.createdAt !== undefined ? normalizeOptionalDate(input.createdAt) : undefined
  };
}

function normalizeTransactionWrite({ db, appSlug, existingRecord, input = {} }) {
  const isCreate = !existingRecord;

  return {
    id: existingRecord?.id || normalizeRequiredText(input.id, 'transaction id'),
    employee_id: input.employeeId !== undefined
      ? resolveReference(db, appSlug, input.employeeId, 'employees', 'employeeId')
      : undefined,
    customer_id: input.customerId !== undefined
      ? resolveReference(db, appSlug, input.customerId, 'customers', 'customerId')
      : undefined,
    type: input.type !== undefined
      ? (normalizeOptionalString(input.type) || 'envelope')
      : (isCreate ? 'envelope' : undefined),
    status: input.status !== undefined ? normalizeOptionalString(input.status) : undefined,
    name: input.name !== undefined ? normalizeOptionalString(input.name) : undefined,
    data: mergeData(existingRecord?.data, input.data),
    created_at: input.createdAt !== undefined ? normalizeOptionalDate(input.createdAt) : undefined
  };
}

function normalizeTaskWrite({ db, appSlug, existingRecord, input = {} }) {
  return {
    id: input.id || existingRecord?.id || randomUUID(),
    employee_id: input.employeeId !== undefined
      ? resolveReference(db, appSlug, input.employeeId, 'employees', 'employeeId')
      : undefined,
    customer_id: input.customerId !== undefined
      ? resolveReference(db, appSlug, input.customerId, 'customers', 'customerId')
      : undefined,
    title: input.title !== undefined ? normalizeOptionalString(input.title) : undefined,
    description: input.description !== undefined ? normalizeOptionalString(input.description) : undefined,
    status: input.status !== undefined ? normalizeOptionalString(input.status) : undefined,
    due_at: input.dueAt !== undefined ? normalizeOptionalDate(input.dueAt) : undefined,
    data: mergeData(existingRecord?.data, input.data),
    created_at: input.createdAt !== undefined ? normalizeOptionalDate(input.createdAt) : undefined
  };
}

const RESOURCE_DEFINITIONS = {
  employees: {
    table: 'employees',
    label: 'Employee',
    columns: ['display_name', 'email', 'phone', 'title', 'data'],
    orderBy: 'COALESCE(display_name, email, title, id) COLLATE NOCASE ASC',
    buildListOptions(filters = {}) {
      return buildTextSearch(['display_name', 'email', 'title', 'id'], filters.search);
    },
    normalizeWrite: normalizeEmployeeWrite
  },
  customers: {
    table: 'customers',
    label: 'Customer',
    columns: ['employee_id', 'display_name', 'email', 'phone', 'organization', 'status', 'data'],
    orderBy: 'COALESCE(display_name, email, organization, id) COLLATE NOCASE ASC',
    buildListOptions(filters = {}) {
      return combineListOptions(
        buildEqualityFilters(filters, {
          status: 'status',
          employeeId: 'employee_id'
        }),
        buildTextSearch(['display_name', 'email', 'organization', 'id'], filters.search)
      );
    },
    normalizeWrite: normalizeCustomerWrite,
    allowDelete: true,
    beforeDelete(db, appSlug, recordId) {
      db.prepare('UPDATE transactions SET customer_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE app_slug = ? AND customer_id = ?').run(appSlug, recordId);
      db.prepare('UPDATE tasks SET customer_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE app_slug = ? AND customer_id = ?').run(appSlug, recordId);
    }
  },
  transactions: {
    table: 'transactions',
    label: 'Transaction',
    columns: ['employee_id', 'customer_id', 'type', 'status', 'name', 'data'],
    orderBy: 'created_at DESC',
    buildListOptions(filters = {}) {
      return combineListOptions(
        buildEqualityFilters(filters, {
          id: 'id',
          type: 'type',
          status: 'status',
          employeeId: 'employee_id',
          customerId: 'customer_id'
        }),
        buildTextSearch(['name', 'id'], filters.search)
      );
    },
    normalizeWrite: normalizeTransactionWrite
  },
  tasks: {
    table: 'tasks',
    label: 'Task',
    columns: ['employee_id', 'customer_id', 'title', 'description', 'status', 'due_at', 'data'],
    orderBy: 'COALESCE(due_at, created_at) DESC',
    buildListOptions(filters = {}) {
      return combineListOptions(
        buildEqualityFilters(filters, {
          id: 'id',
          status: 'status',
          employeeId: 'employee_id',
          customerId: 'customer_id'
        }),
        buildTextSearch(['title', 'description', 'id'], filters.search)
      );
    },
    normalizeWrite: normalizeTaskWrite,
    allowDelete: true
  }
};

function getResourceDefinition(resourceKey) {
  const resource = RESOURCE_DEFINITIONS[resourceKey];
  if (!resource) {
    throw createError(404, `Unsupported resource: ${resourceKey}`);
  }

  return resource;
}

function isTruthyQueryValue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function attachCustomerIncludes(db, appSlug, recordId, record, query = {}) {
  if (isTruthyQueryValue(query.includeTransactions)) {
    record.transactions = listRecordsForApp(db, appSlug, 'transactions', { customerId: recordId });
  }

  if (isTruthyQueryValue(query.includeTasks)) {
    record.tasks = listRecordsForApp(db, appSlug, 'tasks', { customerId: recordId });
  }

  return record;
}

function listRecordsForApp(db, appSlug, resourceKey, filters) {
  const resource = getResourceDefinition(resourceKey);
  const listOptions = resource.buildListOptions(filters);
  return serializeRecords(store.listRecords(db, resource, appSlug, {
    ...listOptions,
    orderBy: resource.orderBy
  }));
}

function getRecordForApp(db, appSlug, resourceKey, recordId, query) {
  const resource = getResourceDefinition(resourceKey);
  const record = serializeRecord(store.requireRecord(db, resource.table, appSlug, recordId, resource.label));

  if (resourceKey === 'customers') {
    return attachCustomerIncludes(db, appSlug, recordId, record, query);
  }

  return record;
}

function getRecordById(db, resourceKey, recordId) {
  const resource = getResourceDefinition(resourceKey);
  const record = store.getRecordById(db, resource.table, recordId);
  if (!record) {
    throw createError(404, `${resource.label} not found`);
  }

  return serializeRecord(record);
}

function createRecordForApp(db, appSlug, resourceKey, input = {}) {
  const resource = getResourceDefinition(resourceKey);
  const record = resource.normalizeWrite({ db, appSlug, existingRecord: null, input });
  const createdRecord = serializeRecord(store.createRecord(db, resource, appSlug, withTimestamps(record)));
  publishDataChange({
    appSlug,
    resource: resourceKey,
    action: 'create',
    id: createdRecord.id,
    record: createdRecord
  });
  return createdRecord;
}

function updateRecordForApp(db, appSlug, resourceKey, recordId, input = {}) {
  const resource = getResourceDefinition(resourceKey);
  const existingRecord = store.getRecord(db, resource.table, appSlug, recordId);
  if (!existingRecord) {
    throw createError(404, `${resource.label} not found`);
  }

  const record = resource.normalizeWrite({ db, appSlug, existingRecord, input });
  const updatedRecord = serializeRecord(store.updateRecord(db, resource, appSlug, recordId, record));
  publishDataChange({
    appSlug,
    resource: resourceKey,
    action: 'update',
    id: updatedRecord.id,
    record: updatedRecord
  });
  return updatedRecord;
}

function deleteRecordForApp(db, appSlug, resourceKey, recordId) {
  const resource = getResourceDefinition(resourceKey);
  if (!resource.allowDelete) {
    throw createError(405, `${resource.label} cannot be deleted`);
  }

  const existingRecord = store.getRecord(db, resource.table, appSlug, recordId);
  if (!existingRecord) {
    throw createError(404, `${resource.label} not found`);
  }

  if (typeof resource.beforeDelete === 'function') {
    resource.beforeDelete(db, appSlug, recordId);
  }

  const deletedRecord = serializeRecord(existingRecord);
  store.deleteRecord(db, resource, appSlug, recordId);
  publishDataChange({
    appSlug,
    resource: resourceKey,
    action: 'delete',
    id: recordId,
    record: deletedRecord
  });
  return { success: true };
}

module.exports = {
  RESOURCE_DEFINITIONS,
  createRecordForApp,
  deleteRecordForApp,
  getRecordById,
  getRecordForApp,
  getResourceDefinition,
  listRecordsForApp,
  updateRecordForApp
};
