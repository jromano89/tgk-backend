function toCamelCase(value) {
  return String(value || '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function serializeValue(key, value) {
  if (key === 'data') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeRecord(item));
  }

  if (value && typeof value === 'object') {
    return serializeRecord(value);
  }

  return value;
}

function serializeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [toCamelCase(key), serializeValue(key, value)])
  );
}

function serializeRecords(records) {
  return Array.isArray(records) ? records.map(serializeRecord) : [];
}

module.exports = {
  serializeRecord,
  serializeRecords,
  toCamelCase
};
