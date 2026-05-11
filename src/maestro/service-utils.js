function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function normalizePhone(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return value.number || value.normalizedNumber || value.phone || null;
  }

  return String(value);
}

function parseDataValue(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      return asObject(JSON.parse(value));
    } catch (error) {
      return {};
    }
  }

  return asObject(value);
}

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function collectExtensionFields(input, consumedKeys) {
  const fields = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (consumedKeys.has(key) || value === undefined) {
      continue;
    }
    fields[key] = value;
  }
  return fields;
}

function pickFirstDefined(input, keys) {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) {
      continue;
    }

    const value = input[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function hasOwnField(input, aliases) {
  return aliases.some((alias) => Object.prototype.hasOwnProperty.call(input || {}, alias));
}

function readOptionalTextField(input, aliases) {
  if (!hasOwnField(input, aliases)) {
    return undefined;
  }

  return normalizeOptionalText(pickFirstDefined(input, aliases)) || null;
}

function readOptionalDataField(input, aliases) {
  if (!hasOwnField(input, aliases)) {
    return undefined;
  }

  return parseDataValue(pickFirstDefined(input, aliases));
}

function serializeData(value) {
  return JSON.stringify(asObject(value));
}

function readRecordValue(record, camelKey, snakeKey) {
  if (!record || typeof record !== 'object') {
    return undefined;
  }

  if (camelKey && Object.prototype.hasOwnProperty.call(record, camelKey)) {
    return record[camelKey];
  }

  if (snakeKey && Object.prototype.hasOwnProperty.call(record, snakeKey)) {
    return record[snakeKey];
  }

  return undefined;
}

function requireAppSlug(value) {
  const appSlug = normalizeOptionalText(value);
  if (!appSlug) {
    throw createServiceError(400, 'BAD_REQUEST', 'AppSlug is required.');
  }

  return appSlug;
}

function resolveRequestAppSlug(body, data, operation) {
  const requestedFromData = pickFirstDefined(data, ['AppSlug', 'appSlug']);
  const requestedFromBody = pickFirstDefined(body, ['appSlug', 'AppSlug']);
  const requestedFromQuery = pickFirstDefined(body?.query || {}, ['appSlug', 'AppSlug']);

  const appSlug = requestedFromData || requestedFromBody || requestedFromQuery;
  if (!appSlug) {
    throw createServiceError(
      400,
      'BAD_REQUEST',
      `${operation} requires AppSlug in the Maestro payload.`
    );
  }

  return requireAppSlug(appSlug);
}

function requireSupportedType(typeName, aliases, canonicalTypeName) {
  if (aliases.has(String(typeName || '').toLowerCase())) {
    return;
  }

  throw createServiceError(400, 'BAD_REQUEST', `Unsupported typeName "${typeName}". Use "${canonicalTypeName}".`);
}

function buildPersonDisplayName(input, existingRecord, fallbackKeyAliases) {
  const explicitDisplayName = normalizeOptionalText(pickFirstDefined(input, ['DisplayName', 'displayName']));
  if (explicitDisplayName) {
    return explicitDisplayName;
  }

  return normalizeOptionalText(readRecordValue(existingRecord, 'displayName', 'display_name'))
    || normalizeOptionalText(pickFirstDefined(input, ['Email', 'email']))
    || normalizeOptionalText(pickFirstDefined(input, fallbackKeyAliases))
    || undefined;
}

function buildPersonData(input, existingData, structuredDataKeys, consumedInputKeys) {
  const structuredData = parseDataValue(pickFirstDefined(input, structuredDataKeys));
  const nextData = {
    ...asObject(existingData),
    ...structuredData
  };

  const extensionFields = collectExtensionFields(input, consumedInputKeys);
  if (Object.keys(extensionFields).length > 0) {
    nextData.extensionFields = {
      ...asObject(nextData.extensionFields),
      ...extensionFields
    };
  }

  return nextData;
}

function normalizeReferenceWriteError(error, resourceLabel) {
  if (error?.statusCode !== 400) {
    return error;
  }

  const REFERENCE_MESSAGES = {
    'customerId must belong to the current app': `${resourceLabel} CustomerId must be the TGK customer Id for this app.`,
    'employeeId must belong to the current app': `${resourceLabel} EmployeeId must be the TGK employee Id for this app.`
  };

  const mapped = REFERENCE_MESSAGES[error.message];
  return mapped ? createServiceError(400, 'BAD_REQUEST', mapped) : error;
}

module.exports = {
  asObject,
  buildPersonData,
  buildPersonDisplayName,
  collectExtensionFields,
  createServiceError,
  hasOwnField,
  normalizeOptionalText,
  normalizePhone,
  normalizeReferenceWriteError,
  parseDataValue,
  pickFirstDefined,
  requireAppSlug,
  readOptionalDataField,
  readRecordValue,
  readOptionalTextField,
  resolveRequestAppSlug,
  requireSupportedType,
  serializeData
};
