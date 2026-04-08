(function () {
  // --- Resolve instance slug from URL path prefix /i/:slug/ ---
  const instanceMatch = window.location.pathname.match(/^\/i\/([^/]+)\//);
  const instanceSlug = instanceMatch ? instanceMatch[1] : null;

  // --- Resolve backend URL ---
  const FALLBACK_BACKEND_URL = 'https://backend-tgk.up.railway.app';

  function resolveBackendUrl() {
    const hostname = window.location.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
      return `${window.location.protocol}//${hostname}:3000`;
    }

    return FALLBACK_BACKEND_URL;
  }

  const backendUrl = resolveBackendUrl();

  // --- Fetch instance config from backend API ---
  function fetchInstanceConfig(slug) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${backendUrl}/api/instances/${encodeURIComponent(slug)}`, false);
      xhr.send();
      if (xhr.status === 200) {
        return JSON.parse(xhr.responseText).config;
      }
    } catch (e) {
      console.warn('Failed to fetch instance config for slug:', slug, e);
    }

    return null;
  }

  // --- Build config from instance or defaults ---
  const ic = instanceSlug ? fetchInstanceConfig(instanceSlug) : null;

  const APP_SLUG = ic ? instanceSlug : 'tgk-wealth';
  const APP_NAME = ic?.metadata?.name || 'TGK Wealth';
  const DOCUSIGN_USER_ID = ic?.docusign?.userId || '26016859-d095-4c40-8892-0de438e2a226';
  const DOCUSIGN_ACCOUNT_ID = ic?.docusign?.accountId || '18ecd535-9f12-4c7f-8cf3-caf870d86437';
  const DOCUSIGN_SCOPES = ic?.docusign?.scopes || 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read dtr.rooms.write dtr.rooms.read';
  const DOCUSIGN_IAM_BASE_URL = ic?.docusign?.baseUrl || 'https://api-d.docusign.com';
  const DOCUSIGN_ESIGN_BASE_URL = ic?.docusign?.esignBaseUrl || 'https://demo.docusign.net/restapi';
  const ADVISOR_ID = ic?.advisorId || '4871abfa-8868-4501-b068-5936c6363e6b';
  const BRAND_COLOR = ic?.branding?.color || '#3b5bdb';
  const DEFAULT_MODE = ic?.defaultMode || 'advanced';

  // Workspaces related info
  const BROKERAGE_TEMPLATE = ic?.workspaces?.brokerageTemplate || '0592aafb-bb9b-413b-9aa4-59f3445ece36';
  const TRUST_TEMPLATE = ic?.workspaces?.trustTemplate || 'd9f1a8b7-ba8c-4069-a25b-f5852a249b51';
  const WORKSPACE_ACCOUNT_ID = ic?.workspaces?.accountId || '0b7c5d32-60a7-46b5-a285-be08008b14f6';
  const WORKSPACE_ACCOUNT_USERID = ic?.workspaces?.accountUserId || '5bb3a74f-35d8-4f57-a4cf-513797c6b213';

  const WORKFLOWS = Object.freeze({
    accountOpeningId: ic?.workflows?.onboardingId || 'e26e565e-fb6a-433b-b004-bd2083c8963b',
    assetTransferId: ic?.workflows?.maintenanceId || 'b59acbee-8052-403a-a752-c04287ad6ee1',
    accountMaintenanceId: ic?.workflows?.accountMaintenanceId || 'b59acbee-8052-403a-a752-c04287ad6ee1'
  });

  const defaultIamProducts = [
    { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
    { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
    { key: 'monitor', label: 'Monitor', icon: 'monitor' },
    { key: 'notary', label: 'Notary', icon: 'notary' },
    { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
    { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
  ];

  const IAM_PRODUCTS = Object.freeze(
    Array.isArray(ic?.iamProducts) ? ic.iamProducts : defaultIamProducts
  );

  function normalizeMode(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'normal' ? 'normal' : DEFAULT_MODE;
  }

  function resolveMode() {
    return normalizeMode(new URL(window.location.href).searchParams.get('mode'));
  }

  function createAccess(mode) {
    const isAdvanced = mode === 'advanced';

    return {
      mode,
      isAdvanced,
      canSeeSettings() {
        return isAdvanced;
      },
      canSeeIamProducts() {
        return isAdvanced;
      }
    };
  }

  // --- Compute instance base path for relative navigation ---
  const instanceBasePath = instanceSlug ? `/i/${instanceSlug}` : '';

  const mode = resolveMode();

  window.TGK_CONFIG = {
    appSlug: APP_SLUG,
    appName: APP_NAME,
    brandColor: BRAND_COLOR,
    backendUrl,
    docusignIamBaseUrl: DOCUSIGN_IAM_BASE_URL,
    docusignEsignBaseUrl: DOCUSIGN_ESIGN_BASE_URL,
    docusignAuth: {
      userId: DOCUSIGN_USER_ID,
      accountId: DOCUSIGN_ACCOUNT_ID,
      scopes: DOCUSIGN_SCOPES
    },
    advisorId: ADVISOR_ID,
    defaultMode: DEFAULT_MODE,
    workflows: { ...WORKFLOWS },
    workspaces: {
      brokerageTemplate: BROKERAGE_TEMPLATE,
      trustTemplate: TRUST_TEMPLATE,
      accountId: WORKSPACE_ACCOUNT_ID,
      accountUserId: WORKSPACE_ACCOUNT_USERID
    },
    iamProducts: IAM_PRODUCTS.map((product) => ({ ...product })),
    mode,
    instanceSlug: instanceSlug || null,
    instanceBasePath,
    instanceConfig: ic || null,
    terminology: ic?.terminology || null,
    kpis: ic?.kpis || null,
    agreements: ic?.agreements || null
  };

  window.TGK_ACCESS = createAccess(mode);
})();
