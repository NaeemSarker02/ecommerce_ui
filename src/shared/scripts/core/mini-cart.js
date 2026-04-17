import { getCart, getCartCount, getCartSubtotal, removeFromCart, subscribeToCartItemAdded, subscribeToCartUpdates, updateCartItemQuantity } from "./cart.js";
import { getCheckoutRuleSummaries, getCheckoutValidationState } from "./checkout-preferences.js";
import { getCustomerProfile, subscribeToCustomerProfile } from "./customer-profile.js";
import { openProfilePanel } from "./profile-panel.js";
import { hydrateMediaFrames, renderMediaMarkup } from "./renderers.js";
import { formatCurrency } from "../utils/currency.js";

let miniCartReady = false;
let activeTenant = null;

function getCartItemIdentifier(item) {
  return item?.productId || item?.slug || item?.name || "unknown-item";
}

function getCurrency(items) {
  return items[0]?.currency || "BDT";
}

function setStatus(message) {
  const node = document.querySelector("[data-mini-cart-status]");

  if (node) {
    node.textContent = message;
  }
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

function renderMiniCartRuleSummary(items) {
  const container = document.querySelector("[data-mini-cart-rule-summary]");
  const list = document.querySelector("[data-mini-cart-rule-list]");
  const feedback = document.querySelector("[data-mini-cart-rule-feedback]");
  const action = document.querySelector("[data-mini-cart-rule-action]");

  if (!container || !list || !feedback || !action || !activeTenant) {
    return;
  }

  const currency = getCurrency(items);
  const checkoutDetails = getCustomerProfile();
  const summaries = getCheckoutRuleSummaries({
    tenant: activeTenant,
    checkoutDetails,
    cartItems: items,
    subtotal: getCartSubtotal(),
    currency
  });
  const validationState = getCheckoutValidationState({
    tenant: activeTenant,
    checkoutDetails,
    cartItems: items,
    subtotal: getCartSubtotal(),
    currency
  });

  if (!items.length || !summaries.length) {
    container.hidden = true;
    list.innerHTML = "";
    feedback.hidden = true;
    feedback.textContent = "";
    feedback.dataset.tone = "default";
    action.hidden = true;
    action.textContent = "";
    action.dataset.actionKind = "";
    action.dataset.actionTarget = "";
    return;
  }

  container.hidden = false;
  list.innerHTML = summaries
    .slice(0, 3)
    .map((summary) => renderRuleSummaryMarkup(summary))
    .join("");

  if (validationState.message) {
    feedback.hidden = false;
    feedback.dataset.tone = "warning";
    feedback.textContent = `${validationState.message}${formatBlockingItemsMessage(validationState.blockingItems)}`;
    const actionConfig = getMiniCartActionConfig(validationState.targets);
    action.hidden = false;
    action.textContent = actionConfig.label;
    action.dataset.actionKind = actionConfig.kind;
    action.dataset.actionTarget = actionConfig.target;
    return;
  }

  feedback.hidden = false;
  feedback.dataset.tone = "default";
  feedback.textContent = "Checkout rules are currently satisfied by your saved preferences.";
  action.hidden = true;
  action.textContent = "";
  action.dataset.actionKind = "";
  action.dataset.actionTarget = "";
}

function getMiniCartActionConfig(targets = []) {
  const priorityTargets = ["deliveryZone", "paymentPreference", "deliveryWindow", "fullName", "phone", "address", "note", "subtotal"];
  const target = priorityTargets.find((entry) => targets.includes(entry)) || targets[0] || "subtotal";

  const configMap = {
    deliveryZone: { kind: "profile", target: "deliveryZone", label: "Update Delivery Zone" },
    paymentPreference: { kind: "profile", target: "paymentPreference", label: "Change Payment Method" },
    deliveryWindow: { kind: "profile", target: "deliveryWindow", label: "Change Delivery Window" },
    fullName: { kind: "profile", target: "fullName", label: "Add Full Name" },
    phone: { kind: "profile", target: "phone", label: "Add Phone Number" },
    address: { kind: "profile", target: "address", label: "Update Address" },
    note: { kind: "profile", target: "note", label: "Update Order Note" },
    subtotal: { kind: "browse", target: "", label: "Add More Items" }
  };

  return configMap[target] || configMap.subtotal;
}

function setOpenState(open) {
  const drawer = document.querySelector("[data-mini-cart]");
  const overlay = document.querySelector("[data-mini-cart-overlay]");

  if (!drawer || !overlay) {
    return;
  }

  drawer.hidden = !open;
  overlay.hidden = !open;
  document.body.dataset.miniCartOpen = open ? "true" : "false";
}

function renderMiniCart() {
  const items = getCart();
  const itemsContainer = document.querySelector("[data-mini-cart-items]");
  const countNode = document.querySelector("[data-mini-cart-count]");
  const subtotalNode = document.querySelector("[data-mini-cart-subtotal]");
  const overflowNote = document.querySelector("[data-mini-cart-overflow-note]");

  if (!itemsContainer || !countNode || !subtotalNode || !overflowNote) {
    return;
  }

  countNode.textContent = `${getCartCount()} ${getCartCount() === 1 ? "item" : "items"}`;
  subtotalNode.textContent = formatCurrency(getCartSubtotal(), getCurrency(items));
  renderMiniCartRuleSummary(items);

  if (!items.length) {
    itemsContainer.innerHTML = `
      <div class="mini-cart-empty-state">
        <p class="text-base font-semibold">Your cart is empty.</p>
        <p class="cart-note">Add products from anywhere in the storefront and they will appear here instantly.</p>
      </div>
    `;
    overflowNote.hidden = true;
    renderMiniCartRuleSummary(items);
    hydrateMediaFrames(itemsContainer);
    return;
  }

  overflowNote.hidden = items.length <= 4;
  overflowNote.textContent = `Showing ${Math.min(items.length, 4)} of ${items.length} items. Open the full cart to review everything.`;

  itemsContainer.innerHTML = items
    .slice(0, 4)
    .map((item) => {
      const identifier = getCartItemIdentifier(item);
      const lineTotal = formatCurrency(Number(item.price || 0) * Number(item.quantity || 1), item.currency || "BDT");

      return `
        <article class="mini-cart-item">
          <a class="mini-cart-item-media" href="./product.html?product=${encodeURIComponent(item.slug || "")}">
            ${renderMediaMarkup({
              src: item.image || "",
              alt: item.name,
              label: item.name,
              aspectClass: "aspect-square",
              frameClass: "inherit-radius"
            })}
          </a>
          <div class="mini-cart-item-content">
            <a class="text-sm font-semibold text-body" href="./product.html?product=${encodeURIComponent(item.slug || "")}">${item.name}</a>
            <p class="text-xs text-muted">${item.quantity} x ${formatCurrency(item.price, item.currency || "BDT")}</p>
            <p class="text-sm font-semibold text-body">${lineTotal}</p>
            <div class="mini-cart-item-actions">
              <button class="secondary-button mini-cart-action-button" type="button" data-mini-cart-decrement="${identifier}">-</button>
              <input class="input-shell-compact mini-cart-qty-input text-center" type="number" min="1" value="${item.quantity}" data-mini-cart-quantity="${identifier}" aria-label="Quantity for ${item.name}" title="Quantity for ${item.name}">
              <button class="secondary-button mini-cart-action-button" type="button" data-mini-cart-increment="${identifier}">+</button>
              <button class="secondary-button mini-cart-remove-button" type="button" data-mini-cart-remove="${identifier}">Remove</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  hydrateMediaFrames(itemsContainer);

  itemsContainer.querySelectorAll("[data-mini-cart-increment]").forEach((button) => {
    button.addEventListener("click", () => {
      const identifier = button.getAttribute("data-mini-cart-increment");
      const item = items.find((entry) => getCartItemIdentifier(entry) === identifier);
      updateCartItemQuantity(identifier, (item?.quantity || 1) + 1);
      setStatus(`${item?.name || "Item"} quantity updated.`);
      renderMiniCart();
    });
  });

  itemsContainer.querySelectorAll("[data-mini-cart-decrement]").forEach((button) => {
    button.addEventListener("click", () => {
      const identifier = button.getAttribute("data-mini-cart-decrement");
      const item = items.find((entry) => getCartItemIdentifier(entry) === identifier);
      updateCartItemQuantity(identifier, Math.max(1, (item?.quantity || 1) - 1));
      setStatus(`${item?.name || "Item"} quantity updated.`);
      renderMiniCart();
    });
  });

  itemsContainer.querySelectorAll("[data-mini-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const identifier = button.getAttribute("data-mini-cart-remove");
      const item = items.find((entry) => getCartItemIdentifier(entry) === identifier);
      removeFromCart(identifier);
      setStatus(`${item?.name || "Item"} removed from cart.`);
      renderMiniCart();
    });
  });

  itemsContainer.querySelectorAll("[data-mini-cart-quantity]").forEach((input) => {
    input.addEventListener("change", () => {
      const identifier = input.getAttribute("data-mini-cart-quantity");
      const nextValue = Math.max(1, Number(input.value || 1));
      input.value = String(nextValue);
      updateCartItemQuantity(identifier, nextValue);
      setStatus("Cart quantity updated.");
      renderMiniCart();
    });
  });
}

export function initMiniCart(tenant) {
  activeTenant = tenant || activeTenant;

  if (miniCartReady) {
    renderMiniCart();
    return;
  }

  const drawer = document.querySelector("[data-mini-cart]");
  const overlay = document.querySelector("[data-mini-cart-overlay]");

  if (!drawer || !overlay) {
    return;
  }

  miniCartReady = true;
  renderMiniCart();

  document.querySelectorAll("[data-mini-cart-open]").forEach((node) => {
    node.addEventListener("click", () => {
      renderMiniCart();
      setStatus("Review your selected products before going to the full cart.");
      setOpenState(true);
    });
  });

  document.querySelectorAll("[data-mini-cart-close]").forEach((node) => {
    node.addEventListener("click", () => {
      setOpenState(false);
    });
  });

  document.querySelector("[data-mini-cart-rule-action]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const actionKind = button.dataset.actionKind || "";
    const actionTarget = button.dataset.actionTarget || "";

    if (actionKind === "browse") {
      setOpenState(false);
      window.location.href = "./search.html";
      return;
    }

    if (actionKind === "profile") {
      setOpenState(false);
      openProfilePanel(actionTarget);
    }
  });

  overlay.addEventListener("click", () => {
    setOpenState(false);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpenState(false);
    }
  });

  subscribeToCartUpdates(() => {
    renderMiniCart();
  });

  subscribeToCustomerProfile(() => {
    renderMiniCart();
  });

  subscribeToCartItemAdded((event) => {
    const itemName = event.detail?.item?.name || "Item";
    renderMiniCart();
    setStatus(`${itemName} added to cart.`);
    setOpenState(true);
  });
}