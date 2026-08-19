const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./quote-line-item-type-definitions');
const { getLiteralComparisonValue, getQueryOperation } = require('./query-utils');
const {
  asObject,
  normalizeReferenceWriteError,
  pickFirstDefined,
  readOptionalDataField,
  readOptionalNumberField,
  readOptionalTextField,
  readRecordValue,
  serializeData
} = require('./service-utils');

const client = createResourceClient('quoteLineItems');

function buildQuoteLineItemPayload(rawInput, { recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {};
  const id = recordId || pickFirstDefined(input, ['Id', 'id']);

  if (id !== undefined) {
    payload.id = id;
  }

  payload.quoteId = readOptionalTextField(input, ['QuoteId', 'quoteId']);
  payload.name = readOptionalTextField(input, ['Name', 'name']);
  payload.description = readOptionalTextField(input, ['Description', 'description']);
  payload.quantity = readOptionalNumberField(input, ['Quantity', 'quantity']);
  payload.unitPrice = readOptionalNumberField(input, ['UnitPrice', 'unitPrice']);
  payload.total = readOptionalNumberField(input, ['Total', 'total']);
  payload.data = readOptionalDataField(input, ['Data', 'data', 'Metadata', 'metadata', 'DataJson', 'dataJson']);

  return payload;
}

function mapQuoteLineItemToDataRecord(lineItem) {
  return {
    Id: lineItem.id,
    AppSlug: readRecordValue(lineItem, 'appSlug', 'app_slug') || '',
    QuoteId: readRecordValue(lineItem, 'quoteId', 'quote_id') || '',
    Name: lineItem.name || '',
    Description: lineItem.description || '',
    Quantity: lineItem.quantity ?? null,
    UnitPrice: readRecordValue(lineItem, 'unitPrice', 'unit_price') ?? null,
    Total: lineItem.total ?? null,
    DataJson: serializeData(asObject(lineItem.data)),
    CreatedAt: readRecordValue(lineItem, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(lineItem, 'updatedAt', 'updated_at') || ''
  };
}

function buildQuoteLineItemSearchFilters(query) {
  const operation = getQueryOperation(query);
  const filters = {
    id: getLiteralComparisonValue(operation, 'Id'),
    quoteId: getLiteralComparisonValue(operation, 'QuoteId')
  };

  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

const service = createDataIoService({
  typeName: TYPE_NAME,
  typeAliases: TYPE_ALIASES,
  createBackendRecord: client.create,
  updateBackendRecord: client.update,
  listRecords: client.list,
  buildPayload: buildQuoteLineItemPayload,
  buildSearchFilters: buildQuoteLineItemSearchFilters,
  loadExistingRecordById: client.getById,
  mapRecordToDataRecord: mapQuoteLineItemToDataRecord,
  normalizeWriteError: (error) => normalizeReferenceWriteError(error, 'Quote line item')
});

service.mapRecordToDataRecord = mapQuoteLineItemToDataRecord;

module.exports = service;
