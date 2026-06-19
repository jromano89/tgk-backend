/**
 * Shared settings state for branding and advanced sidebar controls.
 * Persists to localStorage so the advisor and investor portals stay aligned.
 */

const TGK_DEMO_SETTINGS_STORAGE_KEY = 'tgk_demo_settings';
const TGK_BRANDING_EVENT = 'tgk:branding-change';
const TGK_SIDEBAR_EVENT = 'tgk:sidebar-change';
const TGK_IAM_PRODUCT_OPTIONS = Array.isArray(window.TGK_CONFIG?.iamProducts)
  ? window.TGK_CONFIG.iamProducts.map((product) => ({ ...product }))
  : [];
const TGK_DEFAULT_IAM_PRODUCTS = Array.isArray(window.TGK_CONFIG?.defaultIamProducts)
  ? window.TGK_CONFIG.defaultIamProducts
  : TGK_IAM_PRODUCT_OPTIONS.map((product) => product.key);
const TGK_PORTAL_TONES = {
  advisor: {
    pageBackground: '#f4f5f7',
    sidebarLightness: 12,
    sidebarLightLightness: 20
  },
  investor: {
    pageBackground: '#f5f7fb',
    sidebarLightness: 18,
    sidebarLightLightness: 26
  }
};
const TGK_DEMO_DEFAULTS = {
  branding: {
    appName: window.TGK_CONFIG?.appName || 'TGK Wealth',
    brandColor: window.TGK_CONFIG?.brandColor || '#3b5bdb'
  },
  sidebar: {
    iamProductKeys: normalizeIamProductKeys(TGK_DEFAULT_IAM_PRODUCTS)
  }
};

function normalizeHexColor(value, fallback = TGK_DEMO_DEFAULTS.branding.brandColor) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim() : fallback;
}

function canUseAdvancedCustomizations() {
  return Boolean(window.TGK_ACCESS?.canSeeSettings?.());
}

function normalizeIamProductKeys(keys, fallback = []) {
  const validKeys = new Set(
    TGK_IAM_PRODUCT_OPTIONS.map((product) => String(product.key || '').trim().toLowerCase()).filter(Boolean)
  );
  const source = Array.isArray(keys) ? keys : fallback;
  const normalizedKeys = [];

  source.forEach((key) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!validKeys.has(normalizedKey) || normalizedKeys.includes(normalizedKey)) {
      return;
    }

    normalizedKeys.push(normalizedKey);
  });

  return normalizedKeys;
}

function normalizeBrandingSettings(savedBranding = {}, fallbackBranding = TGK_DEMO_DEFAULTS.branding) {
  const source = savedBranding && typeof savedBranding === 'object' ? savedBranding : {};
  const baseBranding = fallbackBranding && typeof fallbackBranding === 'object'
    ? fallbackBranding
    : TGK_DEMO_DEFAULTS.branding;
  const appNameFallback = String(baseBranding.appName || TGK_DEMO_DEFAULTS.branding.appName);
  const rawAppName = source.appName !== undefined && source.appName !== null
    ? String(source.appName)
    : appNameFallback;

  return {
    appName: rawAppName.trim() ? rawAppName : appNameFallback,
    brandColor: normalizeHexColor(source.brandColor, normalizeHexColor(baseBranding.brandColor))
  };
}

function resolveBrandingAppName(value) {
  if (value !== undefined && value !== null) {
    return normalizeBrandingSettings({ appName: value }).appName;
  }

  const fallbackBranding = window.TGK_DEMO?.branding
    || window.TGK_CONFIG
    || TGK_DEMO_DEFAULTS.branding;

  return normalizeBrandingSettings(fallbackBranding).appName;
}

function getBrandingInitial(value) {
  return (resolveBrandingAppName(value).match(/[A-Za-z0-9]/) || ['T'])[0].toUpperCase();
}

function getBrandingBadgeText(value) {
  return getBrandingInitial(value);
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      default:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  const normalizedS = s / 100;
  const normalizedL = l / 100;
  const alpha = normalizedS * Math.min(normalizedL, 1 - normalizedL);
  const channel = (offset) => {
    const key = (offset + h / 30) % 12;
    return normalizedL - alpha * Math.max(Math.min(key - 3, 9 - key, 1), -1);
  };

  return '#' + [channel(0), channel(8), channel(4)]
    .map((value) => Math.round(value * 255).toString(16).padStart(2, '0'))
    .join('');
}

function deriveBrandLight(hex) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(s + 10, 100), Math.min(l + 15, 85));
}

function deriveSidebarColor(hex, portalTone) {
  const [h, s] = hexToHsl(hex);
  return hslToHex(h, Math.max(s * 0.4, 15), portalTone.sidebarLightness);
}

function deriveSidebarLightColor(hex, portalTone) {
  const [h, s] = hexToHsl(hex);
  return hslToHex(h, Math.max(s * 0.35, 12), portalTone.sidebarLightLightness);
}

function getPortalTone(portalName = document.body?.dataset.portal || document.documentElement?.dataset.portal || 'advisor') {
  return TGK_PORTAL_TONES[portalName] || TGK_PORTAL_TONES.advisor;
}

function applyThemeVariables(target, variables) {
  if (!target) return;

  Object.entries(variables).forEach(([name, value]) => {
    target.style.setProperty(name, value);
  });
}

function resolveSidebarSettings(savedSidebar = {}) {
  if (Array.isArray(savedSidebar.iamProductKeys)) {
    return {
      iamProductKeys: normalizeIamProductKeys(savedSidebar.iamProductKeys)
    };
  }

  return {
    iamProductKeys: normalizeIamProductKeys(TGK_DEMO_DEFAULTS.sidebar.iamProductKeys)
  };
}

function resolveCurrentSettings(savedCurrent = {}, fallbackCurrent = TGK_DEMO_DEFAULTS) {
  const source = savedCurrent && typeof savedCurrent === 'object' ? savedCurrent : {};
  const fallback = fallbackCurrent && typeof fallbackCurrent === 'object'
    ? fallbackCurrent
    : TGK_DEMO_DEFAULTS;

  return {
    branding: normalizeBrandingSettings(source.branding || {}, fallback.branding || TGK_DEMO_DEFAULTS.branding),
    sidebar: resolveSidebarSettings(source.sidebar || fallback.sidebar || TGK_DEMO_DEFAULTS.sidebar)
  };
}

function createProfileId() {
  return 'profile_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function normalizeTimestamp(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeProfile(profile = {}, seenIds = new Set()) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const normalizedCurrent = resolveCurrentSettings({
    branding: source.branding || {},
    sidebar: source.sidebar || {}
  });
  const createdAt = normalizeTimestamp(source.createdAt, new Date().toISOString());
  const updatedAt = normalizeTimestamp(source.updatedAt, createdAt);
  let id = String(source.id || '').trim();

  if (!id || seenIds.has(id)) {
    id = createProfileId();
  }
  seenIds.add(id);

  return {
    id,
    name: String(source.name || '').trim() || normalizedCurrent.branding.appName,
    branding: normalizedCurrent.branding,
    sidebar: normalizedCurrent.sidebar,
    createdAt,
    updatedAt
  };
}

function normalizeStoredSettings(rawSettings = {}) {
  const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const hasCurrentSettings = source.current && typeof source.current === 'object';
  const legacyCurrent = hasCurrentSettings
    ? source.current
    : {
        branding: source.branding || {},
        sidebar: source.sidebar || {}
      };
  const seenIds = new Set();

  return {
    current: resolveCurrentSettings(legacyCurrent),
    profiles: Array.isArray(source.profiles)
      ? source.profiles.map((profile) => normalizeProfile(profile, seenIds))
      : []
  };
}

function readStoredSettings() {
  try {
    const storedValue = window.localStorage.getItem(TGK_DEMO_SETTINGS_STORAGE_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : {};
    return normalizeStoredSettings(parsed);
  } catch (error) {
    return normalizeStoredSettings();
  }
}

function writeStoredSettings(settings) {
  try {
    window.localStorage.setItem(TGK_DEMO_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeStoredSettings(settings)));
  } catch (error) {}
}

function buildDemoSettingsSnapshot(currentSettings = {}) {
  const resolvedCurrent = resolveCurrentSettings(currentSettings);
  const isAdvanced = canUseAdvancedCustomizations();

  return {
    branding: isAdvanced
      ? resolvedCurrent.branding
      : { ...TGK_DEMO_DEFAULTS.branding },
    sidebar: isAdvanced
      ? resolvedCurrent.sidebar
      : { iamProductKeys: [] },
    DEFAULTS: TGK_DEMO_DEFAULTS
  };
}

function syncRuntimeSidebar(nextSidebar) {
  if (!window.TGK_DEMO) {
    window.TGK_DEMO = buildDemoSettingsSnapshot(readStoredSettings().current);
  }

  const resolvedSidebar = resolveSidebarSettings({
    ...(window.TGK_DEMO.sidebar || {}),
    ...nextSidebar
  });

  window.TGK_DEMO.sidebar = resolvedSidebar;
  return resolvedSidebar;
}

function dispatchSidebarChange(nextSidebar) {
  window.dispatchEvent(new CustomEvent(TGK_SIDEBAR_EVENT, {
    detail: resolveSidebarSettings(nextSidebar)
  }));
}

function applyThemeColor(brandColor) {
  const portalTone = getPortalTone();
  const variables = {
    '--color-brand': brandColor,
    '--color-brand-light': deriveBrandLight(brandColor),
    '--color-navy': deriveSidebarColor(brandColor, portalTone),
    '--color-navy-light': deriveSidebarLightColor(brandColor, portalTone),
    '--tgk-page-bg': portalTone.pageBackground
  };

  applyThemeVariables(document.documentElement, variables);
  applyThemeVariables(document.body, variables);
}

function applyBrandingPreview(nextBranding = {}) {
  const sourceBranding = canUseAdvancedCustomizations()
    ? nextBranding
    : TGK_DEMO_DEFAULTS.branding;
  const branding = normalizeBrandingSettings(sourceBranding);

  if (!window.TGK_DEMO) {
    window.TGK_DEMO = buildDemoSettingsSnapshot(readStoredSettings().current);
  }

  window.TGK_DEMO.branding = {
    ...(window.TGK_DEMO.branding || {}),
    ...branding
  };

  applyThemeColor(branding.brandColor);
  window.dispatchEvent(new CustomEvent(TGK_BRANDING_EVENT, { detail: branding }));
  return branding;
}

function applyCurrentSettings(currentSettings = {}) {
  const resolvedCurrent = resolveCurrentSettings(currentSettings);
  applyBrandingPreview(resolvedCurrent.branding);
  syncRuntimeSidebar(resolvedCurrent.sidebar);
  dispatchSidebarChange(resolvedCurrent.sidebar);
  return resolvedCurrent;
}

function commitSettingsStore(nextStore, { applyCurrent = true } = {}) {
  const normalizedStore = normalizeStoredSettings(nextStore);
  writeStoredSettings(normalizedStore);

  if (applyCurrent) {
    applyCurrentSettings(normalizedStore.current);
  }

  return normalizedStore;
}

function persistCurrentSettings({ branding, sidebar } = {}) {
  const existing = readStoredSettings();
  const nextCurrent = resolveCurrentSettings({
    branding: {
      ...(existing.current.branding || {}),
      ...(branding || {})
    },
    sidebar: sidebar !== undefined ? sidebar : (existing.current.sidebar || {})
  });

  return commitSettingsStore({
    current: nextCurrent,
    profiles: existing.profiles
  });
}

function createBrandingState() {
  const initialAppName = resolveBrandingAppName();

  return {
    brandingAppName: initialAppName,
    brandingInitial: getBrandingInitial(initialAppName),
    _brandingChangeHandler: null,

    syncBranding(detail = {}) {
      this.brandingAppName = resolveBrandingAppName(detail.appName);
      this.brandingInitial = getBrandingInitial(this.brandingAppName);
    },

    initializeBrandingState() {
      this.syncBranding();
      if (this._brandingChangeHandler) {
        return;
      }

      this._brandingChangeHandler = (event) => this.syncBranding(event.detail || {});
      window.addEventListener(TGK_BRANDING_EVENT, this._brandingChangeHandler);
    }
  };
}

(function initializeDemoTheme() {
  const store = readStoredSettings();
  window.TGK_DEMO = buildDemoSettingsSnapshot(store.current);
  applyBrandingPreview(window.TGK_DEMO.branding);
})();

function settingsPanelState() {
  const initialStore = readStoredSettings();

  return {
    appNameDraft: initialStore.current.branding.appName,
    brandColor: initialStore.current.branding.brandColor,
    sidebarProductKeys: [...(initialStore.current.sidebar?.iamProductKeys || [])],
    profiles: initialStore.profiles,
    docusignConsentBusy: false,
    docusignConsentStatus: 'idle',
    docusignConsentMessage: '',
    // 'unknown' until probed; 'connected' if a token mints, 'disconnected' otherwise.
    docusignConnection: 'unknown',

    async probeDocusignConnection() {
      if (!this.hasDocusignAuthConfig()) {
        this.docusignConnection = 'disconnected';
        return;
      }

      this.docusignConnection = 'checking';
      try {
        await window.TGK_API.getDocusignAccessToken();
        this.docusignConnection = 'connected';
      } catch (error) {
        this.docusignConnection = 'disconnected';
      }
    },

    isDocusignConnected() {
      return this.docusignConnection === 'connected';
    },

    syncStateFromCurrent(nextCurrent = {}) {
      const resolvedCurrent = resolveCurrentSettings(nextCurrent);
      this.appNameDraft = resolvedCurrent.branding.appName;
      this.brandColor = resolvedCurrent.branding.brandColor;
      this.sidebarProductKeys = [...resolvedCurrent.sidebar.iamProductKeys];
    },

    syncProfiles(nextProfiles = []) {
      const seenIds = new Set();
      this.profiles = nextProfiles.map((profile) => normalizeProfile(profile, seenIds));
    },

    currentBranding() {
      return normalizeBrandingSettings({
        appName: this.appNameDraft,
        brandColor: this.brandColor
      });
    },

    currentSidebar() {
      return resolveSidebarSettings({
        iamProductKeys: this.sidebarProductKeys
      });
    },

    currentSettings() {
      return {
        branding: this.currentBranding(),
        sidebar: this.currentSidebar()
      };
    },

    sidebarOptions() {
      return TGK_IAM_PRODUCT_OPTIONS;
    },

    profileMatchesCurrent(profile = {}) {
      const current = this.currentSettings();
      const resolvedProfile = resolveCurrentSettings({
        branding: profile.branding || {},
        sidebar: profile.sidebar || {}
      });

      return current.branding.appName === resolvedProfile.branding.appName
        && current.branding.brandColor === resolvedProfile.branding.brandColor
        && JSON.stringify(current.sidebar.iamProductKeys) === JSON.stringify(resolvedProfile.sidebar.iamProductKeys);
    },

    promptProfileName(defaultName = this.currentBranding().appName) {
      const response = window.prompt('Profile name', String(defaultName || this.currentBranding().appName || '').trim());
      if (response === null) {
        return null;
      }

      const trimmed = String(response).trim();
      return trimmed || this.currentBranding().appName;
    },

    getProfile(profileId) {
      const id = String(profileId || '').trim();
      return this.profiles.find((profile) => profile.id === id) || null;
    },

    profileBadgeText(profile = {}) {
      return getBrandingBadgeText(profile.branding?.appName || profile.name || TGK_DEMO_DEFAULTS.branding.appName);
    },

    profileBadgeStyle(profile = {}) {
      const branding = normalizeBrandingSettings(profile.branding || {});
      return '--tgk-profile-preview-color:' + branding.brandColor + ';--tgk-profile-preview-light:' + deriveBrandLight(branding.brandColor) + ';';
    },

    get docusignConfig() {
      return window.TGK_API?.getDocusignAuthConfig?.() || {
        userId: '',
        accountId: '',
        scopes: ''
      };
    },

    hasDocusignAuthConfig() {
      return !!window.TGK_API?.hasDocusignAuthConfig?.();
    },

    async grantDocusignConsent() {
      if (this.docusignConsentBusy) {
        return;
      }

      this.docusignConsentBusy = true;
      this.docusignConsentStatus = 'working';
      this.docusignConsentMessage = 'Waiting for popup...';

      try {
        await window.TGK_API.startDocusignConsent();
        window.TGK_API.clearDocusignTokenCache();
        this.docusignConsentStatus = 'success';
        this.docusignConsentMessage = 'Consent granted.';
        await this.probeDocusignConnection();
      } catch (error) {
        this.docusignConsentStatus = 'error';
        this.docusignConsentMessage = error.message || 'Consent failed.';
      } finally {
        this.docusignConsentBusy = false;
      }
    },

    isSidebarProductEnabled(productKey) {
      const key = String(productKey || '').trim().toLowerCase();
      return this.sidebarProductKeys.includes(key);
    },

    toggleSidebarProduct(productKey, enabled) {
      const key = String(productKey || '').trim().toLowerCase();
      const selectedKeys = new Set(this.sidebarProductKeys);

      if (enabled) {
        selectedKeys.add(key);
      } else {
        selectedKeys.delete(key);
      }

      this.sidebarProductKeys = TGK_IAM_PRODUCT_OPTIONS
        .map((product) => product.key)
        .filter((productKeyValue) => selectedKeys.has(productKeyValue));

      this.applySettingsUpdate();
    },

    applySettingsUpdate() {
      const nextStore = persistCurrentSettings(this.currentSettings());
      this.syncStateFromCurrent(nextStore.current);
      this.syncProfiles(nextStore.profiles);
    },

    previewAppName() {
      const draftValue = String(this.appNameDraft || '');
      if (!draftValue.trim()) {
        return;
      }

      applyBrandingPreview({
        appName: draftValue,
        brandColor: this.brandColor
      });
    },

    commitAppName() {
      this.applySettingsUpdate();
    },

    updateBrandColor(hex) {
      this.brandColor = normalizeHexColor(hex);
      this.applySettingsUpdate();
    },

    resetAllDefaults() {
      this.appNameDraft = TGK_DEMO_DEFAULTS.branding.appName;
      this.brandColor = TGK_DEMO_DEFAULTS.branding.brandColor;
      this.sidebarProductKeys = [...TGK_DEMO_DEFAULTS.sidebar.iamProductKeys];
      this.applySettingsUpdate();
    },

    saveCurrentAsProfile() {
      const profileName = this.promptProfileName();
      if (!profileName) {
        return;
      }

      const timestamp = new Date().toISOString();
      const existing = readStoredSettings();
      const nextProfile = normalizeProfile({
        id: createProfileId(),
        name: profileName,
        ...this.currentSettings(),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      const nextStore = commitSettingsStore({
        current: this.currentSettings(),
        profiles: [...existing.profiles, nextProfile]
      });

      this.syncStateFromCurrent(nextStore.current);
      this.syncProfiles(nextStore.profiles);
    },

    loadProfile(profileId) {
      const profile = this.getProfile(profileId);
      if (!profile) {
        return;
      }

      const nextStore = persistCurrentSettings({
        branding: profile.branding,
        sidebar: profile.sidebar
      });

      this.syncStateFromCurrent(nextStore.current);
      this.syncProfiles(nextStore.profiles);
    },

    saveProfile(profileId) {
      const existing = readStoredSettings();
      const profile = existing.profiles.find((item) => item.id === profileId);
      if (!profile) {
        return;
      }

      if (!window.confirm('Replace "' + profile.name + '" with the current settings?')) {
        return;
      }

      const nextProfile = normalizeProfile({
        ...profile,
        ...this.currentSettings(),
        updatedAt: new Date().toISOString()
      });
      const nextStore = commitSettingsStore({
        current: this.currentSettings(),
        profiles: existing.profiles.map((item) => (item.id === profileId ? nextProfile : item))
      });

      this.syncStateFromCurrent(nextStore.current);
      this.syncProfiles(nextStore.profiles);
    },

    deleteProfile(profileId) {
      const profile = this.getProfile(profileId);
      if (!profile) {
        return;
      }

      if (!window.confirm('Delete "' + profile.name + '"?')) {
        return;
      }

      const existing = readStoredSettings();
      const nextStore = commitSettingsStore({
        current: this.currentSettings(),
        profiles: existing.profiles.filter((item) => item.id !== profileId)
      });

      this.syncStateFromCurrent(nextStore.current);
      this.syncProfiles(nextStore.profiles);
    }
  };
}
