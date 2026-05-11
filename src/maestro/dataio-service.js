const { evaluateOperation, filterAttributes, getLiteralComparisonValue, getQueryOperation, normalizeSearchRequest } = require('./query-utils');
const { createServiceError, pickFirstDefined, requireSupportedType, resolveRequestAppSlug } = require('./service-utils');

function wrapLookupError(error) {
  return createServiceError(
    error?.statusCode === 404 ? 404 : 500,
    error?.statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
    error?.message || 'Unexpected lookup failure.'
  );
}

function createDataIoService({
  typeName,
  typeAliases,
  createBackendRecord,
  updateBackendRecord,
  listRecords,
  mapRecordToDataRecord,
  buildPayload,
  buildSearchFilters,
  idField = 'Id',
  searchIdFields = [idField],
  loadExistingRecord,
  loadExistingRecordById,
  normalizeWriteError = (error) => error
}) {
  async function createRecord(body) {
    const data = body?.data;
    const requestedId = body?.recordId;
    const requestedTypeName = body?.typeName;
    const appSlug = resolveRequestAppSlug(body, data, 'createRecord');

    if (!data || !requestedTypeName) {
      throw createServiceError(400, 'BAD_REQUEST', 'data or typeName missing in request');
    }

    requireSupportedType(requestedTypeName, typeAliases, typeName);

    try {
      const payload = buildPayload(data, { existingRecord: null, recordId: requestedId });
      if (requestedId && payload.id === undefined) {
        payload.id = requestedId;
      }
      const created = await createBackendRecord(appSlug, payload);
      return { recordId: created.id };
    } catch (error) {
      throw normalizeWriteError(error);
    }
  }

  async function patchRecord(body) {
    const data = body?.data;
    const requestedTypeName = body?.typeName;
    const recordId = body?.recordId;

    if (!data || !requestedTypeName || !recordId) {
      throw createServiceError(400, 'BAD_REQUEST', 'data, typeName or recordId missing in request');
    }

    requireSupportedType(requestedTypeName, typeAliases, typeName);

    let existingRecord = null;
    let appSlug = null;
    if (loadExistingRecordById) {
      try {
        existingRecord = await loadExistingRecordById(recordId);
        appSlug = existingRecord?.appSlug || null;
      } catch (lookupError) {
        throw wrapLookupError(lookupError);
      }
    } else {
      appSlug = resolveRequestAppSlug(body, data, 'patchRecord');
    }

    if (loadExistingRecord) {
      if (!existingRecord) {
        try {
          existingRecord = await loadExistingRecord(appSlug, recordId);
        } catch (error) {
          throw wrapLookupError(error);
        }
      }
    }

    try {
      await updateBackendRecord(appSlug, recordId, buildPayload(data, { existingRecord, recordId }));
      return { success: true };
    } catch (error) {
      throw normalizeWriteError(error);
    }
  }

  async function searchRecords(body) {
    const { query, pagination } = normalizeSearchRequest(body);

    if (!query) {
      throw createServiceError(400, 'BAD_REQUEST', 'Query missing in request');
    }

    requireSupportedType(query.from || typeName, typeAliases, typeName);
    const appSlug = resolveSearchAppSlug(body, query);
    const operation = getQueryOperation(query);
    const exactRecordId = getExactRecordId(operation, searchIdFields);
    const records = appSlug
      ? await listRecords(appSlug, buildSearchFilters ? buildSearchFilters(query) : undefined)
      : await loadRecordsById(exactRecordId);
    return {
      records: records
        .map(mapRecordToDataRecord)
        .filter((record) => evaluateOperation(record, operation))
        .slice(pagination.skip, pagination.skip + pagination.limit)
        .map((record) => {
          const filtered = filterAttributes(record, query.attributesToSelect);
          if (!Object.prototype.hasOwnProperty.call(filtered, idField) && record[idField]) {
            filtered[idField] = record[idField];
          }
          return filtered;
        })
    };
  }

  async function loadRecordsById(recordId) {
    if (!recordId || !loadExistingRecordById) {
      throw createServiceError(400, 'BAD_REQUEST', 'searchRecords requires AppSlug unless the query matches an exact record id.');
    }

    try {
      const record = await loadExistingRecordById(recordId);
      return record ? [record] : [];
    } catch (error) {
      if (error?.statusCode === 404) {
        return [];
      }
      throw wrapLookupError(error);
    }
  }

  return {
    createRecord,
    patchRecord,
    searchRecords
  };
}

function resolveSearchAppSlug(body, query) {
  const fromBody = pickFirstDefined(body || {}, ['appSlug', 'AppSlug'])
    || pickFirstDefined(body?.query || {}, ['appSlug', 'AppSlug']);
  const appSlugFromFilter = getLiteralComparisonValue(getQueryOperation(query), 'AppSlug');
  return fromBody || appSlugFromFilter || null;
}

function getExactRecordId(operation, searchIdFields) {
  for (const fieldName of searchIdFields) {
    const value = getLiteralComparisonValue(operation, fieldName);
    if (value) {
      return value;
    }
  }

  return null;
}

module.exports = {
  createDataIoService
};
