import { getJson, setJson } from "../utils/storage.js";

const CUSTOMER_PROFILE_KEY = "storefront-cart-checkout";
const CUSTOMER_PROFILE_UPDATED_EVENT = "storefront:customer-profile-updated";

function normalizeProfile(details = {}) {
  return {
    fullName: String(details.fullName || "").trim(),
    phone: String(details.phone || "").trim(),
    address: String(details.address || "").trim(),
    deliveryZone: String(details.deliveryZone || "").trim(),
    deliveryWindow: String(details.deliveryWindow || "").trim(),
    paymentPreference: String(details.paymentPreference || "").trim(),
    note: String(details.note || "").trim()
  };
}

export function getCustomerProfile() {
  return normalizeProfile(getJson(CUSTOMER_PROFILE_KEY, {}));
}

export function setCustomerProfile(details) {
  const profile = normalizeProfile(details);
  setJson(CUSTOMER_PROFILE_KEY, profile);
  window.dispatchEvent(new CustomEvent(CUSTOMER_PROFILE_UPDATED_EVENT, { detail: profile }));
  return profile;
}

export function subscribeToCustomerProfile(listener) {
  window.addEventListener(CUSTOMER_PROFILE_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener(CUSTOMER_PROFILE_UPDATED_EVENT, listener);
  };
}