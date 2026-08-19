const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'QuoteLineItem';
const TYPE_ALIASES = new Set(['quotelineitem', 'quote-line-item', 'lineitem']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Quote Line Item',
    description: 'TGK quote line item row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'Id', label: 'Line Item ID', type: 'String', optional: false, readableOnly: true },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'QuoteId', label: 'Quote ID', type: 'String', optional: false },
  { name: 'Name', label: 'Name', type: 'String', optional: true },
  { name: 'Description', label: 'Description', type: 'String', optional: true },
  { name: 'Quantity', label: 'Quantity', type: 'Double', optional: true },
  { name: 'UnitPrice', label: 'Unit Price', type: 'Double', optional: true },
  { name: 'Total', label: 'Total', type: 'Double', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Quote Line Item',
  identifiedBy: 'Id',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
