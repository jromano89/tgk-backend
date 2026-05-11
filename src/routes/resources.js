const express = require('express');
const { getDb } = require('../database');
const { subscribeDataEvents } = require('../data-events');
const service = require('../resources/service');
const { requireAppSlug, route } = require('../utils');

const router = express.Router();

function withApp(handler) {
  return route((req, res) => {
    const db = getDb();
    const appSlug = requireAppSlug(req);
    return handler(req, res, db, appSlug);
  });
}

function created(res, payload) {
  res.status(201).json(payload);
}

router.get('/events', route((req, res) => {
  subscribeDataEvents(requireAppSlug(req), res);
}));

Object.entries(service.RESOURCE_DEFINITIONS).forEach(([resourceKey, resource]) => {
  const collectionPath = `/${resourceKey}`;
  const itemPath = `${collectionPath}/:id`;

  router.get(collectionPath, withApp((req, res, db, appSlug) => {
    res.json(service.listRecordsForApp(db, appSlug, resourceKey, req.query));
  }));

  router.get(itemPath, withApp((req, res, db, appSlug) => {
    res.json(service.getRecordForApp(db, appSlug, resourceKey, req.params.id, req.query));
  }));

  router.post(collectionPath, withApp((req, res, db, appSlug) => {
    created(res, service.createRecordForApp(db, appSlug, resourceKey, req.body));
  }));

  router.put(itemPath, withApp((req, res, db, appSlug) => {
    res.json(service.updateRecordForApp(db, appSlug, resourceKey, req.params.id, req.body));
  }));

  if (resource.allowDelete) {
    router.delete(itemPath, withApp((req, res, db, appSlug) => {
      res.json(service.deleteRecordForApp(db, appSlug, resourceKey, req.params.id));
    }));
  }
});

module.exports = router;
