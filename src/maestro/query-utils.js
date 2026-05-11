const DEFAULT_PAGINATION = {
  limit: 50,
  skip: 0
};

function normalizePagination(pagination) {
  const normalized = pagination && typeof pagination === 'object' ? pagination : DEFAULT_PAGINATION;
  return {
    limit: Math.max(0, Number(normalized.limit) || DEFAULT_PAGINATION.limit),
    skip: Math.max(0, Number(normalized.skip) || DEFAULT_PAGINATION.skip)
  };
}

function normalizeSearchRequest(body) {
  if (body?.query && typeof body.query === 'object') {
    const query = body.query;
    return {
      query: {
        ...query,
        from: query.from || body.from || body.typeName,
        queryFilter: query.queryFilter || body.queryFilter || null,
        attributesToSelect: Array.isArray(query.attributesToSelect)
          ? query.attributesToSelect
          : (Array.isArray(body.attributesToSelect) ? body.attributesToSelect : [])
      },
      pagination: normalizePagination(body.pagination)
    };
  }

  if (body && typeof body === 'object') {
    const from = body.from || body.typeName;
    const queryFilter = body.queryFilter || null;
    const attributesToSelect = Array.isArray(body.attributesToSelect) ? body.attributesToSelect : [];

    if (from || queryFilter || attributesToSelect.length > 0) {
      return {
        query: {
          from,
          queryFilter,
          attributesToSelect
        },
        pagination: normalizePagination(body.pagination)
      };
    }
  }

  return {
    query: null,
    pagination: normalizePagination(body?.pagination)
  };
}

function getQueryOperation(query) {
  return query?.queryFilter?.operation || query?.queryFilter || null;
}

function getLiteralComparisonValue(operation, fieldName, allowedOperators = ['EQUALS']) {
  if (!operation || !fieldName) {
    return null;
  }

  if (operation.leftOperation || operation.rightOperation) {
    const normalizedOperator = String(operation.operator || '').toUpperCase();
    if (normalizedOperator !== 'AND') {
      return null;
    }

    return getLiteralComparisonValue(operation.leftOperation, fieldName, allowedOperators)
      || getLiteralComparisonValue(operation.rightOperation, fieldName, allowedOperators);
  }

  const normalizedOperator = String(operation.operator || '').toUpperCase();
  if (!allowedOperators.map((item) => String(item).toUpperCase()).includes(normalizedOperator)) {
    return null;
  }

  const leftOperand = operation.leftOperand;
  const rightOperand = operation.rightOperand;

  if (leftOperand?.isLiteral && !rightOperand?.isLiteral && rightOperand?.name === fieldName) {
    return leftOperand.name;
  }

  if (rightOperand?.isLiteral && !leftOperand?.isLiteral && leftOperand?.name === fieldName) {
    return rightOperand.name;
  }

  return null;
}

function filterAttributes(record, attributesToSelect) {
  if (!Array.isArray(attributesToSelect) || attributesToSelect.length === 0) {
    return record;
  }

  const filtered = {};
  for (const attribute of attributesToSelect) {
    if (Object.prototype.hasOwnProperty.call(record, attribute)) {
      filtered[attribute] = record[attribute];
    }
  }

  if (!Object.prototype.hasOwnProperty.call(filtered, 'Id') && record.Id) {
    filtered.Id = record.Id;
  }

  return filtered;
}

function resolveOperand(record, operand) {
  if (!operand) {
    return undefined;
  }
  if (operand.isLiteral) {
    return operand.name;
  }
  return record[operand.name];
}

function compareValues(operator, left, right) {
  const normalizedOperator = String(operator || '').toUpperCase();
  const leftValue = left == null ? '' : left;
  const rightValue = right == null ? '' : right;
  const leftString = String(leftValue).toLowerCase();
  const rightString = String(rightValue).toLowerCase();
  const leftNumber = Number(leftValue);
  const rightNumber = Number(rightValue);
  const useNumericComparison = Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftString !== '' && rightString !== '';

  switch (normalizedOperator) {
    case 'EQUALS':
      return useNumericComparison ? leftNumber === rightNumber : leftString === rightString;
    case 'NOT_EQUALS':
      return useNumericComparison ? leftNumber !== rightNumber : leftString !== rightString;
    case 'CONTAINS':
      return leftString.includes(rightString);
    case 'DOES_NOT_CONTAIN':
      return !leftString.includes(rightString);
    case 'STARTS_WITH':
      return leftString.startsWith(rightString);
    case 'DOES_NOT_START_WITH':
      return !leftString.startsWith(rightString);
    case 'ENDS_WITH':
      return leftString.endsWith(rightString);
    case 'DOES_NOT_END_WITH':
      return !leftString.endsWith(rightString);
    case 'GREATER_THAN':
      return useNumericComparison ? leftNumber > rightNumber : leftString > rightString;
    case 'GREATER_THAN_OR_EQUALS_TO':
      return useNumericComparison ? leftNumber >= rightNumber : leftString >= rightString;
    case 'LESS_THAN':
      return useNumericComparison ? leftNumber < rightNumber : leftString < rightString;
    case 'LESS_THAN_OR_EQUALS_TO':
      return useNumericComparison ? leftNumber <= rightNumber : leftString <= rightString;
    default:
      return false;
  }
}

function evaluateOperation(record, operation) {
  if (!operation) {
    return true;
  }

  if (operation.leftOperation || operation.rightOperation) {
    const leftResult = evaluateOperation(record, operation.leftOperation);
    const rightResult = evaluateOperation(record, operation.rightOperation);
    return String(operation.operator || '').toUpperCase() === 'OR'
      ? leftResult || rightResult
      : leftResult && rightResult;
  }

  return compareValues(
    operation.operator,
    resolveOperand(record, operation.leftOperand),
    resolveOperand(record, operation.rightOperand)
  );
}

module.exports = {
  DEFAULT_PAGINATION,
  evaluateOperation,
  filterAttributes,
  getQueryOperation,
  getLiteralComparisonValue,
  normalizeSearchRequest,
  normalizePagination
};
