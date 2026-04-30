(function () {
  const MODE_NORMAL = 'normal';
  const MODE_ADVANCED = 'advanced';

  const portals = {
    advisor: { path: 'advisor/' },
    investor: { path: 'investor/' }
  };

  function normalizeMode(value, fallback) {
    const normalized = String(value || fallback || '').trim().toLowerCase();
    return normalized === MODE_NORMAL ? MODE_NORMAL : MODE_ADVANCED;
  }

  function buildHref(pathname, mode) {
    const url = new URL(pathname, window.location.href);
    url.searchParams.set('mode', mode);
    return `${url.pathname}${url.search}`;
  }

  function readInitialMode() {
    const params = new URL(window.location.href).searchParams;
    const configuredDefault = normalizeMode(window.TGK_CONFIG?.defaultMode, MODE_ADVANCED);
    return normalizeMode(params.get('mode'), configuredDefault);
  }

  function syncUrl(mode) {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('mode', mode);
    window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}`);
  }

  function bootLauncher() {
    const modeToggle = document.getElementById('global-advanced-toggle');
    const backendServiceLink = document.getElementById('backend-service-link');

    if (!modeToggle) {
      return;
    }

    const state = {
      mode: readInitialMode()
    };

    function render() {
      const isAdvanced = state.mode === MODE_ADVANCED;
      modeToggle.checked = isAdvanced;

      Object.keys(portals).forEach((portalKey) => {
        const link = document.getElementById(`${portalKey}-tile-link`);
        if (!link) {
          return;
        }
        link.href = buildHref(portals[portalKey].path, state.mode);
      });

      document.body.dataset.mode = state.mode;
      syncUrl(state.mode);
    }

    modeToggle.addEventListener('change', () => {
      state.mode = modeToggle.checked ? MODE_ADVANCED : MODE_NORMAL;
      render();
    });

    if (backendServiceLink) {
      backendServiceLink.href = window.TGK_CONFIG?.backendUrl || '#';
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLauncher, { once: true });
    return;
  }

  bootLauncher();
})();
