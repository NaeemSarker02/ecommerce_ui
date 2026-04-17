import { formatCurrency } from "../utils/currency.js";
import { addToCart } from "./cart.js";
import { getCheckoutPreferenceLabel, getProductCheckoutValidationState } from "./checkout-preferences.js";
import { getCustomerProfile } from "./customer-profile.js";
import { openProfilePanel } from "./profile-panel.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function formatLabel(value) {
  return String(value ?? "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getProductCheckoutRuleMessage(product) {
  const rules = product?.checkoutRules || null;

  if (!rules) {
    return "";
  }

  if (rules.message) {
    return rules.message;
  }

  if (rules.pickupOnly) {
    return "This item is available for pickup only.";
  }

  if (Array.isArray(rules.blockedPaymentMethods) && rules.blockedPaymentMethods.length) {
    return `This item is not available with ${rules.blockedPaymentMethods.join(", ")}.`;
  }

  if (rules.requiresDeliveryWindow) {
    return "Choose a delivery window for this item before checkout.";
  }

  return "";
}

export function getProductRestrictionBadges(product, tenant) {
  const rules = product?.checkoutRules || null;

  if (!rules) {
    return [];
  }

  const badges = [];

  if (rules.pickupOnly) {
    badges.push("Pickup Only");
  }

  if (Array.isArray(rules.allowedDeliveryZones) && rules.allowedDeliveryZones.length && !rules.pickupOnly) {
    badges.push(...rules.allowedDeliveryZones.map((zone) => `${getCheckoutPreferenceLabel(tenant, "deliveryZones", zone)} Only`));
  }

  if (Array.isArray(rules.blockedPaymentMethods) && rules.blockedPaymentMethods.length) {
    badges.push(`No ${rules.blockedPaymentMethods[0]}`);
  }

  if (rules.requiresDeliveryWindow) {
    badges.push("Delivery Slot Needed");
  }

  return badges.filter(Boolean).slice(0, 2);
}

export function renderMediaMarkup(options = {}) {
  const {
    src,
    alt,
    label,
    aspectClass = "",
    frameClass = "",
    imageClass = "media-image"
  } = options;

  return `
    <div
      class="${joinClasses("media-shell", aspectClass, frameClass)}"
      data-media-frame
      data-media-loaded="false"
      data-fallback-label="${escapeAttribute(label || alt || "Preview image")}">
      ${src ? `<img class="${escapeAttribute(imageClass)}" src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || label || "Preview image")}" loading="lazy" decoding="async">` : ""}
    </div>
  `;
}

function collectMediaFrames(root) {
  const frames = [];

  if (root?.matches?.("[data-media-frame]")) {
    frames.push(root);
  }

  if (root?.querySelectorAll) {
    frames.push(...root.querySelectorAll("[data-media-frame]"));
  }

  return frames;
}

export function hydrateMediaFrames(root = document) {
  collectMediaFrames(root).forEach((frame) => {
    const image = frame.querySelector("img");

    if (!image || !image.getAttribute("src")) {
      frame.dataset.mediaLoaded = "false";
      return;
    }

    if (frame.dataset.mediaHydrated === "true") {
      return;
    }

    frame.dataset.mediaHydrated = "true";

    const markLoaded = () => {
      frame.dataset.mediaLoaded = "true";
    };

    const markFallback = () => {
      frame.dataset.mediaLoaded = "false";
      image.remove();
    };

    if (image.complete) {
      if (image.naturalWidth > 0) {
        markLoaded();
      } else {
        markFallback();
      }

      return;
    }

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markFallback, { once: true });
  });
}

export function renderCategoryCards(container, categories, options = {}) {
  const { titleTag = "h3", showCount = false, categoryCounts = new Map() } = options;

  container.innerHTML = categories
    .map(
      (category) => `
        <article class="card-surface category-card overflow-hidden">
          <a class="category-card-link" href="./category.html?category=${encodeURIComponent(category.slug)}">
            ${renderMediaMarkup({
              src: category.imageUrl,
              alt: category.name,
              label: category.name,
              aspectClass: "aspect-[4/3]",
              frameClass: "category-card-media"
            })}
            <div class="category-card-copy">
              <div class="category-card-meta">
                <p class="category-card-kicker">${escapeHtml(category.icon || "category")}</p>
                ${showCount ? `<span class="category-count">${escapeHtml(String(categoryCounts.get(category.categoryId) || 0))} ${categoryCounts.get(category.categoryId) === 1 ? "item" : "items"}</span>` : ""}
              </div>
              <div class="space-y-2">
                <${titleTag} class="category-card-title">${escapeHtml(category.name)}</${titleTag}>
                <p class="category-card-description">${escapeHtml(category.description || "Browse products in this category.")}</p>
              </div>
              <span class="category-card-cta">Browse category</span>
            </div>
          </a>
        </article>
      `
    )
    .join("");

  hydrateMediaFrames(container);
}

export function renderProductCards(container, products, categoryMap, options = {}) {
  const {
    showDescription = true,
    aspectClass = "aspect-square",
    emptyMessage = "No products found for this view.",
    compact = false,
    showQuickAdd = true,
    buttonLabel = "Add to Cart",
    tenant = null
  } = options;

  if (!products.length) {
    container.innerHTML = `<div class="card-surface listing-empty-state">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const category = categoryMap.get(product.categoryId);
      const currentPrice = product.salePrice ?? product.basePrice;
      const price = formatCurrency(currentPrice, product.currency || "BDT");
      const comparePrice = product.salePrice && product.salePrice < product.basePrice ? formatCurrency(product.basePrice, product.currency || "BDT") : null;
      const categoryName = category?.name || product.categoryId || "Product";
      const badge = product.badges?.[0] || (product.stockStatus === "low-stock" ? "Low Stock" : null);
      const description = product.shortDescription || product.longDescription || "Reusable product-card rendering from shared JSON data.";
      const primaryImage = product.images?.[0];
      const checkoutRuleMessage = getProductCheckoutRuleMessage(product);
      const quickAddState = tenant ? getProductPurchaseActionState({ product, tenant, fallbackLabel: buttonLabel }) : { label: buttonLabel, blocked: false, target: "", message: "" };
      const restrictionBadges = tenant ? getProductRestrictionBadges(product, tenant) : [];
      const productHref = `./product.html?product=${encodeURIComponent(product.slug)}`;

      return `
        <article class="card-surface product-card overflow-hidden" data-compact="${compact ? "true" : "false"}">
          <a class="product-card-media-link" href="${productHref}">
            ${renderMediaMarkup({
              src: primaryImage,
              alt: product.name,
              label: product.name,
              aspectClass,
              frameClass: "product-card-media"
            })}
          </a>
          <div class="product-card-body ${compact ? "" : "md:p-5"}">
            <div class="product-card-meta">
              <p class="product-card-eyebrow">${escapeHtml(categoryName)}</p>
              ${badge ? `<span class="pill-badge">${escapeHtml(badge)}</span>` : ""}
            </div>
            <div class="space-y-2.5">
              <a class="block" href="${productHref}">
                <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
              </a>
              ${showDescription ? `<p class="product-card-copy">${escapeHtml(description)}</p>` : ""}
              ${restrictionBadges.length ? `<div class="product-rule-pill-row">${restrictionBadges.map((badgeLabel) => `<span class="product-rule-pill">${escapeHtml(badgeLabel)}</span>`).join("")}</div>` : ""}
              ${checkoutRuleMessage ? `<p class="validation-note product-rule-note product-card-note" data-tone="warning">${escapeHtml(checkoutRuleMessage)}</p>` : ""}
            </div>
            <div class="product-card-footer">
              <div class="product-card-price-row">
                <div class="price-stack">
                  <p class="text-lg font-semibold text-body">${escapeHtml(price)}</p>
                  ${comparePrice ? `<p class="price-compare">${escapeHtml(comparePrice)}</p>` : ""}
                </div>
                <p class="product-unit-label">${escapeHtml(product.unitLabel || "Per Item")}</p>
              </div>
              <div class="product-card-actions">
                <a class="product-card-link" href="${productHref}">View details</a>
                ${showQuickAdd ? `<button class="primary-button product-card-quick-action shrink-0" type="button" data-quick-add="${encodeURIComponent(product.slug)}" data-quick-add-state="${quickAddState.blocked ? "blocked" : "ready"}" data-quick-add-target="${escapeAttribute(quickAddState.target)}">${escapeHtml(quickAddState.label)}</button>` : ""}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  hydrateMediaFrames(container);

  if (showQuickAdd) {
    container.querySelectorAll("[data-quick-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find((item) => item.slug === button.getAttribute("data-quick-add"));

        if (!product) {
          return;
        }

        if (button.dataset.quickAddState === "blocked") {
          openProfilePanel(button.dataset.quickAddTarget || "deliveryZone");
          return;
        }

        addToCart(buildCartItemPayload(product, 1));
      });
    });
  }
}

function getQuickAddActionLabel(target, fallbackLabel) {
  const labelMap = {
    deliveryZone: "Set Delivery Zone",
    deliveryWindow: "Choose Delivery Window",
    paymentPreference: "Change Payment Method",
    fullName: "Add Full Name",
    phone: "Add Phone",
    address: "Add Address",
    note: "Update Note"
  };

  return labelMap[target] || fallbackLabel;
}

export function getProductPurchaseActionState({ product, tenant, fallbackLabel, checkoutDetails = getCustomerProfile() }) {
  const validationState = getProductCheckoutValidationState({
    tenant,
    product,
    checkoutDetails
  });

  if (!validationState.message) {
    return {
      label: fallbackLabel,
      blocked: false,
      target: "",
      message: ""
    };
  }

  const primaryTarget = validationState.targets[0] || "deliveryZone";

  return {
    label: getQuickAddActionLabel(primaryTarget, fallbackLabel),
    blocked: true,
    target: primaryTarget,
    message: validationState.message
  };
}

export function buildCartItemPayload(product, quantity = 1) {
  return {
    productId: product.productId,
    slug: product.slug,
    name: product.name,
    price: product.salePrice ?? product.basePrice,
    quantity,
    image: product.images?.[0] || null,
    currency: product.currency || "BDT",
    categoryId: product.categoryId,
    unitLabel: product.unitLabel || null,
    sku: product.sku || null,
    checkoutRules: product.checkoutRules || null
  };
}

export function renderCategoryChips(container, categories, activeCategory) {
  container.innerHTML = categories
    .map((category) => {
      const active = activeCategory && category.categoryId === activeCategory.categoryId;
      return `<a class="category-chip" data-active="${active ? "true" : "false"}" href="./category.html?category=${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a>`;
    })
    .join("");
}

export function renderProductDetails(container, product) {
  const attributes = Object.entries(product.attributes || {});

  container.innerHTML = attributes.length
    ? attributes
        .map(
          ([key, value]) => `
            <li class="product-detail-list-item">
              <span class="product-detail-list-label">${escapeHtml(formatLabel(key))}</span>
              <span class="product-detail-list-value">${escapeHtml(value)}</span>
            </li>
          `
        )
        .join("")
    : `
        <li class="product-detail-list-item">
          <span class="product-detail-list-label">Details</span>
          <span class="product-detail-list-value">No additional details configured for this product yet.</span>
        </li>
      `;
}

export function renderTrustBadges(container, product, tenant = null) {
  const badges = product.badges?.length ? product.badges : ["Trusted", "Fast Reply"];
  const restrictionBadges = tenant ? getProductRestrictionBadges(product, tenant) : [];

  container.innerHTML = badges
    .slice(0, 3)
    .map((badge) => `<span class="trust-badge">${escapeHtml(badge)}</span>`)
    .concat(restrictionBadges.map((badge) => `<span class="product-rule-pill">${escapeHtml(badge)}</span>`))
    .join("");
}

export function renderGallery(mainNode, thumbnailsNode, product) {
  const images = product.images?.filter(Boolean) || [];
  const gallerySources = images.length ? images.slice(0, 4) : [""];

  const renderMainImage = (src, index) => {
    if (!mainNode) {
      return;
    }

    mainNode.innerHTML = renderMediaMarkup({
      src,
      alt: `${product.name} view ${index + 1}`,
      label: product.name,
      frameClass: "media-fill inherit-radius"
    });

    hydrateMediaFrames(mainNode);
  };

  renderMainImage(gallerySources[0], 0);

  if (!thumbnailsNode) {
    return;
  }

  thumbnailsNode.innerHTML = gallerySources
    .map(
      (src, index) => `
        <button
          class="theme-thumbnail overflow-hidden border border-transparent bg-transparent p-0"
          type="button"
          data-gallery-image="${escapeAttribute(src)}"
          aria-label="Show ${escapeAttribute(product.name)} image ${index + 1}"
          aria-pressed="${index === 0 ? "true" : "false"}">
          ${renderMediaMarkup({
            src,
            alt: `${product.name} thumbnail ${index + 1}`,
            label: `View ${index + 1}`,
            frameClass: "media-fill inherit-radius"
          })}
        </button>
      `
    )
    .join("");

  hydrateMediaFrames(thumbnailsNode);

  thumbnailsNode.querySelectorAll("[data-gallery-image]").forEach((button, index) => {
    button.addEventListener("click", () => {
      renderMainImage(button.dataset.galleryImage, index);
      thumbnailsNode.querySelectorAll("[data-gallery-image]").forEach((node) => {
        node.setAttribute("aria-pressed", node === button ? "true" : "false");
      });
    });
  });
}
