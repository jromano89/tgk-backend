const { createResourceClient } = require('./resource-client');
const { createDataIoService } = require('./dataio-service');
const { TYPE_ALIASES, TYPE_NAME } = require('./quote-type-definitions');
const { getLiteralComparisonValue, getQueryOperation, isAttributeSelected } = require('./query-utils');
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

const client = createResourceClient('quotes');

function buildQuotePayload(rawInput, { recordId } = {}) {
  const input = asObject(rawInput);
  const payload = {};
  const id = recordId || pickFirstDefined(input, ['Id', 'id']);

  if (id !== undefined) {
    payload.id = id;
  }

  payload.customerId = readOptionalTextField(input, ['CustomerId', 'customerId']);
  payload.quoteNumber = readOptionalTextField(input, ['QuoteNumber', 'quoteNumber']);
  payload.name = readOptionalTextField(input, ['Name', 'name']);
  payload.status = readOptionalTextField(input, ['Status', 'status']);
  payload.total = readOptionalNumberField(input, ['Total', 'total']);
  payload.data = readOptionalDataField(input, ['Data', 'data', 'Metadata', 'metadata', 'DataJson', 'dataJson']);

  return payload;
}

function mapQuoteToDataRecord(quote) {
  return {
    Id: quote.id,
    AppSlug: readRecordValue(quote, 'appSlug', 'app_slug') || '',
    CustomerId: readRecordValue(quote, 'customerId', 'customer_id') || '',
    QuoteNumber: readRecordValue(quote, 'quoteNumber', 'quote_number') || '',
    Name: quote.name || '',
    Status: quote.status || '',
    Total: quote.total ?? null,
    DataJson: serializeData(asObject(quote.data)),
    LineItems: Array.isArray(quote.lineItems) ? quote.lineItems.map((lineItem) => lineItem.id) : [],
    CreatedAt: readRecordValue(quote, 'createdAt', 'created_at') || '',
    UpdatedAt: readRecordValue(quote, 'updatedAt', 'updated_at') || ''
  };
}

function buildQuoteSearchFilters(query) {
  const operation = getQueryOperation(query);
  const filters = {
    id: getLiteralComparisonValue(operation, 'Id'),
    customerId: getLiteralComparisonValue(operation, 'CustomerId'),
    quoteNumber: getLiteralComparisonValue(operation, 'QuoteNumber'),
    status: getLiteralComparisonValue(operation, 'Status'),
    includeLineItems: isAttributeSelected(query, 'LineItems')
  };

  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== null && value !== undefined && value !== ''));
}

module.exports = createDataIoService({
  typeName: TYPE_NAME,
  typeAliases: TYPE_ALIASES,
  createBackendRecord: client.create,
  updateBackendRecord: client.update,
  listRecords: client.list,
  buildPayload: buildQuotePayload,
  buildSearchFilters: buildQuoteSearchFilters,
  loadExistingRecordById: client.getById,
  mapRecordToDataRecord: mapQuoteToDataRecord,
  normalizeWriteError: (error) => normalizeReferenceWriteError(error, 'Quote')
});
