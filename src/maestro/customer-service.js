const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./customer-type-definitions');
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

const client = createResourceClient('customers');

const STRUCTURED_DATA_KEYS = ['Data', 'data', 'CustomerData', 'customerData', 'Metadata', 'metadata', 'DataJson', 'dataJson'];
const CONSUMED_INPUT_KEYS = new Set([
  'Id', 'id',
  'AppSlug', 'appSlug',
  'EmployeeId', 'employeeId',
  'DisplayName', 'displayName',
  'Email', 'email',
  'Phone', 'phone',
  'Organization', 'organization', 'Company', 'company',
  'Status', 'status',
  'Data', 'data', 'CustomerData', 'customerData', 'Metadata', 'metadata', 'DataJson', 'dataJson'
]);

function buildCustomerPayload(rawInput, { existingRecord, recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {
    data: buildPersonData(input, existingRecord?.data, STRUCTURED_DATA_KEYS, CONSUMED_INPUT_KEYS)
  };

  const displayName = buildPersonDisplayName(
    { ...payload.data, ...input },
    existingRecord,
    ['Organization', 'organization', 'Company', 'company']
  );
  if (displayName !== undefined) {
    payload.displayName = displayName;
  }

  const id = recordId || pickFirstDefined(input, ['Id', 'id']);
  const employeeId = pickFirstDefined(input, ['EmployeeId', 'employeeId']);
  const email = pickFirstDefined(input, ['Email', 'email']);
  const phone = pickFirstDefined(input, ['Phone', 'phone']);
  const organization = pickFirstDefined(input, ['Organization', 'organization', 'Company', 'company']);
  const status = pickFirstDefined(input, ['Status', 'status']);

  if (id !== undefined) {
    payload.id = id;
  }
  if (employeeId !== undefined) {
    payload.employeeId = employeeId || null;
  }
  if (email !== undefined) {
    payload.email = normalizeOptionalText(email) || null;
  }
  if (phone !== undefined) {
    payload.phone = normalizePhone(phone);
  }
  if (organization !== undefined) {
    payload.organization = normalizeOptionalText(organization) || null;
  }
  if (status !== undefined) {
    payload.status = normalizeOptionalText(status) || null;
  }

  return payload;
}

function mapCustomerToDataRecord(customer) {
  const data = asObject(customer?.data);
  const extensionFields = asObject(data.extensionFields);

  return {
    ...extensionFields,
    Id: customer.id,
    AppSlug: readRecordValue(customer, 'appSlug', 'app_slug') || '',
    EmployeeId: readRecordValue(customer, 'employeeId', 'employee_id') || '',
    DisplayName: readRecordValue(customer, 'displayName', 'display_name') || '',
    Email: customer.email || '',
    Phone: customer.phone || '',
    Organization: customer.organization || '',
    Status: customer.status || '',
    DataJson: serializeData(data),
    CreatedAt: readRecordValue(customer, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(customer, 'updatedAt', 'updated_at') || ''
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
  buildPayload: buildCustomerPayload,
  mapRecordToDataRecord: mapCustomerToDataRecord
});
