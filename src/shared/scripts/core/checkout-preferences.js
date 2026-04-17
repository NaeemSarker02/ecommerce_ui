import { formatCurrency } from "../utils/currency.js";

const DEFAULT_CHECKOUT_PREFERENCES = {
  deliveryZones: [
    { value: "inside-dhaka", label: "Inside Dhaka" },
    { value: "outside-dhaka", label: "Outside Dhaka" },
    { value: "pickup", label: "Store Pickup" }
  ],
  paymentMethods: ["Cash on Delivery", "bKash", "Nagad", "Card on Delivery"],
  deliveryWindows: ["10 AM - 1 PM", "1 PM - 5 PM", "5 PM - 9 PM"],
  guidance: {
    profileNote: "Save your checkout preferences once and reuse them across future orders.",
    cartNote: "Confirm delivery timing and payment method before sending the order on WhatsApp.",
    checkoutHint: "The store will confirm delivery timing and payment instructions after reviewing your message."
  },
  validationRules: {
    minimumOrderAmount: null,
    paymentMethodRules: {}
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeOption(option) {
  if (typeof option === "string") {
    const value = option.trim();
    return value ? { value, label: value } : null;
  }

  if (!option || typeof option !== "object") {
    return null;
  }

  const value = String(option.value || option.label || "").trim();
  const label = String(option.label || option.value || "").trim();

  if (!value || !label) {
    return null;
  }

  return { value, label };
}

function normalizeOptions(options, fallbackOptions) {
  const source = Array.isArray(options) && options.length ? options : fallbackOptions;
  const seen = new Set();

  return source
    .map((option) => normalizeOption(option))
    .filter((option) => {
      if (!option || seen.has(option.value)) {
        return false;
      }

      seen.add(option.value);
      return true;
    });
}

function resolveOptionValue(value, options = []) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  const match = options.find((option) => option.value === normalizedValue || option.label === normalizedValue);
  return match?.value || normalizedValue;
}

function getOptionLabel(value, options = []) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  const match = options.find((option) => option.value === normalizedValue || option.label === normalizedValue);
  return match?.label || normalizedValue;
}

function normalizeStringList(values = []) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    });
}

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeValidationRules(rules = {}) {
  const minimumOrderValue = normalizeAmount(rules?.minimumOrderAmount?.value ?? rules?.minimumOrderAmount);
  const minimumOrderMessage = String(rules?.minimumOrderAmount?.message || "").trim();
  const paymentMethodRules = Object.entries(rules?.paymentMethodRules || {}).reduce((result, [method, rule]) => {
    const methodName = String(method || "").trim();

    if (!methodName || !rule || typeof rule !== "object") {
      return result;
    }

    result[methodName] = {
      allowedZones: normalizeStringList(rule.allowedZones),
      blockedZones: normalizeStringList(rule.blockedZones),
      minimumOrderAmount: normalizeAmount(rule.minimumOrderAmount),
      message: String(rule.message || "").trim(),
      zoneRequiredMessage: String(rule.zoneRequiredMessage || "").trim()
    };

    return result;
  }, {});

  return {
    minimumOrderAmount: minimumOrderValue
      ? {
          value: minimumOrderValue,
          message: minimumOrderMessage
        }
      : null,
    paymentMethodRules
  };
}

function normalizeProductCheckoutRules(rules = {}) {
  if (!rules || typeof rules !== "object") {
    return null;
  }

  const normalized = {
    pickupOnly: Boolean(rules.pickupOnly),
    requiresDeliveryWindow: Boolean(rules.requiresDeliveryWindow),
    allowedDeliveryZones: normalizeStringList(rules.allowedDeliveryZones),
    blockedDeliveryZones: normalizeStringList(rules.blockedDeliveryZones),
    blockedPaymentMethods: normalizeStringList(rules.blockedPaymentMethods),
    allowedPaymentMethods: normalizeStringList(rules.allowedPaymentMethods),
    message: String(rules.message || "").trim()
  };

  return normalized.pickupOnly || normalized.requiresDeliveryWindow || normalized.allowedDeliveryZones.length || normalized.blockedDeliveryZones.length || normalized.blockedPaymentMethods.length || normalized.allowedPaymentMethods.length || normalized.message
    ? normalized
    : null;
}

function buildValidationState(message = "", targets = [], options = {}) {
  return {
    message,
    targets: Array.isArray(targets) ? targets.filter(Boolean) : [],
    blockingItems: Array.isArray(options.blockingItems) ? options.blockingItems.filter(Boolean) : []
  };
}

function uniq(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function getPaymentRuleViolation(methodName, paymentRule, checkoutDetails, subtotal, currency, tenant) {
  if (!paymentRule) {
    return buildValidationState();
  }

  const deliveryZoneOptions = getCheckoutPreferences(tenant).deliveryZones;
  const deliveryZone = resolveOptionValue(checkoutDetails.deliveryZone, deliveryZoneOptions);
  const allowedZoneLabels = paymentRule.allowedZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions));
  const blockedZoneLabels = paymentRule.blockedZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions));

  if (paymentRule.minimumOrderAmount && subtotal < paymentRule.minimumOrderAmount) {
    return buildValidationState(
      paymentRule.message || `${methodName} is available from ${formatCurrency(paymentRule.minimumOrderAmount, currency)}.`,
      ["paymentPreference", "subtotal"]
    );
  }
  const hasZoneRules = paymentRule.allowedZones.length || paymentRule.blockedZones.length;

  if (hasZoneRules && !deliveryZone) {
    return buildValidationState(
      paymentRule.zoneRequiredMessage || `Choose a delivery zone to confirm whether ${methodName} is available.`,
      ["deliveryZone", "paymentPreference"]
    );
  }

  if (paymentRule.allowedZones.length && !paymentRule.allowedZones.includes(deliveryZone)) {
    return buildValidationState(
      paymentRule.message || `${methodName} is only available for ${allowedZoneLabels.join(", ")}.`,
      ["deliveryZone", "paymentPreference"]
    );
  }

  if (paymentRule.blockedZones.includes(deliveryZone)) {
    return buildValidationState(
      paymentRule.message || `${methodName} is not available for ${getOptionLabel(deliveryZone, deliveryZoneOptions) || blockedZoneLabels.join(", ")}.`,
      ["deliveryZone", "paymentPreference"]
    );
  }

  return buildValidationState();
}

function getItemRuleMessage(itemName, rules, fallback) {
  if (rules?.message) {
    return rules.message;
  }

  return `${itemName}: ${fallback}`;
}

function getProductRuleViolation(item, rules, tenant, checkoutDetails) {
  const itemName = item?.name || "This item";
  const deliveryZoneOptions = getCheckoutPreferences(tenant).deliveryZones;
  const deliveryZone = resolveOptionValue(checkoutDetails.deliveryZone, deliveryZoneOptions);
  const paymentPreference = String(checkoutDetails.paymentPreference || "").trim();
  const deliveryWindow = String(checkoutDetails.deliveryWindow || "").trim();
  const allowedDeliveryZones = rules.allowedDeliveryZones.length ? rules.allowedDeliveryZones : (rules.pickupOnly ? ["pickup"] : []);

  if (rules.pickupOnly || allowedDeliveryZones.length) {
    if (!deliveryZone) {
      return buildValidationState(getItemRuleMessage(itemName, rules, "pickup-only items need a pickup delivery zone."), ["deliveryZone"], { blockingItems: [itemName] });
    }

    if (allowedDeliveryZones.length && !allowedDeliveryZones.includes(deliveryZone)) {
      return buildValidationState(getItemRuleMessage(itemName, rules, "this item is available for pickup only."), ["deliveryZone"], { blockingItems: [itemName] });
    }
  }

  if (rules.blockedDeliveryZones.includes(deliveryZone)) {
    return buildValidationState(getItemRuleMessage(itemName, rules, `${getOptionLabel(deliveryZone, deliveryZoneOptions)} is not available for this item.`), ["deliveryZone"], { blockingItems: [itemName] });
  }

  if (rules.requiresDeliveryWindow && !deliveryWindow) {
    return buildValidationState(getItemRuleMessage(itemName, rules, "select a delivery window for this item."), ["deliveryWindow"], { blockingItems: [itemName] });
  }

  if (paymentPreference && rules.blockedPaymentMethods.includes(paymentPreference)) {
    return buildValidationState(getItemRuleMessage(itemName, rules, `${paymentPreference} is not available for this item.`), ["paymentPreference"], { blockingItems: [itemName] });
  }

  if (paymentPreference && rules.allowedPaymentMethods.length && !rules.allowedPaymentMethods.includes(paymentPreference)) {
    return buildValidationState(getItemRuleMessage(itemName, rules, `use ${rules.allowedPaymentMethods.join(", ")} for this item.`), ["paymentPreference"], { blockingItems: [itemName] });
  }

  return buildValidationState();
}

export function getProductCheckoutValidationState({ tenant, product, checkoutDetails = {} }) {
  const productRules = normalizeProductCheckoutRules(product?.checkoutRules);

  if (!productRules) {
    return buildValidationState();
  }

  return getProductRuleViolation(product, productRules, tenant, checkoutDetails);
}

function getCartProductRuleState(cartItems = [], tenant, checkoutDetails = {}) {
  const violations = [];

  for (const item of cartItems) {
    const rules = normalizeProductCheckoutRules(item?.checkoutRules);

    if (!rules) {
      continue;
    }

    const violation = getProductRuleViolation(item, rules, tenant, checkoutDetails);

    if (violation.message) {
      violations.push(violation);
    }
  }

  if (!violations.length) {
    return buildValidationState();
  }

  if (violations.length === 1) {
    return violations[0];
  }

  const primaryTarget = violations[0].targets[0] || "deliveryZone";
  const relatedViolations = violations.filter((violation) => violation.targets.includes(primaryTarget));
  const blockingItems = uniq(relatedViolations.flatMap((violation) => violation.blockingItems));

  const genericMessages = {
    deliveryZone: "Some items need a different delivery zone before checkout.",
    deliveryWindow: "Some items need a delivery window before checkout.",
    paymentPreference: "Some items need a different payment method before checkout."
  };

  return buildValidationState(
    genericMessages[primaryTarget] || relatedViolations[0].message,
    [primaryTarget],
    { blockingItems }
  );
}

function describeProductRule(item, rules, tenant) {
  const parts = [];
  const deliveryZoneOptions = getCheckoutPreferences(tenant).deliveryZones;

  if (rules.pickupOnly) {
    parts.push("pickup only");
  }

  if (rules.allowedDeliveryZones.length && !rules.pickupOnly) {
    parts.push(`zones: ${rules.allowedDeliveryZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions)).join(", ")}`);
  }

  if (rules.blockedDeliveryZones.length) {
    parts.push(`not for ${rules.blockedDeliveryZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions)).join(", ")}`);
  }

  if (rules.requiresDeliveryWindow) {
    parts.push("delivery window required");
  }

  if (rules.blockedPaymentMethods.length) {
    parts.push(`not with ${rules.blockedPaymentMethods.join(", ")}`);
  }

  if (rules.allowedPaymentMethods.length) {
    parts.push(`use ${rules.allowedPaymentMethods.join(", ")}`);
  }

  return parts.length ? `${item.name}: ${parts.join(" • ")}` : rules.message || "";
}

function addGroupedProductRule(groups, key, config) {
  const existing = groups.get(key) || {
    title: config.title,
    tone: "default",
    items: [],
    details: []
  };

  existing.items = uniq([...existing.items, config.itemName]);
  existing.details = uniq([...existing.details, config.detail]);

  if (config.tone === "warning") {
    existing.tone = "warning";
  }

  groups.set(key, existing);
}

function getGroupedProductRuleSummaries(cartItems = [], tenant, checkoutDetails = {}) {
  const groups = new Map();
  const deliveryZoneOptions = getCheckoutPreferences(tenant).deliveryZones;

  cartItems.forEach((item) => {
    const productRules = normalizeProductCheckoutRules(item?.checkoutRules);

    if (!productRules) {
      return;
    }

    const violation = getProductRuleViolation(item, productRules, tenant, checkoutDetails);
    const warningTargets = new Set(violation.targets || []);

    if (productRules.pickupOnly) {
      addGroupedProductRule(groups, "delivery-zone", {
        title: "Delivery Zone Rules",
        itemName: item.name,
        detail: "pickup only",
        tone: warningTargets.has("deliveryZone") ? "warning" : "default"
      });
    }

    if (productRules.allowedDeliveryZones.length && !productRules.pickupOnly) {
      addGroupedProductRule(groups, "delivery-zone", {
        title: "Delivery Zone Rules",
        itemName: item.name,
        detail: `only for ${productRules.allowedDeliveryZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions)).join(", ")}`,
        tone: warningTargets.has("deliveryZone") ? "warning" : "default"
      });
    }

    if (productRules.blockedDeliveryZones.length) {
      addGroupedProductRule(groups, "delivery-zone", {
        title: "Delivery Zone Rules",
        itemName: item.name,
        detail: `not for ${productRules.blockedDeliveryZones.map((zone) => getOptionLabel(zone, deliveryZoneOptions)).join(", ")}`,
        tone: warningTargets.has("deliveryZone") ? "warning" : "default"
      });
    }

    if (productRules.requiresDeliveryWindow) {
      addGroupedProductRule(groups, "delivery-window", {
        title: "Delivery Window Rules",
        itemName: item.name,
        detail: "delivery window required",
        tone: warningTargets.has("deliveryWindow") ? "warning" : "default"
      });
    }

    if (productRules.blockedPaymentMethods.length) {
      addGroupedProductRule(groups, "payment-method", {
        title: "Payment Method Rules",
        itemName: item.name,
        detail: `not with ${productRules.blockedPaymentMethods.join(", ")}`,
        tone: warningTargets.has("paymentPreference") ? "warning" : "default"
      });
    }

    if (productRules.allowedPaymentMethods.length) {
      addGroupedProductRule(groups, "payment-method", {
        title: "Payment Method Rules",
        itemName: item.name,
        detail: `use ${productRules.allowedPaymentMethods.join(", ")}`,
        tone: warningTargets.has("paymentPreference") ? "warning" : "default"
      });
    }
  });

  return Array.from(groups.values()).map((group) => ({
    tone: group.tone,
    title: group.title,
    text: `${group.items.join(", ")}${group.details.length ? ` • ${group.details.join(" • ")}` : ""}`
  }));
}

function buildOptionMarkup(options) {
  return options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
}

function populateSelect(selector, options, fallbackOptions, currentValue) {
  document.querySelectorAll(selector).forEach((node) => {
    const placeholder = node.dataset.placeholder || "Select an option";
    const normalized = normalizeOptions(options, fallbackOptions);
    const selectedValue = resolveOptionValue(currentValue || node.value || "", normalized);

    if (selectedValue && !normalized.some((option) => option.value === selectedValue)) {
      normalized.push({ value: selectedValue, label: selectedValue });
    }

    node.innerHTML = `<option value="">${placeholder}</option>${buildOptionMarkup(normalized)}`;

    if (selectedValue) {
      node.value = selectedValue;
    }
  });
}

export function getCheckoutPreferences(tenant) {
  return {
    deliveryZones: normalizeOptions(tenant?.checkoutPreferences?.deliveryZones, DEFAULT_CHECKOUT_PREFERENCES.deliveryZones),
    paymentMethods: normalizeOptions(tenant?.checkoutPreferences?.paymentMethods, DEFAULT_CHECKOUT_PREFERENCES.paymentMethods),
    deliveryWindows: normalizeOptions(tenant?.checkoutPreferences?.deliveryWindows, DEFAULT_CHECKOUT_PREFERENCES.deliveryWindows),
    guidance: {
      profileNote:
        tenant?.checkoutPreferences?.guidance?.profileNote || DEFAULT_CHECKOUT_PREFERENCES.guidance.profileNote,
      cartNote:
        tenant?.checkoutPreferences?.guidance?.cartNote || DEFAULT_CHECKOUT_PREFERENCES.guidance.cartNote,
      checkoutHint:
        tenant?.checkoutPreferences?.guidance?.checkoutHint || DEFAULT_CHECKOUT_PREFERENCES.guidance.checkoutHint
    },
    validationRules: normalizeValidationRules(tenant?.checkoutPreferences?.validationRules)
  };
}

function getPreferenceOptions(preferenceKey, tenant) {
  const preferences = getCheckoutPreferences(tenant);

  switch (preferenceKey) {
    case "deliveryZones":
      return preferences.deliveryZones;
    case "paymentMethods":
      return preferences.paymentMethods;
    case "deliveryWindows":
      return preferences.deliveryWindows;
    default:
      return [];
  }
}

export function getCheckoutPreferenceValue(tenant, preferenceKey, value) {
  return resolveOptionValue(value, getPreferenceOptions(preferenceKey, tenant));
}

export function getCheckoutPreferenceLabel(tenant, preferenceKey, value) {
  const options = getPreferenceOptions(preferenceKey, tenant);
  return getOptionLabel(resolveOptionValue(value, options), options);
}

export function getCheckoutValidationMessage({ tenant, checkoutDetails = {}, subtotal = 0, currency = "BDT", cartItems = [] }) {
  return getCheckoutValidationState({ tenant, checkoutDetails, subtotal, currency, cartItems }).message;
}

export function getCheckoutValidationState({ tenant, checkoutDetails = {}, subtotal = 0, currency = "BDT", cartItems = [] }) {
  const { validationRules } = getCheckoutPreferences(tenant);
  const minimumOrderRule = validationRules.minimumOrderAmount;

  if (minimumOrderRule?.value && subtotal < minimumOrderRule.value) {
    return buildValidationState(
      minimumOrderRule.message || `Minimum order is ${formatCurrency(minimumOrderRule.value, currency)} for this storefront.`,
      ["subtotal"]
    );
  }

  const paymentMethod = String(checkoutDetails.paymentPreference || "").trim();

  if (!paymentMethod) {
    return getCartProductRuleState(cartItems, tenant, checkoutDetails);
  }

  const paymentRule = validationRules.paymentMethodRules[paymentMethod];

  if (paymentRule) {
    const tenantViolation = getPaymentRuleViolation(paymentMethod, paymentRule, checkoutDetails, subtotal, currency, tenant);

    if (tenantViolation.message) {
      return tenantViolation;
    }
  }

  return getCartProductRuleState(cartItems, tenant, checkoutDetails);
}

export function getCheckoutRuleSummaries({ tenant, checkoutDetails = {}, subtotal = 0, currency = "BDT", cartItems = [] }) {
  const { validationRules } = getCheckoutPreferences(tenant);
  const rules = [];

  if (validationRules.minimumOrderAmount?.value) {
    rules.push({
      tone: subtotal >= validationRules.minimumOrderAmount.value ? "active" : "warning",
      text:
        validationRules.minimumOrderAmount.message ||
        `Minimum order is ${formatCurrency(validationRules.minimumOrderAmount.value, currency)}.`
    });
  }

  Object.entries(validationRules.paymentMethodRules).forEach(([methodName, paymentRule]) => {
    const parts = [];

    if (paymentRule.minimumOrderAmount) {
      parts.push(`min ${formatCurrency(paymentRule.minimumOrderAmount, currency)}`);
    }

    if (paymentRule.allowedZones.length) {
      parts.push(`allowed: ${paymentRule.allowedZones.map((zone) => getCheckoutPreferenceLabel(tenant, "deliveryZones", zone)).join(", ")}`);
    }

    if (paymentRule.blockedZones.length) {
      parts.push(`blocked: ${paymentRule.blockedZones.map((zone) => getCheckoutPreferenceLabel(tenant, "deliveryZones", zone)).join(", ")}`);
    }

    const selected = String(checkoutDetails.paymentPreference || "").trim() === methodName;
    const violation = getPaymentRuleViolation(methodName, paymentRule, checkoutDetails, subtotal, currency, tenant);

    rules.push({
      tone: selected ? (violation.message ? "warning" : "active") : "default",
      text: parts.length ? `${methodName}: ${parts.join(" • ")}` : methodName
    });
  });

  return [...rules, ...getGroupedProductRuleSummaries(cartItems, tenant, checkoutDetails)];
}

export function populateCheckoutPreferenceSelects(tenant, profile = {}) {
  const preferences = getCheckoutPreferences(tenant);

  populateSelect(
    "[data-profile-delivery-zone], [data-cart-delivery-zone]",
    preferences.deliveryZones,
    DEFAULT_CHECKOUT_PREFERENCES.deliveryZones,
    profile.deliveryZone
  );
  populateSelect(
    "[data-profile-payment-preference], [data-cart-payment-preference]",
    preferences.paymentMethods,
    DEFAULT_CHECKOUT_PREFERENCES.paymentMethods,
    profile.paymentPreference
  );
  populateSelect(
    "[data-profile-delivery-window], [data-cart-delivery-window]",
    preferences.deliveryWindows,
    DEFAULT_CHECKOUT_PREFERENCES.deliveryWindows,
    profile.deliveryWindow
  );
}

export function hydrateCheckoutGuidance(tenant) {
  const preferences = getCheckoutPreferences(tenant);

  document.querySelectorAll("[data-profile-guidance]").forEach((node) => {
    node.textContent = preferences.guidance.profileNote;
  });

  document.querySelectorAll("[data-cart-guidance]").forEach((node) => {
    node.textContent = preferences.guidance.cartNote;
  });

  document.querySelectorAll("[data-cart-checkout-hint]").forEach((node) => {
    node.textContent = preferences.guidance.checkoutHint;
  });
}