const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'Customer';
const TYPE_ALIASES = new Set(['customer', 'client', 'investor', 'contact']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Customer',
    description: 'TGK customer row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'Id', label: 'Customer ID', type: 'String', optional: false, readableOnly: true },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'EmployeeId', label: 'Employee ID', type: 'String', optional: true },
  { name: 'DisplayName', label: 'Display Name', type: 'String', optional: true },
  { name: 'Email', label: 'Email', type: 'String', optional: true },
  { name: 'Phone', label: 'Phone', type: 'String', optional: true },
  { name: 'Organization', label: 'Organization', type: 'String', optional: true },
  { name: 'Status', label: 'Status', type: 'String', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Customer',
  identifiedBy: 'Id',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
