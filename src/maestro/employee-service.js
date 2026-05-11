const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./employee-type-definitions');
const {
  asObject,
  buildPersonData,
  buildPersonDisplayName,
  normalizeOptionalText,
  normalizePhone,
  pickFirstDefined,
  readRecordValue,
  serializeData
} = require('./service-utils');

const client = createResourceClient('employees');

const STRUCTURED_DATA_KEYS = ['Data', 'data', 'EmployeeData', 'employeeData', 'Metadata', 'metadata', 'DataJson', 'dataJson'];
const CONSUMED_INPUT_KEYS = new Set([
  'Id', 'id',
  'AppSlug', 'appSlug',
  'DisplayName', 'displayName',
  'Email', 'email',
  'Phone', 'phone',
  'Title', 'title',
  'Data', 'data', 'EmployeeData', 'employeeData', 'Metadata', 'metadata', 'DataJson', 'dataJson'
]);

function buildEmployeePayload(rawInput, { existingRecord, recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {
    data: buildPersonData(input, existingRecord?.data, STRUCTURED_DATA_KEYS, CONSUMED_INPUT_KEYS)
  };

  const displayName = buildPersonDisplayName(
    { ...payload.data, ...input },
    existingRecord,
    ['Title', 'title']
  );
  if (displayName !== undefined) {
    payload.displayName = displayName;
  }

  const id = recordId || pickFirstDefined(input, ['Id', 'id']);
  const email = pickFirstDefined(input, ['Email', 'email']);
  const phone = pickFirstDefined(input, ['Phone', 'phone']);
  const title = pickFirstDefined(input, ['Title', 'title']);

  if (id !== undefined) {
    payload.id = id;
  }
  if (email !== undefined) {
    payload.email = normalizeOptionalText(email) || null;
  }
  if (phone !== undefined) {
    payload.phone = normalizePhone(phone);
  }
  if (title !== undefined) {
    payload.title = normalizeOptionalText(title) || null;
  }

  return payload;
}

function mapEmployeeToDataRecord(employee) {
  const data = asObject(employee?.data);
  const extensionFields = asObject(data.extensionFields);

  return {
    ...extensionFields,
    Id: employee.id,
    AppSlug: readRecordValue(employee, 'appSlug', 'app_slug') || '',
    DisplayName: readRecordValue(employee, 'displayName', 'display_name') || '',
    Email: employee.email || '',
    Phone: employee.phone || '',
    Title: employee.title || '',
    DataJson: serializeData(data),
    CreatedAt: readRecordValue(employee, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(employee, 'updatedAt', 'updated_at') || ''
  };
}

module.exports = createDataIoService({
  typeName: TYPE_NAME,
  typeAliases: TYPE_ALIASES,
  createBackendRecord: client.create,
  updateBackendRecord: client.update,
  listRecords: client.list,
  loadExistingRecord: client.get,
  loadExistingRecordById: client.getById,
  buildPayload: buildEmployeePayload,
  mapRecordToDataRecord: mapEmployeeToDataRecord
});
