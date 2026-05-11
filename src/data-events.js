const { normalizeSlug } = require('./utils');

const HEARTBEAT_MS = 25000;
const clientsByAppSlug = new Map();

function writeSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function getClients(appSlug) {
  const normalizedAppSlug = normalizeSlug(appSlug);
  if (!normalizedAppSlug) {
    return null;
  }

  if (!clientsByAppSlug.has(normalizedAppSlug)) {
    clientsByAppSlug.set(normalizedAppSlug, new Set());
  }

  return clientsByAppSlug.get(normalizedAppSlug);
}

function removeClient(appSlug, client) {
  const clients = clientsByAppSlug.get(appSlug);
  if (!clients) {
    return;
  }

  if (client.heartbeatTimer) {
    clearInterval(client.heartbeatTimer);
    client.heartbeatTimer = null;
  }
  clients.delete(client);
  if (clients.size === 0) {
    clientsByAppSlug.delete(appSlug);
  }
}

function subscribeDataEvents(appSlug, res) {
  const normalizedAppSlug = normalizeSlug(appSlug);
  const clients = getClients(normalizedAppSlug);
  const client = { res, heartbeatTimer: null };

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  clients.add(client);
  writeSseEvent(res, 'connected', {
    type: 'connected',
    appSlug: normalizedAppSlug,
    timestamp: new Date().toISOString()
  });

  client.heartbeatTimer = setInterval(() => {
    try {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } catch (error) {
      cleanup();
    }
  }, HEARTBEAT_MS);
  client.heartbeatTimer.unref?.();

  function cleanup() {
    removeClient(normalizedAppSlug, client);
  }

  res.on('close', cleanup);
  res.on('error', cleanup);
}

function publishDataChange({ appSlug, resource, action, id, record }) {
  const normalizedAppSlug = normalizeSlug(appSlug);
  const clients = clientsByAppSlug.get(normalizedAppSlug);
  if (!clients || clients.size === 0) {
    return;
  }

  const payload = {
    type: 'data.changed',
    appSlug: normalizedAppSlug,
    resource,
    action,
    id,
    record: record || null,
    timestamp: new Date().toISOString()
  };

  for (const client of clients) {
    try {
      writeSseEvent(client.res, 'data.changed', payload);
    } catch (error) {
      removeClient(normalizedAppSlug, client);
    }
  }
}

module.exports = {
  publishDataChange,
  subscribeDataEvents
};
