import { getJson, setJson } from "../utils/storage.js";

const CART_KEY = "storefront-cart";
const CART_UPDATED_EVENT = "storefront:cart-updated";
const CART_ITEM_ADDED_EVENT = "storefront:cart-item-added";

function getCartItemKey(item) {
  return item?.productId || item?.slug || item?.name || "unknown-item";
}

function normalizeQuantity(value) {
  return Math.max(1, Number.parseInt(String(value ?? 1), 10) || 1);
}

function normalizeCartItem(item) {
  return {
    productId: item?.productId || null,
    slug: item?.slug || null,
    name: item?.name || "Storefront Item",
    price: Number(item?.price || 0),
    quantity: normalizeQuantity(item?.quantity),
    image: item?.image || null,
    currency: item?.currency || "BDT",
    categoryId: item?.categoryId || null,
    unitLabel: item?.unitLabel || null,
    sku: item?.sku || null,
    checkoutRules: item?.checkoutRules || null
  };
}

function mergeCartItems(items) {
  const merged = new Map();

  for (const rawItem of Array.isArray(items) ? items : []) {
    const item = normalizeCartItem(rawItem);
    const key = getCartItemKey(item);
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        price: item.price || existing.price,
        image: item.image || existing.image,
        currency: item.currency || existing.currency,
        categoryId: item.categoryId || existing.categoryId,
        unitLabel: item.unitLabel || existing.unitLabel,
        sku: item.sku || existing.sku,
        checkoutRules: item.checkoutRules || existing.checkoutRules || null
      });
      continue;
    }

    merged.set(key, item);
  }

  return Array.from(merged.values());
}

function emitCartUpdated(items) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: items }));
}

function emitCartItemAdded(item, items) {
  window.dispatchEvent(
    new CustomEvent(CART_ITEM_ADDED_EVENT, {
      detail: {
        item: normalizeCartItem(item),
        items
      }
    })
  );
}

export function getCart() {
  return mergeCartItems(getJson(CART_KEY, []));
}

export function setCart(items) {
  const normalizedItems = mergeCartItems(items);
  setJson(CART_KEY, normalizedItems);
  updateCartCount();
  emitCartUpdated(normalizedItems);
}

export function addToCart(item) {
  const nextItems = [...getCart(), item];
  setCart(nextItems);
  emitCartItemAdded(item, getCart());
}

export function removeFromCart(identifier) {
  setCart(getCart().filter((item) => getCartItemKey(item) !== identifier));
}

export function updateCartItemQuantity(identifier, quantity) {
  const nextQuantity = Number.parseInt(String(quantity ?? 1), 10);

  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    removeFromCart(identifier);
    return;
  }

  setCart(
    getCart().map((item) => {
      if (getCartItemKey(item) !== identifier) {
        return item;
      }

      return {
        ...item,
        quantity: normalizeQuantity(nextQuantity)
      };
    })
  );
}

export function clearCart() {
  setCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + normalizeQuantity(item.quantity), 0);
}

export function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + Number(item.price || 0) * normalizeQuantity(item.quantity), 0);
}

export function updateCartCount() {
  const count = getCartCount();
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
  });
}

export function subscribeToCartUpdates(listener) {
  window.addEventListener(CART_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, listener);
  };
}

export function subscribeToCartItemAdded(listener) {
  window.addEventListener(CART_ITEM_ADDED_EVENT, listener);

  return () => {
    window.removeEventListener(CART_ITEM_ADDED_EVENT, listener);
  };
}
