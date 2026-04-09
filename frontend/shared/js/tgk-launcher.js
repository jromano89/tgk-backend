(function () {
  const VERTICAL_ICONS = {
    wealth: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 17.5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7 15V9.5M12 15V6.5M17 15V11.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="m7 9.5 4-3 3 2 3-4" stroke="#FF5252" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    healthcare: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="8" y="8" width="8" height="8" rx="1" stroke="#FF5252" stroke-width="1.2"/></svg>',
    insurance: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4 18 6v5.5c0 4.2-2.3 6.9-6 8.5-3.7-1.6-6-4.3-6-8.5V6l6-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 8.2v7.2" stroke="#FF5252" stroke-width="1.6" stroke-linecap="round"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M12 8v8" stroke="#FF5252" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };

  function resolveBackendUrl() {
    if (window.TGK_CONFIG?.backendUrl) {
      return window.TGK_CONFIG.backendUrl;
    }
    const hostname = window.location.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal ? `${window.location.protocol}//${hostname}:3000` : 'https://backend-tgk.up.railway.app';
  }

  async function fetchInstances() {
    try {
      const response = await fetch(`${resolveBackendUrl()}/api/instances`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      console.warn('Failed to fetch instances:', e);
      return [];
    }
  }

  function getVerticalIcon(vertical) {
    return VERTICAL_ICONS[vertical] || VERTICAL_ICONS.default;
  }

  function renderInstanceCard(instance, isSelected) {
    const config = instance.config || {};
    const metadata = config.metadata || {};
    const vertical = metadata.vertical || 'default';
    const name = metadata.name || instance.slug;
    const description = metadata.description || vertical;

    const card = document.createElement('button');
    card.className = 'option-card' + (isSelected ? ' is-selected' : '');
    card.type = 'button';
    card.dataset.option = 'instance';
    card.dataset.value = instance.slug;
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    card.innerHTML = `
      <span class="card-icon" aria-hidden="true">${getVerticalIcon(vertical)}</span>
      <span class="card-copy">
        <span class="card-title">${escapeHtml(name)}</span>
        <span class="card-subtitle">${escapeHtml(description)}</span>
      </span>
    `;
    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function bootLauncher() {
    const heroCopy = document.getElementById('hero-copy');
    const primaryLink = document.getElementById('primary-portal-link');
    const primaryLabel = document.getElementById('primary-portal-label');
    const secondaryLink = document.getElementById('secondary-portal-link');
    const secondaryLabel = document.getElementById('secondary-portal-label');
    const instanceGrid = document.getElementById('instance-grid');
    const onboardingLabel = document.getElementById('onboarding-label');
    const onboardingSubtitle = document.getElementById('onboarding-subtitle');
    const maintenanceLabel = document.getElementById('maintenance-label');
    const maintenanceSubtitle = document.getElementById('maintenance-subtitle');

    if (!primaryLink || !instanceGrid) return;

    const state = {
      instance: null,
      workflow: 'onboarding',
      instances: []
    };

    function getSelectedInstanceConfig() {
      const inst = state.instances.find(i => i.slug === state.instance);
      return inst?.config || null;
    }

    function render() {
      const isOnboarding = state.workflow === 'onboarding';
      const primaryRoute = isOnboarding ? 'advisor/' : 'investor/';
      const secondaryRoute = isOnboarding ? 'investor/' : 'advisor/';
      const instancePrefix = state.instance ? `/i/${state.instance}/` : '';

      // Update selection visuals
      instanceGrid.querySelectorAll('[data-option="instance"]').forEach(btn => {
        const isSelected = btn.dataset.value === state.instance;
        btn.classList.toggle('is-selected', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });

      document.querySelectorAll('[data-option="workflow"]').forEach(btn => {
        const isSelected = btn.dataset.value === state.workflow;
        btn.classList.toggle('is-selected', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });

      // Update workflow labels from instance terminology
      const ic = getSelectedInstanceConfig();
      const t = ic?.terminology || {};
      if (onboardingLabel) onboardingLabel.textContent = t.onboardingWorkflowLabel || 'Onboarding';
      if (onboardingSubtitle) onboardingSubtitle.textContent = t.onboardingAction || 'New account opening, KYC, forms';
      if (maintenanceLabel) maintenanceLabel.textContent = t.maintenanceWorkflowLabel || 'Maintenance';
      if (maintenanceSubtitle) maintenanceSubtitle.textContent = t.maintenanceAction || 'Address changes, beneficiaries, transfers';

      // Primary link follows workflow selection; secondary is the opposite portal
      const advisorLabel = t.advisorPortalLabel || 'Advisor Portal';
      const clientLabel = t.clientPortalLabel || 'Investor Portal';
      const primaryPortalLabel = isOnboarding ? advisorLabel : clientLabel;
      const secondaryPortalLabel = isOnboarding ? clientLabel : advisorLabel;

      primaryLink.href = `${instancePrefix}${primaryRoute}?mode=advanced`;
      if (primaryLabel) primaryLabel.textContent = `Launch ${primaryPortalLabel} \u2192`;

      if (secondaryLink) secondaryLink.href = `${instancePrefix}${secondaryRoute}?mode=advanced`;
      if (secondaryLabel) secondaryLabel.textContent = `Open ${secondaryPortalLabel} \u2192`;
    }

    function bindOptionClicks() {
      document.querySelectorAll('[data-option]').forEach(button => {
        button.addEventListener('click', () => {
          const { option, value } = button.dataset;
          if (option === 'instance') state.instance = value;
          if (option === 'workflow') state.workflow = value;
          render();
        });
      });
    }

    fetchInstances().then(instances => {
      state.instances = instances;
      instanceGrid.innerHTML = '';

      if (instances.length === 0) {
        instanceGrid.innerHTML = '<div class="launcher-loading">No instances found. Start the backend to load instances.</div>';
        return;
      }

      // Default to first instance
      state.instance = instances[0].slug;

      instances.forEach((inst, idx) => {
        const card = renderInstanceCard(inst, idx === 0);
        instanceGrid.appendChild(card);
      });

      // Update column count
      instanceGrid.dataset.columns = String(Math.min(instances.length, 3));

      bindOptionClicks();
      render();
    });

    // Bind workflow buttons immediately (they're static)
    bindOptionClicks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLauncher, { once: true });
    return;
  }

  bootLauncher();
})();
