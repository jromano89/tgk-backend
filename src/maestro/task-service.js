const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./task-type-definitions');
const { getLiteralComparisonValue, getQueryOperation } = require('./query-utils');
const {
  asObject,
  normalizeOptionalText,
  normalizeReferenceWriteError,
  pickFirstDefined,
  readOptionalDataField,
  readRecordValue,
  readOptionalTextField,
  serializeData
} = require('./service-utils');

const client = createResourceClient('tasks');

function buildTaskPayload(rawInput, { recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {};

  if (recordId || pickFirstDefined(input, ['TaskId', 'taskId', 'Id', 'id'])) {
    payload.id = normalizeOptionalText(recordId || pickFirstDefined(input, ['TaskId', 'taskId', 'Id', 'id'])) || undefined;
  }

  payload.customerId = readOptionalTextField(input, ['CustomerId', 'customerId']);
  payload.employeeId = readOptionalTextField(input, ['EmployeeId', 'employeeId']);
  payload.title = readOptionalTextField(input, ['Title', 'title']);
  payload.description = readOptionalTextField(input, ['Description', 'description']);
  payload.status = readOptionalTextField(input, ['Status', 'status']);
  payload.dueAt = readOptionalTextField(input, ['DueAt', 'dueAt']);
  payload.data = readOptionalDataField(input, ['Data', 'data', 'TaskData', 'taskData', 'Metadata', 'metadata', 'DataJson', 'dataJson']);

  return payload;
}

function mapTaskToDataRecord(task) {
  return {
    Id: task.id,
    AppSlug: readRecordValue(task, 'appSlug', 'app_slug') || '',
    EmployeeId: readRecordValue(task, 'employeeId', 'employee_id') || '',
    CustomerId: readRecordValue(task, 'customerId', 'customer_id') || '',
    Title: task.title || '',
    Description: task.description || '',
    Status: task.status || '',
    DueAt: readRecordValue(task, 'dueAt', 'due_at') || '',
    DataJson: serializeData(asObject(task.data)),
    CreatedAt: readRecordValue(task, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(task, 'updatedAt', 'updated_at') || ''
  };
}

function buildTaskSearchFilters(query) {
  const operation = getQueryOperation(query);
  const filters = {
    id: getLiteralComparisonValue(operation, 'Id') || getLiteralComparisonValue(operation, 'TaskId'),
    customerId: getLiteralComparisonValue(operation, 'CustomerId'),
    employeeId: getLiteralComparisonValue(operation, 'EmployeeId'),
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
  buildPayload: buildTaskPayload,
  buildSearchFilters: buildTaskSearchFilters,
  searchIdFields: ['Id', 'TaskId'],
  loadExistingRecordById: client.getById,
  mapRecordToDataRecord: mapTaskToDataRecord,
  normalizeWriteError: (error) => normalizeReferenceWriteError(error, 'Task')
});
