const { createConceptTypeDefinitions } = require('./type-helpers');

const TYPE_NAME = 'Task';
const TYPE_ALIASES = new Set(['task', 'todo', 'actionitem', 'workitem']);

const TYPE_NAMES = [
  {
    typeName: TYPE_NAME,
    label: 'Task',
    description: 'TGK task row'
  }
];

const FIELD_DEFINITIONS = [
  { name: 'Id', label: 'Task ID', type: 'String', optional: false, readableOnly: true },
  { name: 'AppSlug', label: 'App Slug', type: 'String', optional: false },
  { name: 'EmployeeId', label: 'Employee ID', type: 'String', optional: true },
  { name: 'CustomerId', label: 'Customer ID', type: 'String', optional: true },
  { name: 'Title', label: 'Title', type: 'String', optional: true },
  { name: 'Description', label: 'Description', type: 'String', optional: true },
  { name: 'Status', label: 'Status', type: 'String', optional: true },
  { name: 'DueAt', label: 'Due At', type: 'DateTime', optional: true },
  { name: 'DataJson', label: 'Data JSON', type: 'String', optional: true },
  { name: 'CreatedAt', label: 'Created At', type: 'DateTime', optional: true, readableOnly: true },
  { name: 'UpdatedAt', label: 'Updated At', type: 'DateTime', optional: true, readableOnly: true }
];

const TYPE_DEFINITIONS = createConceptTypeDefinitions({
  typeName: TYPE_NAME,
  term: 'Task',
  identifiedBy: 'Id',
  fields: FIELD_DEFINITIONS
});

module.exports = {
  TYPE_ALIASES,
  TYPE_DEFINITIONS,
  TYPE_NAMES,
  TYPE_NAME
};
