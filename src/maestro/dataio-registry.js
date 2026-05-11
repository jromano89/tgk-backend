const { createServiceError } = require('./service-utils');
const customerService = require('./customer-service');
const employeeService = require('./employee-service');
const transactionService = require('./transaction-service');
const taskService = require('./task-service');
const customerTypeDefs = require('./customer-type-definitions');
const employeeTypeDefs = require('./employee-type-definitions');
const transactionTypeDefs = require('./transaction-type-definitions');
const taskTypeDefs = require('./task-type-definitions');

const REGISTRY = [
  { service: customerService, typeDefs: customerTypeDefs },
  { service: employeeService, typeDefs: employeeTypeDefs },
  { service: taskService, typeDefs: taskTypeDefs },
  { service: transactionService, typeDefs: transactionTypeDefs }
];

function findRegistration(typeName) {
  const normalized = String(typeName || '').toLowerCase();
  if (!normalized) {
    return null;
  }

  return REGISTRY.find(({ typeDefs }) =>
    typeDefs.TYPE_ALIASES.has(normalized) || String(typeDefs.TYPE_NAME).toLowerCase() === normalized
  ) || null;
}

function createUnsupportedService(typeName) {
  const methods = {};
  for (const methodName of ['createRecord', 'patchRecord', 'searchRecords']) {
    methods[methodName] = () => {
      throw createServiceError(400, 'BAD_REQUEST', `Unsupported typeName "${typeName}".`);
    };
  }
  return methods;
}

function resolveDataIoService(typeName) {
  if (!typeName) {
    return customerService;
  }

  const registration = findRegistration(typeName);
  return registration ? registration.service : createUnsupportedService(typeName);
}

function getTypeNames() {
  return REGISTRY.flatMap(({ typeDefs }) => typeDefs.TYPE_NAMES);
}

function getTypeDefinitions(requestedTypeNames = []) {
  if (!Array.isArray(requestedTypeNames) || requestedTypeNames.length === 0) {
    return {
      declarations: REGISTRY.flatMap(({ typeDefs }) => typeDefs.TYPE_DEFINITIONS.declarations),
      errors: []
    };
  }

  const declarations = [];
  const errors = [];
  const seen = new Set();

  for (const requestedTypeName of requestedTypeNames) {
    const registration = findRegistration(requestedTypeName);
    if (!registration) {
      errors.push({
        typeName: requestedTypeName,
        code: 'UNKNOWN',
        message: `Unsupported type "${requestedTypeName}".`
      });
      continue;
    }

    if (seen.has(registration.typeDefs.TYPE_NAME)) {
      continue;
    }

    declarations.push(...registration.typeDefs.TYPE_DEFINITIONS.declarations);
    seen.add(registration.typeDefs.TYPE_NAME);
  }

  return { declarations, errors };
}

module.exports = {
  getTypeDefinitions,
  getTypeNames,
  resolveDataIoService
};
