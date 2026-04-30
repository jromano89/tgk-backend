(function () {
  const APP_SLUG = 'tgk-wealth';
  const APP_NAME = 'TGK Wealth';
  const DOCUSIGN_USER_ID = '26016859-d095-4c40-8892-0de438e2a226';
  const DOCUSIGN_ACCOUNT_ID = '18ecd535-9f12-4c7f-8cf3-caf870d86437';
  const DOCUSIGN_SCOPES = 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read dtr.rooms.write dtr.rooms.read';
  
  const BACKEND_URL = 'https://backend-tgk.up.railway.app';
  const DOCUSIGN_IAM_BASE_URL = 'https://api-d.docusign.com';
  const DOCUSIGN_ESIGN_BASE_URL = 'https://demo.docusign.net/restapi';
  const ADVISOR_ID = '4871abfa-8868-4501-b068-5936c6363e6b';
  const BRAND_COLOR = '#3b5bdb';
  const DEFAULT_MODE = 'advanced';

    // Workspaces related info 
  const BROKERAGE_TEMPLATE = '0592aafb-bb9b-413b-9aa4-59f3445ece36';
  const TRUST_TEMPLATE = 'd9f1a8b7-ba8c-4069-a25b-f5852a249b51';
  const WORKSPACE_ACCOUNT_ID = '0b7c5d32-60a7-46b5-a285-be08008b14f6';
  const WORKSPACE_ACCOUNT_USERID = '5bb3a74f-35d8-4f57-a4cf-513797c6b213';

  const WORKFLOWS = Object.freeze({
    accountOpeningId: '12319d8c-4ee5-464b-88d0-f27a03638bcb',
    assetTransferId: 'b59acbee-8052-403a-a752-c04287ad6ee1',
    accountMaintenanceId: 'b59acbee-8052-403a-a752-c04287ad6ee1'
  });
  const IAM_PRODUCTS = Object.freeze([
    { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
    { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
    { key: 'monitor', label: 'Monitor', icon: 'monitor' },
    { key: 'notary', label: 'Notary', icon: 'notary' },
    { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
    { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
  ]);

  function resolveBackendUrl() {
    const hostname = window.location.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
      return `${window.location.protocol}//${hostname}:3000`;
    }

    return BACKEND_URL;
  }

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

  const mode = resolveMode();

  window.TGK_CONFIG = {
    appSlug: APP_SLUG,
    appName: APP_NAME,
    brandColor: BRAND_COLOR,
    backendUrl: resolveBackendUrl(),
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
    iamProducts: IAM_PRODUCTS.map((product) => ({ ...product })),
    mode
  };

  window.TGK_ACCESS = createAccess(mode);
})();
