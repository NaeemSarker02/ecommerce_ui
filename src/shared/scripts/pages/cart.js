import { bootstrapPage } from "../core/app.js";
import { clearCart, getCart, getCartSubtotal, removeFromCart, updateCartCount, updateCartItemQuantity } from "../core/cart.js";
import {
  getCheckoutPreferenceLabel,
  getCheckoutPreferenceValue,
  getCheckoutRuleSummaries,
  getCheckoutValidationState,
  hydrateCheckoutGuidance,
  populateCheckoutPreferenceSelects
} from "../core/checkout-preferences.js";
import { getCustomerProfile, setCustomerProfile, subscribeToCustomerProfile } from "../core/customer-profile.js";
import { hydrateMediaFrames, renderMediaMarkup } from "../core/renderers.js";
import { buildWhatsAppUrl, initWhatsAppLinks } from "../core/whatsapp.js";
import { formatCurrency } from "../utils/currency.js";
import { loadPageData } from "./shared-page-data.js";

function getCartItemIdentifier(item) {
  return item.productId || item.slug || item.name || "unknown-item";
}

function getCartOptions(themeKey) {
  switch (themeKey) {
    case "tech-electronics":
      return {
        primaryAction: "Order via WhatsApp"
      };
    case "fashion-lifestyle":
      return {
        primaryAction: "Send Order on WhatsApp"
      };
    default:
      return {
        primaryAction: "Order on WhatsApp"
      };
  }
}

function validateCheckoutDetails(details, tenant, subtotal, currency, cartItems = []) {
  if (!String(details.fullName || "").trim()) {
    return {
      message: "Add your full name to prepare the order message.",
      targets: ["fullName"]
    };
  }

  if (!String(details.phone || "").trim()) {
    return {
      message: "Add your phone number so the store can contact you about the order.",
      targets: ["phone"]
    };
  }

  return getCheckoutValidationState({
    tenant,
    checkoutDetails: details,
    cartItems,
    subtotal,
    currency
  });
}

function buildOrderMessage(cartItems, tenant, productsByKey, checkoutDetails) {
  if (!cartItems.length) {
    return `Hi, I want to ask about products from ${tenant.storeName || "your store"}.`;
  }

  const lines = cartItems.map((item, index) => {
    const identifier = getCartItemIdentifier(item);
    const product = productsByKey.get(identifier);
    const price = product?.salePrice ?? product?.basePrice ?? item.price;
    const currency = product?.currency || item.currency || "BDT";
    const sku = product?.sku || item.sku;
    const lineTotal = formatCurrency(price * item.quantity, currency);
    const lineLabel = `${index + 1}. ${item.name} x${item.quantity} - ${lineTotal}`;

    return sku ? `${lineLabel} (SKU: ${sku})` : lineLabel;
  });

  const firstCurrency = cartItems[0]?.currency || productsByKey.get(getCartItemIdentifier(cartItems[0]))?.currency || "BDT";
  const subtotal = formatCurrency(getCartSubtotal(), firstCurrency);
  const deliveryZoneLabel = getCheckoutPreferenceLabel(tenant, "deliveryZones", checkoutDetails.deliveryZone);
  const deliveryWindowLabel = getCheckoutPreferenceLabel(tenant, "deliveryWindows", checkoutDetails.deliveryWindow);
  const paymentPreferenceLabel = getCheckoutPreferenceLabel(tenant, "paymentMethods", checkoutDetails.paymentPreference);
  const customerLines = [
    checkoutDetails.fullName ? `Name: ${checkoutDetails.fullName}` : "",
    checkoutDetails.phone ? `Phone: ${checkoutDetails.phone}` : "",
    checkoutDetails.address ? `Address: ${checkoutDetails.address}` : "",
    deliveryZoneLabel ? `Delivery Zone: ${deliveryZoneLabel}` : "",
    deliveryWindowLabel ? `Preferred Delivery Window: ${deliveryWindowLabel}` : "",
    paymentPreferenceLabel ? `Payment Preference: ${paymentPreferenceLabel}` : "",
    checkoutDetails.note ? `Note: ${checkoutDetails.note}` : ""
  ].filter(Boolean);

  return [
    `Hi, I want to order these items from ${tenant.storeName || "your store"}:`,
    ...customerLines,
    ...lines,
    `Subtotal: ${subtotal}`
  ].join("\n");
}

function syncCheckoutInputs(details, tenant) {
  const bindings = [
    ["[data-cart-customer-name]", details.fullName || ""],
    ["[data-cart-customer-phone]", details.phone || ""],
    ["[data-cart-customer-address]", details.address || ""],
    ["[data-cart-delivery-zone]", getCheckoutPreferenceValue(tenant, "deliveryZones", details.deliveryZone) || ""],
    ["[data-cart-delivery-window]", getCheckoutPreferenceValue(tenant, "deliveryWindows", details.deliveryWindow) || ""],
    ["[data-cart-payment-preference]", getCheckoutPreferenceValue(tenant, "paymentMethods", details.paymentPreference) || ""],
    ["[data-cart-customer-note]", details.note || ""]
  ];

  bindings.forEach(([selector, value]) => {
    const input = document.querySelector(selector);

    if (input && input.value !== value) {
      input.value = value;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBlockingItemsMessage(blockingItems = []) {
  const items = Array.isArray(blockingItems) ? blockingItems.filter(Boolean) : [];

  if (!items.length) {
    return "";
  }

  return ` Affected products: ${items.join(", ")}.`;
}

function renderRuleSummaryMarkup(summary) {
  const titleMarkup = summary.title ? `<span class="cart-rule-title">${escapeHtml(summary.title)}</span>` : "";
  const textMarkup = `<span class="cart-rule-copy">${escapeHtml(summary.text)}</span>`;
  return `<p class="cart-rule-item" data-tone="${escapeHtml(summary.tone || "default")}">${titleMarkup}${textMarkup}</p>`;
}

function renderCheckoutRuleSummary({ tenant, checkoutDetails, currency }) {
  const container = document.querySelector("[data-cart-rule-summary]");
  const list = document.querySelector("[data-cart-rule-list]");

  if (!container || !list) {
    return;
  }

  const summaries = getCheckoutRuleSummaries({
    tenant,
    checkoutDetails,
    cartItems: getCart(),
    subtotal: getCartSubtotal(),
    currency
  });

  if (!summaries.length) {
    container.hidden = true;
    list.innerHTML = "";
    return;
  }

  container.hidden = false;
  list.innerHTML = summaries
    .map((summary) => renderRuleSummaryMarkup(summary))
    .join("");
}

function getCheckoutValidationNodes(targets = []) {
  const targetMap = {
    fullName: ["[data-cart-customer-name]"],
    phone: ["[data-cart-customer-phone]"],
    address: ["[data-cart-customer-address]"],
    deliveryZone: ["[data-cart-delivery-zone]"],
    deliveryWindow: ["[data-cart-delivery-window]"],
    paymentPreference: ["[data-cart-payment-preference]"],
    note: ["[data-cart-customer-note]"],
    subtotal: ["[data-cart-summary-subtotal]"]
  };

  return targets.flatMap((target) => (targetMap[target] || []).map((selector) => document.querySelector(selector)).filter(Boolean));
}

function clearCheckoutValidationHighlights() {
  [
    "[data-cart-customer-name]",
    "[data-cart-customer-phone]",
    "[data-cart-customer-address]",
    "[data-cart-delivery-zone]",
    "[data-cart-delivery-window]",
    "[data-cart-payment-preference]",
    "[data-cart-customer-note]",
    "[data-cart-summary-subtotal]"
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.removeAttribute("data-validation-state");
      node.removeAttribute("aria-invalid");
    });
  });
}

function applyCheckoutValidationHighlights(targets = []) {
  clearCheckoutValidationHighlights();

  getCheckoutValidationNodes(targets).forEach((node) => {
    node.setAttribute("data-validation-state", "warning");

    if (node.matches("input, select, textarea")) {
      node.setAttribute("aria-invalid", "true");
    }
  });
}

function updateCheckoutLink({ cartItems, tenant, productsByKey, checkoutDetails, options }) {
  const checkoutLink = document.querySelector("[data-cart-checkout-link]");
  const feedback = document.querySelector("[data-cart-checkout-feedback]");

  if (!checkoutLink || !feedback) {
    return;
  }

  if (!cartItems.length) {
    checkoutLink.setAttribute("href", "./search.html");
    checkoutLink.removeAttribute("target");
    checkoutLink.removeAttribute("rel");
    checkoutLink.dataset.validationTargets = "";
    clearCheckoutValidationHighlights();
    feedback.dataset.tone = "default";
    feedback.textContent = "Add products to the cart before continuing to checkout.";
    return;
  }

  const currency = cartItems[0]?.currency || productsByKey.get(getCartItemIdentifier(cartItems[0]))?.currency || "BDT";
  const validationState = validateCheckoutDetails(checkoutDetails, tenant, getCartSubtotal(), currency, cartItems);

  if (validationState.message) {
    checkoutLink.setAttribute("href", "#checkout-details");
    checkoutLink.removeAttribute("target");
    checkoutLink.removeAttribute("rel");
    checkoutLink.dataset.validationTargets = validationState.targets.join(",");
    applyCheckoutValidationHighlights(validationState.targets);
    feedback.dataset.tone = "warning";
    feedback.textContent = `${validationState.message}${formatBlockingItemsMessage(validationState.blockingItems)}`;
    return;
  }

  const message = buildOrderMessage(cartItems, tenant, productsByKey, checkoutDetails);
  checkoutLink.setAttribute("href", buildWhatsAppUrl(tenant.whatsappNumber, message));
  checkoutLink.setAttribute("target", "_blank");
  checkoutLink.setAttribute("rel", "noreferrer");
  checkoutLink.dataset.validationTargets = "";
  clearCheckoutValidationHighlights();
  feedback.dataset.tone = "default";
  feedback.textContent = `${options.primaryAction} with customer details and the current cart subtotal.`;
}

function renderCartPage({ cartItems, productsByKey, categoriesById, tenant, options, checkoutDetails }) {
  const itemsContainer = document.querySelector("[data-cart-items]");
  const summaryCount = document.querySelector("[data-cart-summary-count]");
  const summarySubtotal = document.querySelector("[data-cart-summary-subtotal]");
  const summaryNote = document.querySelector("[data-cart-summary-note]");
  const summaryAction = document.querySelector("[data-cart-checkout-label]");

  if (!itemsContainer || !summaryCount || !summarySubtotal || !summaryNote || !summaryAction) {
    return;
  }

  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCurrency = cartItems[0]?.currency || productsByKey.get(getCartItemIdentifier(cartItems[0]))?.currency || "BDT";
  const subtotal = formatCurrency(getCartSubtotal(), subtotalCurrency);

  if (!cartItems.length) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <p class="text-lg font-semibold">Your cart is empty.</p>
        <p class="cart-note">Add products from the listing, category, or product pages to start a WhatsApp-assisted order.</p>
        <a class="primary-button" href="./search.html">Browse Products</a>
      </div>
    `;
    summaryCount.textContent = "0 items";
    summarySubtotal.textContent = formatCurrency(0, "BDT");
    summaryNote.textContent = "Add an item to generate an order-ready WhatsApp message for this store.";
    summaryAction.textContent = options.primaryAction;
    renderCheckoutRuleSummary({ tenant, checkoutDetails, currency: "BDT" });
    document.body.dataset.whatsappMessage = `Hi, I want to know more about products from ${tenant.storeName || "your store"}.`;
    initWhatsAppLinks(tenant);
    updateCheckoutLink({ cartItems, tenant, productsByKey, checkoutDetails, options });
    hydrateMediaFrames(itemsContainer);
    return;
  }

  itemsContainer.innerHTML = cartItems
    .map((item) => {
      const identifier = getCartItemIdentifier(item);
      const product = productsByKey.get(identifier);
      const category = categoriesById.get(product?.categoryId || item.categoryId || "");
      const unitPrice = product?.salePrice ?? product?.basePrice ?? item.price;
      const currency = product?.currency || item.currency || "BDT";
      const lineTotal = formatCurrency(unitPrice * item.quantity, currency);
      const unitLabel = product?.unitLabel || item.unitLabel || "Per Piece";
      const image = product?.images?.[0] || item.image || "";
      const sku = product?.sku || item.sku;

      return `
        <article class="cart-item">
          <a class="cart-item-media block" href="./product.html?product=${encodeURIComponent(product?.slug || item.slug || "")}">
            ${renderMediaMarkup({
              src: image,
              alt: item.name,
              label: item.name,
              aspectClass: "aspect-square",
              frameClass: "inherit-radius"
            })}
          </a>
          <div class="cart-item-content">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-2">
                <p class="text-muted text-xs uppercase tracking-[0.18em]">${category?.name || "Product"}</p>
                <a class="block text-lg font-semibold text-body" href="./product.html?product=${encodeURIComponent(product?.slug || item.slug || "")}">${item.name}</a>
                <p class="text-sm text-muted">${sku ? `SKU ${sku} • ` : ""}${unitLabel}</p>
              </div>
              <div class="text-right">
                <p class="text-base font-semibold text-body">${formatCurrency(unitPrice, currency)}</p>
                <p class="text-sm text-muted">Line total: ${lineTotal}</p>
              </div>
            </div>
            <div class="cart-item-actions">
              <button class="secondary-button" type="button" data-cart-decrement="${identifier}">-</button>
              <input class="input-shell-compact w-16 text-center" type="number" min="1" value="${item.quantity}" data-cart-quantity-input="${identifier}" aria-label="Quantity for ${item.name}" title="Quantity for ${item.name}">
              <button class="secondary-button" type="button" data-cart-increment="${identifier}">+</button>
              <button class="secondary-button" type="button" data-cart-remove="${identifier}">Remove</button>
            </div>
          </div>
          <div class="text-right text-sm text-muted">
            <p>${item.quantity} ${item.quantity === 1 ? "item" : "items"}</p>
          </div>
        </article>
      `;
    })
    .join("");

  summaryCount.textContent = `${totalUnits} ${totalUnits === 1 ? "item" : "items"}`;
  summarySubtotal.textContent = subtotal;
  summaryNote.textContent = "Review quantity, then send the cart summary directly to the store on WhatsApp.";
  summaryAction.textContent = options.primaryAction;
  renderCheckoutRuleSummary({ tenant, checkoutDetails, currency: subtotalCurrency });
  document.body.dataset.whatsappMessage = `Hi, I need help with my cart at ${tenant.storeName || "your store"}.`;
  initWhatsAppLinks(tenant);
  updateCheckoutLink({ cartItems, tenant, productsByKey, checkoutDetails, options });
  hydrateMediaFrames(itemsContainer);

  itemsContainer.querySelectorAll("[data-cart-increment]").forEach((button) => {
    button.addEventListener("click", () => {
      const identifier = button.getAttribute("data-cart-increment");
      const item = cartItems.find((entry) => getCartItemIdentifier(entry) === identifier);
      updateCartItemQuantity(identifier, (item?.quantity || 1) + 1);
      render();
    });
  });

  itemsContainer.querySelectorAll("[data-cart-decrement]").forEach((button) => {
    button.addEventListener("click", () => {
      const identifier = button.getAttribute("data-cart-decrement");
      const item = cartItems.find((entry) => getCartItemIdentifier(entry) === identifier);
      updateCartItemQuantity(identifier, Math.max(1, (item?.quantity || 1) - 1));
      render();
    });
  });

  itemsContainer.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeFromCart(button.getAttribute("data-cart-remove"));
      render();
    });
  });

  itemsContainer.querySelectorAll("[data-cart-quantity-input]").forEach((input) => {
    input.addEventListener("change", () => {
      updateCartItemQuantity(input.getAttribute("data-cart-quantity-input"), Number(input.value || 1));
      render();
    });
  });
}

let render = () => {};

bootstrapPage("cart", async ({ tenant }) => {
  const { products, categories } = await loadPageData();
  let checkoutDetails = getCustomerProfile();
  const productsByKey = new Map();
  const categoriesById = new Map(categories.map((category) => [category.categoryId, category]));
  const options = getCartOptions(document.body.dataset.theme || tenant.themeKey || "universal-minimal");

  products.forEach((product) => {
    productsByKey.set(product.productId, product);
    productsByKey.set(product.slug, product);
  });

  document.title = `Cart | ${tenant.storeName || "Storefront"}`;
  populateCheckoutPreferenceSelects(tenant, checkoutDetails);
  hydrateCheckoutGuidance(tenant);
  syncCheckoutInputs(checkoutDetails, tenant);

  document.querySelector("[data-cart-checkout-link]")?.addEventListener("click", (event) => {
    const targets = String(event.currentTarget.dataset.validationTargets || "")
      .split(",")
      .map((target) => target.trim())
      .filter(Boolean);

    if (!targets.length) {
      return;
    }

    const [firstNode] = getCheckoutValidationNodes(targets);

    if (!firstNode) {
      return;
    }

    event.preventDefault();
    document.querySelector("#checkout-details")?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (typeof firstNode.focus === "function") {
      firstNode.focus();
    }
  });

  render = () => {
    renderCartPage({
      cartItems: getCart(),
      productsByKey,
      categoriesById,
      tenant,
      options,
      checkoutDetails
    });
    updateCartCount();
  };

  [
    ["[data-cart-customer-name]", "fullName"],
    ["[data-cart-customer-phone]", "phone"],
    ["[data-cart-customer-address]", "address"],
    ["[data-cart-delivery-zone]", "deliveryZone"],
    ["[data-cart-delivery-window]", "deliveryWindow"],
    ["[data-cart-payment-preference]", "paymentPreference"],
    ["[data-cart-customer-note]", "note"]
  ].forEach(([selector, key]) => {
    document.querySelector(selector)?.addEventListener("input", (event) => {
      checkoutDetails = {
        ...checkoutDetails,
        [key]: event.currentTarget.value
      };
      setCustomerProfile(checkoutDetails);
      render();
    });
  });

  subscribeToCustomerProfile((event) => {
    checkoutDetails = {
      ...checkoutDetails,
      ...(event.detail || getCustomerProfile())
    };
    populateCheckoutPreferenceSelects(tenant, checkoutDetails);
    syncCheckoutInputs(checkoutDetails, tenant);
    render();
  });

  document.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
    clearCart();
    render();
  });

  render();
});