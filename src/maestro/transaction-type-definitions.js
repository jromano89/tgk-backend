const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'Transaction';
const TYPE_ALIASES = new Set(['transaction']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Transaction',
    description: 'Transaction tracking row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'TransactionId', label: 'Transaction ID', type: 'String', optional: false },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'Name', label: 'Transaction Name', type: 'String', optional: true },
  { name: 'Type', label: 'Transaction Type', type: 'String', optional: true },
  { name: 'Status', label: 'Status', type: 'String', optional: true },
  { name: 'CustomerId', label: 'Customer ID', type: 'String', optional: true },
  { name: 'EmployeeId', label: 'Employee ID', type: 'String', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Transaction',
  identifiedBy: 'TransactionId',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
