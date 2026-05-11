const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'Employee';
const TYPE_ALIASES = new Set(['employee', 'advisor', 'user']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Employee',
    description: 'TGK employee row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'Id', label: 'Employee ID', type: 'String', optional: false, readableOnly: true },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'DisplayName', label: 'Display Name', type: 'String', optional: true },
  { name: 'Email', label: 'Email', type: 'String', optional: true },
  { name: 'Phone', label: 'Phone', type: 'String', optional: true },
  { name: 'Title', label: 'Title', type: 'String', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Employee',
  identifiedBy: 'Id',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
