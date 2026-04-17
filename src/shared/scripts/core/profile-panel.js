import { getCheckoutPreferenceLabel, getCheckoutPreferenceValue, hydrateCheckoutGuidance, populateCheckoutPreferenceSelects } from "./checkout-preferences.js";
import { getCustomerProfile, setCustomerProfile, subscribeToCustomerProfile } from "./customer-profile.js";

let profilePanelReady = false;
let activeProfileTenant = null;

function setProfilePanelOpen(open) {
  const panel = document.querySelector("[data-profile-panel]");
  const overlay = document.querySelector("[data-profile-panel-overlay]");

  if (!panel || !overlay) {
    return;
  }

  panel.hidden = !open;
  overlay.hidden = !open;
  document.body.dataset.profilePanelOpen = open ? "true" : "false";
}

function getProfileFocusSelector(target) {
  const selectorMap = {
    fullName: "[data-profile-full-name]",
    phone: "[data-profile-phone]",
    address: "[data-profile-address]",
    deliveryZone: "[data-profile-delivery-zone]",
    deliveryWindow: "[data-profile-delivery-window]",
    paymentPreference: "[data-profile-payment-preference]",
    note: "[data-profile-note]"
  };

  return selectorMap[target] || "";
}

function syncProfileInputs(profile) {
  const deliveryZoneValue = activeProfileTenant ? getCheckoutPreferenceValue(activeProfileTenant, "deliveryZones", profile.deliveryZone) : profile.deliveryZone || "";
  const deliveryWindowValue = activeProfileTenant ? getCheckoutPreferenceValue(activeProfileTenant, "deliveryWindows", profile.deliveryWindow) : profile.deliveryWindow || "";
  const paymentPreferenceValue = activeProfileTenant ? getCheckoutPreferenceValue(activeProfileTenant, "paymentMethods", profile.paymentPreference) : profile.paymentPreference || "";
  const bindings = [
    ["[data-profile-full-name]", profile.fullName || ""],
    ["[data-profile-phone]", profile.phone || ""],
    ["[data-profile-address]", profile.address || ""],
    ["[data-profile-delivery-zone]", deliveryZoneValue],
    ["[data-profile-delivery-window]", deliveryWindowValue],
    ["[data-profile-payment-preference]", paymentPreferenceValue],
    ["[data-profile-note]", profile.note || ""]
  ];

  bindings.forEach(([selector, value]) => {
    const input = document.querySelector(selector);

    if (input && input.value !== value) {
      input.value = value;
    }
  });

  const summaryName = document.querySelector("[data-profile-summary-name]");
  const summaryPhone = document.querySelector("[data-profile-summary-phone]");
  const summaryAddress = document.querySelector("[data-profile-summary-address]");
  const summaryZone = document.querySelector("[data-profile-summary-zone]");
  const summaryWindow = document.querySelector("[data-profile-summary-window]");
  const summaryPayment = document.querySelector("[data-profile-summary-payment]");

  if (summaryName) {
    summaryName.textContent = profile.fullName || "No customer name saved yet.";
  }

  if (summaryPhone) {
    summaryPhone.textContent = profile.phone || "Add a phone number for checkout follow-up.";
  }

  if (summaryAddress) {
    summaryAddress.textContent = profile.address || "Add a delivery address to speed up checkout.";
  }

  if (summaryZone) {
    summaryZone.textContent = activeProfileTenant
      ? getCheckoutPreferenceLabel(activeProfileTenant, "deliveryZones", profile.deliveryZone) || "Choose a delivery zone for clearer order routing."
      : profile.deliveryZone || "Choose a delivery zone for clearer order routing.";
  }

  if (summaryWindow) {
    summaryWindow.textContent = activeProfileTenant
      ? getCheckoutPreferenceLabel(activeProfileTenant, "deliveryWindows", profile.deliveryWindow) || "Save a preferred delivery window to reduce checkout back-and-forth."
      : profile.deliveryWindow || "Save a preferred delivery window to reduce checkout back-and-forth.";
  }

  if (summaryPayment) {
    summaryPayment.textContent = activeProfileTenant
      ? getCheckoutPreferenceLabel(activeProfileTenant, "paymentMethods", profile.paymentPreference) || "Save a preferred payment method for faster checkout."
      : profile.paymentPreference || "Save a preferred payment method for faster checkout.";
  }
}

function setProfileStatus(message, tone = "default") {
  const statusNode = document.querySelector("[data-profile-status]");

  if (!statusNode) {
    return;
  }

  statusNode.dataset.tone = tone;
  statusNode.textContent = message;
}

function readProfileInputs() {
  return {
    fullName: document.querySelector("[data-profile-full-name]")?.value || "",
    phone: document.querySelector("[data-profile-phone]")?.value || "",
    address: document.querySelector("[data-profile-address]")?.value || "",
    deliveryZone: document.querySelector("[data-profile-delivery-zone]")?.value || "",
    deliveryWindow: document.querySelector("[data-profile-delivery-window]")?.value || "",
    paymentPreference: document.querySelector("[data-profile-payment-preference]")?.value || "",
    note: document.querySelector("[data-profile-note]")?.value || ""
  };
}

export function openProfilePanel(target) {
  const profile = getCustomerProfile();

  if (activeProfileTenant) {
    populateCheckoutPreferenceSelects(activeProfileTenant, profile);
    hydrateCheckoutGuidance(activeProfileTenant);
    setProfileStatus(`Store contact info and your saved checkout details are ready for ${activeProfileTenant.storeName || "this storefront"}.`);
  }

  syncProfileInputs(profile);
  setProfilePanelOpen(true);

  const selector = getProfileFocusSelector(target);

  if (!selector) {
    return;
  }

  requestAnimationFrame(() => {
    document.querySelector(selector)?.focus();
  });
}

export function initProfilePanel(tenant) {
  activeProfileTenant = tenant || activeProfileTenant;
  const profile = getCustomerProfile();

  if (profilePanelReady) {
    populateCheckoutPreferenceSelects(activeProfileTenant, profile);
    syncProfileInputs(profile);
    return;
  }

  const panel = document.querySelector("[data-profile-panel]");
  const overlay = document.querySelector("[data-profile-panel-overlay]");
  const saveButton = document.querySelector("[data-profile-save]");

  if (!panel || !overlay || !saveButton) {
    return;
  }

  profilePanelReady = true;
  populateCheckoutPreferenceSelects(activeProfileTenant, profile);
  hydrateCheckoutGuidance(activeProfileTenant);
  syncProfileInputs(profile);
  setProfileStatus(`Save customer details once and reuse them across ${activeProfileTenant.storeName || "this storefront"}.`);

  document.querySelectorAll("[data-profile-panel-open]").forEach((node) => {
    node.addEventListener("click", () => {
      openProfilePanel();
    });
  });

  document.querySelectorAll("[data-profile-panel-close]").forEach((node) => {
    node.addEventListener("click", () => {
      setProfilePanelOpen(false);
    });
  });

  overlay.addEventListener("click", () => {
    setProfilePanelOpen(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setProfilePanelOpen(false);
    }
  });

  saveButton.addEventListener("click", () => {
    const profile = setCustomerProfile(readProfileInputs());
    syncProfileInputs(profile);
    setProfileStatus("Saved customer details, delivery schedule, and payment preference for future checkout.", "success");
  });

  subscribeToCustomerProfile((event) => {
    const nextProfile = event.detail || getCustomerProfile();
    populateCheckoutPreferenceSelects(activeProfileTenant, nextProfile);
    syncProfileInputs(nextProfile);
  });
}