import {
  BUSINESS_TYPES,
  DESTINATIONS,
  STORAGE_KEY,
  TEMPLATE_THEMES,
  TOTAL_WIZARD_STEPS,
  buildTemplatePath,
  escapeHtml,
  findBusinessType,
  findDestination,
  findTheme
} from "../config/template-portal.js";

function savePreference(themeKey, destinationKey) {
  const current = loadPreference() || {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...current,
    themeKey,
    destinationKey
  }));
}

function saveBusinessPreference(businessKey) {
  const current = loadPreference() || {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...current,
    businessKey
  }));
}

function loadPreference() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function createShortcutLink(themeKey, destinationKey) {
  const destination = findDestination(destinationKey);
  const href = buildTemplatePath(themeKey, destinationKey);

  return `
    <a
      class="portal-theme-shortcut"
      href="${href}"
      data-theme-key="${themeKey}"
      data-destination-key="${destinationKey}"
    >${destination?.label || destinationKey}</a>
  `;
}

function renderDestinationOptions(activeDestinationKey) {
  const destinationOptions = document.querySelector("[data-destination-options]");

  if (!destinationOptions) {
    return;
  }

  destinationOptions.innerHTML = DESTINATIONS.map((destination) => {
    const isActive = destination.key === activeDestinationKey;

    return `
      <button
        class="portal-choice-card ${isActive ? "is-active" : ""}"
        type="button"
        data-destination-option="${destination.key}"
      >
        <span class="portal-choice-title">${destination.label}</span>
        <span class="portal-choice-description">${destination.description}</span>
        <span class="portal-choice-meta">${destination.helper}</span>
      </button>
    `;
  }).join("");
}

function renderBusinessOptions(activeBusinessKey) {
  const businessOptions = document.querySelector("[data-business-options]");

  if (!businessOptions) {
    return;
  }

  businessOptions.innerHTML = BUSINESS_TYPES.map((business) => {
    const isActive = business.key === activeBusinessKey;
    const recommendedTheme = findTheme(business.recommendedTheme);

    return `
      <button
        class="portal-choice-card portal-choice-card-light ${isActive ? "is-active" : ""}"
        type="button"
        data-business-option="${business.key}"
      >
        <span class="portal-choice-title">${business.label}</span>
        <span class="portal-choice-description">${business.description}</span>
        <span class="portal-choice-meta">Recommends ${escapeHtml(recommendedTheme.name)}</span>
      </button>
    `;
  }).join("");
}

function renderBusinessSummary(activeBusinessKey, activeThemeKey) {
  const summary = document.querySelector("[data-business-summary]");
  const recommendationPanel = document.querySelector("[data-recommendation-panel]");
  const business = findBusinessType(activeBusinessKey);
  const theme = findTheme(activeThemeKey);

  if (summary) {
    if (business) {
      summary.textContent = `${business.label}: ${business.description}`;
    } else {
      summary.textContent = "Select the business type that best matches your store.";
    }
  }

  if (recommendationPanel) {
    if (business) {
      recommendationPanel.textContent = `Recommended template: ${theme.name}. ${theme.bestFor}.`;
    } else {
      recommendationPanel.textContent = "Recommendation: choose a business type above to auto-select the most suitable template, or manually pick any template.";
    }
  }
}

function renderWizard(currentStep, state) {
  const indicators = Array.from(document.querySelectorAll("[data-wizard-indicator]"));
  const panels = Array.from(document.querySelectorAll("[data-wizard-step]"));
  const helper = document.querySelector("[data-wizard-helper]");
  const backButton = document.querySelector("[data-wizard-back]");
  const nextButton = document.querySelector("[data-wizard-next]");
  const launchLink = document.querySelector("[data-launch-link]");
  const canContinue = currentStep === 1 ? Boolean(state.businessKey) : currentStep === 2 ? Boolean(state.destinationKey) : false;

  indicators.forEach((indicator) => {
    const step = Number(indicator.dataset.wizardIndicator || 0);
    const isActive = step === currentStep;
    const isComplete = step < currentStep;
    indicator.className = `portal-step-indicator ${isActive ? "is-active" : isComplete ? "is-complete" : ""}`;
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.wizardStep !== String(currentStep);
  });

  if (backButton instanceof HTMLButtonElement) {
    backButton.hidden = currentStep === 1;
  }

  if (nextButton instanceof HTMLButtonElement) {
    nextButton.hidden = currentStep === TOTAL_WIZARD_STEPS;
    nextButton.disabled = !canContinue;
    nextButton.classList.toggle("opacity-50", !canContinue);
    nextButton.classList.toggle("cursor-not-allowed", !canContinue);
  }

  if (launchLink instanceof HTMLAnchorElement) {
    launchLink.classList.toggle("hidden", currentStep !== TOTAL_WIZARD_STEPS);
  }

  if (helper) {
    if (currentStep === 1) {
      helper.textContent = state.businessKey ? "Good. The wizard has identified a matching template recommendation. Continue to choose the starting page." : "Choose your business type to begin the guided setup.";
    } else if (currentStep === 2) {
      helper.textContent = state.destinationKey ? "Starting page selected. Continue to review the chosen template before opening it." : "Choose the first page your users should see.";
    } else {
      helper.textContent = "Review the selected template, adjust it if needed, and open the chosen storefront experience.";
    }
  }
}

function renderSelectedTheme(themeKey) {
  const theme = findTheme(themeKey);
  const badge = document.querySelector("[data-selected-badge]");
  const image = document.querySelector("[data-selected-image]");
  const name = document.querySelector("[data-selected-name]");
  const description = document.querySelector("[data-selected-description]");
  const tags = document.querySelector("[data-selected-tags]");

  if (badge) {
    badge.textContent = theme.badge;
  }

  if (image instanceof HTMLImageElement) {
    image.src = theme.previewImage;
    image.alt = theme.previewAlt;
  }

  if (name) {
    name.textContent = theme.name;
  }

  if (description) {
    description.textContent = `${theme.description} ${theme.bestFor}.`;
  }

  if (tags) {
    tags.innerHTML = [theme.bestFor, ...(theme.audience || [])].map((item) => {
      return `<span class="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">${escapeHtml(item)}</span>`;
    }).join("");
  }
}

function renderThemeCards(activeThemeKey) {
  const grid = document.querySelector("[data-theme-card-grid]");

  if (!grid) {
    return;
  }

  grid.innerHTML = TEMPLATE_THEMES.map((theme) => {
    const isActive = theme.key === activeThemeKey;

    return `
      <article class="portal-theme-card ${isActive ? "is-active" : ""}" data-theme-card="${theme.key}">
        <div class="portal-theme-media">
          <img class="h-full w-full object-cover" src="${theme.previewImage}" alt="${theme.previewAlt}" loading="lazy">
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-slate-950/28 to-transparent"></div>
          <span class="portal-theme-media-badge">${theme.badge}</span>
        </div>
        <div class="portal-theme-body">
          <div class="space-y-2">
            <div class="portal-theme-head">
              <div>
                <h2 class="portal-theme-name">${theme.name}</h2>
                <p class="portal-theme-subtitle">${theme.bestFor}</p>
              </div>
              ${isActive ? '<span class="portal-theme-active">Selected</span>' : '<span class="store-business-badge">Preview</span>'}
            </div>
            <div class="portal-theme-tag-row">
              <span class="portal-theme-tag portal-theme-tag-strong">${theme.bestFor}</span>
              ${(theme.audience || []).map((item) => {
                return `<span class="portal-theme-tag">${escapeHtml(item)}</span>`;
              }).join("")}
            </div>
            <p class="portal-theme-description">${theme.description}</p>
          </div>
          <div class="portal-theme-actions">
            <button class="primary-button" type="button" data-use-theme="${theme.key}">Use this template</button>
          </div>
          <div class="grid gap-2">
            <p class="portal-shortcut-label">Quick entry points</p>
            <div class="portal-theme-shortcuts">
              ${createShortcutLink(theme.key, "home")}
              ${createShortcutLink(theme.key, "search")}
              ${createShortcutLink(theme.key, "category")}
              ${createShortcutLink(theme.key, "product")}
              ${createShortcutLink(theme.key, "cart")}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function updateLauncher(themeKey, destinationKey, businessKey = null) {
  const theme = findTheme(themeKey);
  const destination = findDestination(destinationKey);
  const launchLink = document.querySelector("[data-launch-link]");
  const lastLink = document.querySelector("[data-last-link]");
  const summary = document.querySelector("[data-launch-summary]");
  const themeSelect = document.querySelector("[data-theme-select]");

  if (themeSelect) {
    themeSelect.value = theme.key;
  }

  if (launchLink) {
    launchLink.href = buildTemplatePath(theme.key, destination.key);
    launchLink.textContent = `Open ${theme.name} ${destination.label}`;
  }

  if (summary) {
    summary.textContent = `Selected: ${theme.name} -> ${destination.label}. ${destination.helper}.`;
  }

  const stored = loadPreference();
  const fallbackTheme = stored?.themeKey || theme.key;
  const fallbackDestination = stored?.destinationKey || "home";

  if (lastLink) {
    lastLink.href = buildTemplatePath(fallbackTheme, fallbackDestination);
    lastLink.textContent = `Open last used: ${findTheme(fallbackTheme).name}`;
  }

  renderBusinessOptions(businessKey);
  renderBusinessSummary(businessKey, theme.key);
  renderDestinationOptions(destination.key);
  renderSelectedTheme(theme.key);
  renderThemeCards(theme.key);
}

function populateControls() {
  const themeSelect = document.querySelector("[data-theme-select]");

  if (themeSelect && !themeSelect.dataset.ready) {
    themeSelect.innerHTML = TEMPLATE_THEMES.map((theme) => {
      return `<option value="${theme.key}">${theme.name}</option>`;
    }).join("");
    themeSelect.dataset.ready = "true";
  }
}

function initThemeAccess() {
  populateControls();

  const themeSelect = document.querySelector("[data-theme-select]");
  const saved = loadPreference();
  let currentTheme = TEMPLATE_THEMES.some((item) => item.key === saved?.themeKey) ? saved.themeKey : TEMPLATE_THEMES[0].key;
  let currentDestination = DESTINATIONS.some((item) => item.key === saved?.destinationKey) ? saved.destinationKey : "home";
  let currentBusiness = BUSINESS_TYPES.some((item) => item.key === saved?.businessKey) ? saved.businessKey : null;
  let currentStep = currentBusiness ? TOTAL_WIZARD_STEPS : 1;

  const syncUi = () => {
    updateLauncher(currentTheme, currentDestination, currentBusiness);
    renderWizard(currentStep, {
      themeKey: currentTheme,
      destinationKey: currentDestination,
      businessKey: currentBusiness
    });
  };

  syncUi();

  themeSelect?.addEventListener("change", () => {
    currentTheme = themeSelect.value || TEMPLATE_THEMES[0].key;
    savePreference(currentTheme, currentDestination);
    syncUi();
  });

  document.addEventListener("click", (event) => {
    const nextButton = event.target.closest("[data-wizard-next]");

    if (nextButton instanceof HTMLButtonElement) {
      if (currentStep === 1 && currentBusiness) {
        currentStep = 2;
      } else if (currentStep === 2 && currentDestination) {
        currentStep = 3;
      }

      syncUi();
      return;
    }

    const backButton = event.target.closest("[data-wizard-back]");

    if (backButton instanceof HTMLButtonElement) {
      currentStep = Math.max(1, currentStep - 1);
      syncUi();
      return;
    }

    const businessButton = event.target.closest("[data-business-option]");

    if (businessButton instanceof HTMLElement) {
      currentBusiness = businessButton.dataset.businessOption || null;
      const business = findBusinessType(currentBusiness) || BUSINESS_TYPES[0];
      currentTheme = business.recommendedTheme;
      saveBusinessPreference(currentBusiness);
      savePreference(currentTheme, currentDestination);
      currentStep = 1;
      syncUi();
      return;
    }

    const destinationButton = event.target.closest("[data-destination-option]");

    if (destinationButton instanceof HTMLElement) {
      currentDestination = destinationButton.dataset.destinationOption || "home";
      savePreference(currentTheme, currentDestination);
      syncUi();
      return;
    }

    const useThemeButton = event.target.closest("[data-use-theme]");

    if (useThemeButton instanceof HTMLElement) {
      currentTheme = useThemeButton.dataset.useTheme || TEMPLATE_THEMES[0].key;
      savePreference(currentTheme, currentDestination);
      currentStep = TOTAL_WIZARD_STEPS;
      syncUi();
      return;
    }

    const link = event.target.closest("a[data-theme-key][data-destination-key]");

    if (link instanceof HTMLAnchorElement) {
      savePreference(link.dataset.themeKey || TEMPLATE_THEMES[0].key, link.dataset.destinationKey || "home");
      return;
    }

    const launchLink = event.target.closest("[data-launch-link]");

    if (launchLink instanceof HTMLAnchorElement) {
      savePreference(themeSelect?.value || TEMPLATE_THEMES[0].key, currentDestination);
    }
  });
}

window.addEventListener("DOMContentLoaded", initThemeAccess);