const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./transaction-type-definitions');
const { getLiteralComparisonValue, getQueryOperation } = require('./query-utils');
const {
  asObject,
  createServiceError,
  hasOwnField,
  normalizeOptionalText,
  normalizeReferenceWriteError,
  pickFirstDefined,
  readOptionalDataField,
  readRecordValue,
  readOptionalTextField,
  serializeData
} = require('./service-utils');

const client = createResourceClient('transactions');

function buildTransactionPayload(rawInput, { recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {};

  if (recordId || hasOwnField(input, ['TransactionId', 'transactionId', 'Id', 'id'])) {
    payload.id = normalizeOptionalText(recordId || pickFirstDefined(input, ['TransactionId', 'transactionId', 'Id', 'id'])) || undefined;
  }

  if (!payload.id) {
    throw createServiceError(400, 'BAD_REQUEST', 'TransactionId is required when creating or updating a transaction record.');
  }

  payload.customerId = readOptionalTextField(input, ['CustomerId', 'customerId']);
  payload.employeeId = readOptionalTextField(input, ['EmployeeId', 'employeeId']);
  payload.type = readOptionalTextField(input, ['Type', 'type']);
  payload.status = readOptionalTextField(input, ['Status', 'status']);
  payload.name = readOptionalTextField(input, ['Name', 'name']);
  payload.data = readOptionalDataField(input, ['Data', 'data', 'Metadata', 'metadata', 'DataJson', 'dataJson']);

  return payload;
}

function mapTransactionToDataRecord(transaction) {
  return {
    TransactionId: transaction.id,
    AppSlug: readRecordValue(transaction, 'appSlug', 'app_slug') || '',
    Name: transaction.name || '',
    Type: transaction.type || '',
    Status: transaction.status || '',
    CustomerId: readRecordValue(transaction, 'customerId', 'customer_id') || '',
    EmployeeId: readRecordValue(transaction, 'employeeId', 'employee_id') || '',
    DataJson: serializeData(asObject(transaction.data)),
    CreatedAt: readRecordValue(transaction, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(transaction, 'updatedAt', 'updated_at') || ''
  };
}

function buildTransactionSearchFilters(query) {
  const operation = getQueryOperation(query);
  const filters = {
    id: getLiteralComparisonValue(operation, 'TransactionId') || getLiteralComparisonValue(operation, 'Id'),
    customerId: getLiteralComparisonValue(operation, 'CustomerId'),
    employeeId: getLiteralComparisonValue(operation, 'EmployeeId'),
    type: getLiteralComparisonValue(operation, 'Type'),
    status: getLiteralComparisonValue(operation, 'Status')
  };

  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

module.exports = createDataIoService({
  typeName: TYPE_NAME,
  typeAliases: TYPE_ALIASES,
  createBackendRecord: client.create,
  updateBackendRecord: client.update,
  listRecords: client.list,
  buildPayload: buildTransactionPayload,
  buildSearchFilters: buildTransactionSearchFilters,
  idField: 'TransactionId',
  searchIdFields: ['TransactionId', 'Id'],
  loadExistingRecordById: client.getById,
  mapRecordToDataRecord: mapTransactionToDataRecord,
  normalizeWriteError: (error) => normalizeReferenceWriteError(error, 'Transaction')
});
