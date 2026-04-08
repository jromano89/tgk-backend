(function () {
  const STEPS = [
    { id: 'vertical', title: 'Storyline', desc: 'Choose an industry vertical and demo storyline.' },
    { id: 'identity', title: 'Identity', desc: 'Name and brand your portal instance.' },
    { id: 'terminology', title: 'Terminology', desc: 'Customize role labels and actions.' },
    { id: 'review', title: 'Review & Create', desc: 'Review your configuration and create.' }
  ];

  function resolveBackendUrl() {
    if (window.TGK_CONFIG?.backendUrl) return window.TGK_CONFIG.backendUrl;
    const hostname = window.location.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal ? `${window.location.protocol}//${hostname}:3000` : 'https://backend-tgk.up.railway.app';
  }

  function slugify(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function fetchPresets() {
    const res = await fetch(`${resolveBackendUrl()}/api/instances/presets`);
    if (!res.ok) throw new Error('Failed to load presets');
    return res.json();
  }

  function bootWizard() {
    const stepsContainer = document.getElementById('wizard-steps');
    const contentContainer = document.getElementById('wizard-content');
    const backBtn = document.getElementById('wizard-back');
    const nextBtn = document.getElementById('wizard-next');

    if (!stepsContainer || !contentContainer || !backBtn || !nextBtn) return;

    let currentStep = 0;
    let creating = false;
    let created = false;
    let verticals = [];
    let presets = [];

    const formData = {
      vertical: null,
      presetKey: null,
      companyName: '',
      brandColor: '#3b5bdb',
      terminology: {}
    };

    // Load presets then render
    fetchPresets().then(data => {
      verticals = data.verticals;
      presets = data.presets;
      renderStep();
    }).catch(() => {
      contentContainer.innerHTML = '<p class="wizard-error">Failed to load storyline presets. Is the backend running?</p>';
    });

    function renderStepDots() {
      stepsContainer.innerHTML = STEPS.map((step, i) => {
        const cls = i < currentStep ? 'wizard-step-dot--done' : (i === currentStep ? 'wizard-step-dot--active' : '');
        return `<div class="wizard-step-dot ${cls}"></div>`;
      }).join('');
    }

    function readFormInputs() {
      contentContainer.querySelectorAll('[data-field]').forEach(el => {
        const field = el.dataset.field;
        if (field.startsWith('t.')) {
          formData.terminology[field.slice(2)] = el.value;
        } else if (field === 'brandColor') {
          formData.brandColor = el.value;
        } else {
          formData[field] = el.value;
        }
      });
    }

    function getPresetsForVertical(verticalKey) {
      return presets.filter(p => p.vertical === verticalKey);
    }

    function renderStep() {
      readFormInputs();

      const step = STEPS[currentStep];
      let html = `<h2 class="wizard-section-title">${step.title}</h2><p class="wizard-section-desc">${step.desc}</p>`;

      if (step.id === 'vertical') {
        // Vertical cards (top row)
        html += '<div class="wizard-vertical-grid">';
        verticals.forEach(v => {
          const sel = formData.vertical === v.key ? ' wizard-vertical-card--selected' : '';
          const count = getPresetsForVertical(v.key).length;
          html += `<div class="wizard-vertical-card${sel}" data-vertical="${v.key}">
            <div class="wizard-vertical-card__title">${v.title}</div>
            <div class="wizard-vertical-card__desc">${v.desc}</div>
            <div class="wizard-vertical-card__count">${count} storyline${count !== 1 ? 's' : ''}</div>
          </div>`;
        });
        html += '</div>';

        // Storyline cards (below, for selected vertical)
        if (formData.vertical) {
          const vPresets = getPresetsForVertical(formData.vertical);
          if (vPresets.length) {
            html += '<div class="wizard-storyline-list">';
            vPresets.forEach(p => {
              const sel = formData.presetKey === p.key ? ' wizard-storyline-card--selected' : '';
              const badges = (p.highlightedProducts || []).map(k =>
                `<span class="wizard-product-badge">${escapeHtml(k)}</span>`
              ).join('');
              html += `<div class="wizard-storyline-card${sel}" data-preset="${p.key}">
                <div class="wizard-storyline-card__header">
                  <span class="wizard-storyline-card__color" style="background:${p.brandColor}"></span>
                  <span class="wizard-storyline-card__title">${escapeHtml(p.title)}</span>
                </div>
                <div class="wizard-storyline-card__desc">${escapeHtml(p.description)}</div>
                <div class="wizard-storyline-card__badges">${badges}</div>
              </div>`;
            });
            html += '</div>';
          }
        }
      }

      if (step.id === 'identity') {
        html += `
          <div class="wizard-field">
            <label class="wizard-label">Company / Portal Name</label>
            <input class="wizard-input" data-field="companyName" value="${escapeHtml(formData.companyName)}" placeholder="e.g. Acme Wealth">
          </div>
          <div class="wizard-field">
            <label class="wizard-label">Brand Color</label>
            <div class="wizard-color-row">
              <label class="wizard-color-swatch" style="background:${formData.brandColor}">
                <input type="color" data-field="brandColor" value="${formData.brandColor}">
              </label>
              <span style="color:#94a3b8;font-size:0.85rem;" id="color-hex">${formData.brandColor}</span>
            </div>
          </div>
        `;
      }

      if (step.id === 'terminology') {
        const t = formData.terminology;
        const fields = [
          ['advisorRole', 'Primary Role (Advisor-side)', t.advisorRole],
          ['clientRole', 'Client Role', t.clientRole],
          ['clientRolePlural', 'Client Role (Plural)', t.clientRolePlural],
          ['advisorPortalLabel', 'Advisor Portal Label', t.advisorPortalLabel],
          ['clientPortalLabel', 'Client Portal Label', t.clientPortalLabel],
          ['clientBookLabel', 'Client Book Label', t.clientBookLabel],
          ['onboardingAction', 'Onboarding Action Label', t.onboardingAction],
          ['maintenanceAction', 'Maintenance Action Label', t.maintenanceAction]
        ];
        fields.forEach(([key, label, val]) => {
          html += `<div class="wizard-field"><label class="wizard-label">${label}</label><input class="wizard-input" data-field="t.${key}" value="${escapeHtml(val || '')}"></div>`;
        });
      }

      if (step.id === 'review') {
        const slug = slugify(formData.companyName || 'my-portal');
        const selectedPreset = presets.find(p => p.key === formData.presetKey);
        html += `<ul class="wizard-summary-list">
          <li><span class="wizard-summary-key">Slug</span><span class="wizard-summary-val">${escapeHtml(slug)}</span></li>
          <li><span class="wizard-summary-key">Name</span><span class="wizard-summary-val">${escapeHtml(formData.companyName || slug)}</span></li>
          <li><span class="wizard-summary-key">Storyline</span><span class="wizard-summary-val">${escapeHtml(selectedPreset ? selectedPreset.title : 'Custom')}</span></li>
          <li><span class="wizard-summary-key">Vertical</span><span class="wizard-summary-val">${escapeHtml(formData.vertical || 'none')}</span></li>
          <li><span class="wizard-summary-key">Brand Color</span><span class="wizard-summary-val"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${formData.brandColor};vertical-align:middle;margin-right:4px;"></span>${formData.brandColor}</span></li>
          <li><span class="wizard-summary-key">Advisor Role</span><span class="wizard-summary-val">${escapeHtml(formData.terminology.advisorRole || '')}</span></li>
          <li><span class="wizard-summary-key">Client Role</span><span class="wizard-summary-val">${escapeHtml(formData.terminology.clientRole || '')}</span></li>
          <li><span class="wizard-summary-key">Onboarding</span><span class="wizard-summary-val">${escapeHtml(formData.terminology.onboardingAction || '')}</span></li>
          <li><span class="wizard-summary-key">Maintenance</span><span class="wizard-summary-val">${escapeHtml(formData.terminology.maintenanceAction || '')}</span></li>
        </ul>
        <div id="wizard-error" class="wizard-error" style="display:none;"></div>`;
      }

      contentContainer.innerHTML = html;

      // Bind vertical card clicks
      contentContainer.querySelectorAll('[data-vertical]').forEach(card => {
        card.addEventListener('click', () => {
          formData.vertical = card.dataset.vertical;
          formData.presetKey = null;
          formData.terminology = {};
          renderStep();
        });
      });

      // Bind storyline card clicks
      contentContainer.querySelectorAll('[data-preset]').forEach(card => {
        card.addEventListener('click', () => {
          const preset = presets.find(p => p.key === card.dataset.preset);
          if (preset) {
            formData.presetKey = preset.key;
            formData.vertical = preset.vertical;
            formData.brandColor = preset.brandColor;
            if (!formData.companyName || formData.companyName === formData._lastPresetName) {
              formData.companyName = preset.portalName;
            }
            formData._lastPresetName = preset.portalName;
            if (preset.terminology) {
              formData.terminology = { ...preset.terminology };
            }
          }
          renderStep();
        });
      });

      // Bind color picker live preview
      const colorInput = contentContainer.querySelector('[data-field="brandColor"]');
      if (colorInput) {
        colorInput.addEventListener('input', () => {
          const swatch = colorInput.closest('.wizard-color-swatch');
          if (swatch) swatch.style.background = colorInput.value;
          const hexLabel = document.getElementById('color-hex');
          if (hexLabel) hexLabel.textContent = colorInput.value;
        });
      }

      renderStepDots();
      updateNav();
    }

    function updateNav() {
      backBtn.style.display = currentStep === 0 ? 'none' : '';
      backBtn.disabled = currentStep === 0 || creating;

      if (created) {
        nextBtn.style.display = 'none';
        backBtn.style.display = 'none';
        return;
      }

      if (currentStep === STEPS.length - 1) {
        nextBtn.textContent = creating ? 'Creating...' : 'Create Instance';
        nextBtn.disabled = creating;
      } else {
        nextBtn.textContent = 'Next';
        nextBtn.disabled = (currentStep === 0 && !formData.presetKey);
      }
    }

    async function createInstance() {
      readFormInputs();
      const slug = slugify(formData.companyName || 'my-portal');
      const name = formData.companyName || slug;

      creating = true;
      updateNav();

      try {
        let response;

        if (formData.presetKey) {
          // Create from preset
          response = await fetch(`${resolveBackendUrl()}/api/instances/from-preset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug,
              presetKey: formData.presetKey,
              overrides: {
                companyName: name,
                brandColor: formData.brandColor,
                terminology: formData.terminology
              }
            })
          });
        } else {
          // Fallback: create with raw config (shouldn't happen with new flow)
          const t = formData.terminology;
          const config = {
            metadata: { name, vertical: formData.vertical || 'wealth', description: `${name} portal instance` },
            branding: { color: formData.brandColor, logo: null },
            terminology: { portalName: name, ...t },
            docusign: { userId: '', accountId: '', scopes: 'signature impersonation aow_manage organization_read webforms_manage webforms_read webforms_instance_read webforms_instance_write adm_store_unified_repo_read', baseUrl: 'https://api-d.docusign.com' },
            workflows: { onboardingId: '', maintenanceId: '' },
            kpis: { advisor: [], client: [] },
            agreements: { taxonomy: [], summaryMetrics: { totalCount: 0, completionRate: 0 }, turnaroundHours: 0, volumeSeries: [] },
            advisorId: '',
            defaultMode: 'advanced',
            iamProducts: [
              { key: 'doc-gen', label: 'Doc Gen', icon: 'doc-gen' },
              { key: 'id-verification', label: 'ID Verification', icon: 'id-verification' },
              { key: 'monitor', label: 'Monitor', icon: 'monitor' },
              { key: 'notary', label: 'Notary', icon: 'notary' },
              { key: 'web-forms', label: 'Web Forms', icon: 'web-forms' },
              { key: 'workspaces', label: 'Workspaces', icon: 'workspaces' }
            ],
            maestro: { publisherName: name, publisherEmail: '', publisherPhone: '' }
          };
          response = await fetch(`${resolveBackendUrl()}/api/instances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, config })
          });
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        created = true;
        contentContainer.innerHTML = `
          <div class="wizard-success">
            <div class="wizard-success__icon">&#10003;</div>
            <div class="wizard-success__title">${escapeHtml(name)} created!</div>
            <p class="wizard-success__copy">Your portal instance is ready. Redirecting to the launcher...</p>
          </div>
        `;
        updateNav();

        setTimeout(() => {
          window.location.href = `/i/${slug}/advisor/?mode=advanced`;
        }, 2000);
      } catch (e) {
        creating = false;
        updateNav();
        const errorEl = document.getElementById('wizard-error');
        if (errorEl) {
          errorEl.textContent = e.message;
          errorEl.style.display = '';
        }
      }
    }

    backBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        readFormInputs();
        currentStep--;
        renderStep();
      }
    });

    nextBtn.addEventListener('click', () => {
      readFormInputs();
      if (currentStep < STEPS.length - 1) {
        currentStep++;
        renderStep();
      } else {
        createInstance();
      }
    });

    // Show loading state
    contentContainer.innerHTML = '<p style="color:#94a3b8;text-align:center;">Loading storylines...</p>';
    renderStepDots();
    updateNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWizard, { once: true });
    return;
  }

  bootWizard();
})();
