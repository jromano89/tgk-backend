const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'Quote';
const TYPE_ALIASES = new Set(['quote', 'estimate']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Quote',
    description: 'TGK quote row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'Id', label: 'Quote ID', type: 'String', optional: false, readableOnly: true },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'CustomerId', label: 'Customer ID', type: 'String', optional: true },
  { name: 'QuoteNumber', label: 'Quote Number', type: 'String', optional: true },
  { name: 'Name', label: 'Name', type: 'String', optional: true },
  { name: 'Status', label: 'Status', type: 'String', optional: true },
  { name: 'Total', label: 'Total', type: 'Double', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'LineItems', label: 'Line Items', relationshipType: 'QuoteLineItem', isArray: true, optional: true, readableOnly: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Quote',
  identifiedBy: 'Id',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  DEPENDENCY_TYPE_NAMES: ['QuoteLineItem'],
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
