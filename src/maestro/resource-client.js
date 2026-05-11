let resourceAccess = null;

function requireResource(resourceName) {
  const resource = resourceAccess?.[resourceName];
  if (!resource) {
    throw new Error(`Maestro resource access is not configured for "${resourceName}".`);
  }

  return resource;
}

function setResourceAccess(nextAccess) {
  resourceAccess = nextAccess || null;
}

function createResourceClient(resourceName) {
  return {
    create(appSlug, payload) {
      return requireResource(resourceName).create(appSlug, payload);
    },
    get(appSlug, id) {
      return requireResource(resourceName).get(appSlug, id);
    },
    getById(id) {
      return requireResource(resourceName).get(null, id);
    },
    list(appSlug, query) {
      return requireResource(resourceName).list(appSlug, query);
    },
    update(appSlug, id, payload) {
      return requireResource(resourceName).update(appSlug, id, payload);
    }
  };
}

module.exports = { createResourceClient, setResourceAccess };
