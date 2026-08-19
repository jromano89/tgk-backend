const { createServiceError } = require('./service-utils');
const customerService = require('./customer-service');
const employeeService = require('./employee-service');
const transactionService = require('./transaction-service');
const taskService = require('./task-service');
const quoteService = require('./quote-service');
const quoteLineItemService = require('./quote-line-item-service');
const customerTypeDefs = require('./customer-type-definitions');
const employeeTypeDefs = require('./employee-type-definitions');
const transactionTypeDefs = require('./transaction-type-definitions');
const taskTypeDefs = require('./task-type-definitions');
const quoteTypeDefs = require('./quote-type-definitions');
const quoteLineItemTypeDefs = require('./quote-line-item-type-definitions');

const REGISTRY = [
  { service: customerService, typeDefs: customerTypeDefs },
  { service: employeeService, typeDefs: employeeTypeDefs },
  { service: taskService, typeDefs: taskTypeDefs },
  { service: transactionService, typeDefs: transactionTypeDefs },
  { service: quoteLineItemService, typeDefs: quoteLineItemTypeDefs },
  { service: quoteService, typeDefs: quoteTypeDefs }
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
  const declarations = [];
  const errors = [];
  const seen = new Set();

  function appendRegistration(registration) {
    if (!registration || seen.has(registration.typeDefs.TYPE_NAME)) {
      return;
    }

    for (const dependencyTypeName of registration.typeDefs.DEPENDENCY_TYPE_NAMES || []) {
      appendRegistration(findRegistration(dependencyTypeName));
    }

    declarations.push(...registration.typeDefs.TYPE_DEFINITIONS.declarations);
    seen.add(registration.typeDefs.TYPE_NAME);
  }

  if (!Array.isArray(requestedTypeNames) || requestedTypeNames.length === 0) {
    REGISTRY.forEach(appendRegistration);
    return {
      declarations,
      errors
    };
  }

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

    appendRegistration(registration);
  }

  return { declarations, errors };
}

module.exports = {
  getTypeDefinitions,
  getTypeNames,
  resolveDataIoService
};
