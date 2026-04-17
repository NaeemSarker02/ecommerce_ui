import { addToCart } from "../core/cart.js";
import { buildCartItemPayload, getProductCheckoutRuleMessage, getProductPurchaseActionState, renderGallery, renderProductDetails, renderTrustBadges } from "../core/renderers.js";
import { findProduct, getQueryParam } from "../core/store-data.js";
import { bootstrapPage } from "../core/app.js";
import { getCustomerProfile, subscribeToCustomerProfile } from "../core/customer-profile.js";
import { openProfilePanel } from "../core/profile-panel.js";
import { buildWhatsAppUrl } from "../core/whatsapp.js";
import { formatCurrency } from "../utils/currency.js";
import { setAttr, setText } from "../utils/dom.js";
import { loadPageData } from "./shared-page-data.js";

function initQuantityPicker() {
  const input = document.querySelector("[data-qty-input]");
  const decrement = document.querySelector("[data-qty-decrement]");
  const increment = document.querySelector("[data-qty-increment]");

  if (!input || !decrement || !increment) {
    return;
  }

  decrement.addEventListener("click", () => {
    input.value = String(Math.max(1, Number(input.value || 1) - 1));
  });

  increment.addEventListener("click", () => {
    input.value = String(Number(input.value || 1) + 1);
  });
}

function formatStockStatus(product) {
  switch (product.stockStatus) {
    case "low-stock":
      return "Low Stock";
    case "out-of-stock":
      return "Out of Stock";
    default:
      return "In Stock";
  }
}

function formatProductMeta(product) {
  return Object.values(product.attributes || {})
    .slice(0, 2)
    .filter(Boolean)
    .join(" / ");
}

function getProductOptions(themeKey) {
  switch (themeKey) {
    case "tech-electronics":
      return {
        actionLabel: "Add to Cart",
        whatsappLabel: "Order via WhatsApp",
        detailsTitle: "Quick Specs"
      };
    case "fashion-lifestyle":
      return {
        actionLabel: "Add to Bag",
        whatsappLabel: "Ask on WhatsApp",
        detailsTitle: "Materials and Fit"
      };
    case "daily-essentials":
      return {
        actionLabel: "Add to Cart",
        whatsappLabel: "Order on WhatsApp",
        detailsTitle: "Trust and Usage"
      };
    default:
      return {
        actionLabel: "Add to Cart",
        whatsappLabel: "Order on WhatsApp",
        detailsTitle: "Key Details"
      };
  }
}

bootstrapPage("product", async ({ tenant }) => {
  const { products, categories } = await loadPageData();
  const product = findProduct(products, getQueryParam("product"));
  const themeKey = document.body.dataset.theme || tenant.themeKey || "universal-minimal";
  const options = getProductOptions(themeKey);
  const category = categories.find((item) => item.categoryId === product?.categoryId) || null;
  const current = document.querySelector("[data-breadcrumb-current]");
  const detailsList = document.querySelector("[data-product-details]");
  const galleryMain = document.querySelector("[data-product-gallery-main]");
  const galleryThumbs = document.querySelector("[data-product-gallery-thumbnails]");
  const trustBadges = document.querySelector("[data-product-trust-badges]");
  const stockNode = document.querySelector("[data-product-stock]");
  const comparePriceNode = document.querySelector("[data-product-compare-price]");
  const metaNode = document.querySelector("[data-product-meta]");
  const addButton = document.querySelector("[data-add-to-cart]");
  const actionLabel = document.querySelector("[data-product-action-label]");
  const whatsappButton = document.querySelector("[data-product-whatsapp-link]");
  const whatsappLabel = document.querySelector("[data-product-whatsapp-label]");
  const quantityInput = document.querySelector("[data-qty-input]");

  if (!product) {
    return;
  }

  if (current) {
    current.textContent = product.name;
  }

  document.title = `${product.name} | ${tenant.storeName || "Storefront"}`;
  document.body.dataset.whatsappMessage = `Hi, I want to order: ${product.name} (Code: ${product.sku}) from ${tenant.storeName || "your store"}.`;

  setText("[data-additional-category-link]", category?.name || "Category");
  if (category?.slug) {
    setAttr("[data-additional-category-link]", "href", `./category.html?category=${encodeURIComponent(category.slug)}`);
  }

  setText("[data-product-kicker]", product.brand || "Product Detail");
  setText("[data-product-title]", product.name);
  setText("[data-product-description]", product.longDescription || product.shortDescription);
  setText("[data-product-price]", formatCurrency(product.salePrice ?? product.basePrice, product.currency || "BDT"));
  setText("[data-product-sku]", `SKU ${product.sku}`);
  setText("[data-product-unit]", product.unitLabel || "Per Piece");
  setText("[data-product-meta]", formatProductMeta(product));
  setText("[data-product-stock]", formatStockStatus(product));
  setText("[data-product-action-label]", options.actionLabel);
  setText("[data-product-whatsapp-label]", options.whatsappLabel);
  setText("[data-product-details-title]", options.detailsTitle);

  if (stockNode) {
    stockNode.dataset.stockState = product.stockStatus || "in-stock";
  }

  if (comparePriceNode) {
    const comparePrice = product.salePrice && product.salePrice < product.basePrice ? formatCurrency(product.basePrice, product.currency || "BDT") : "";
    comparePriceNode.hidden = !comparePrice;
    comparePriceNode.textContent = comparePrice;
  }

  if (metaNode) {
    metaNode.hidden = !String(metaNode.textContent || "").trim();
  }

  const checkoutRuleNode = document.querySelector("[data-product-checkout-rule]");
  const updateProductActionState = () => {
    const fallbackRuleMessage = getProductCheckoutRuleMessage(product);
    const checkoutDetails = getCustomerProfile();
    const purchaseActionState = getProductPurchaseActionState({
      product,
      tenant,
      fallbackLabel: options.actionLabel,
      checkoutDetails
    });
    const whatsappActionState = getProductPurchaseActionState({
      product,
      tenant,
      fallbackLabel: options.whatsappLabel,
      checkoutDetails
    });

    if (actionLabel) {
      actionLabel.textContent = purchaseActionState.label;
    }

    if (addButton) {
      addButton.dataset.quickAddState = purchaseActionState.blocked ? "blocked" : "ready";
      addButton.dataset.quickAddTarget = purchaseActionState.target || "";
    }

    if (whatsappLabel) {
      whatsappLabel.textContent = whatsappActionState.label;
    }

    if (whatsappButton) {
      whatsappButton.dataset.productWhatsappState = whatsappActionState.blocked ? "blocked" : "ready";
      whatsappButton.dataset.quickAddTarget = whatsappActionState.target || "";

      if (whatsappActionState.blocked) {
        whatsappButton.setAttribute("href", "#");
        whatsappButton.removeAttribute("target");
        whatsappButton.removeAttribute("rel");
      } else {
        whatsappButton.setAttribute("href", buildWhatsAppUrl(tenant.whatsappNumber, document.body.dataset.whatsappMessage));
        whatsappButton.setAttribute("target", "_blank");
        whatsappButton.setAttribute("rel", "noreferrer");
      }
    }

    if (checkoutRuleNode) {
      const noteMessage = purchaseActionState.message || fallbackRuleMessage;
      checkoutRuleNode.hidden = !noteMessage;
      checkoutRuleNode.textContent = noteMessage;
      checkoutRuleNode.dataset.tone = noteMessage ? "warning" : "default";
    }
  };

  updateProductActionState();

  if (detailsList) {
    renderProductDetails(detailsList, product);
  }

  if (trustBadges) {
    renderTrustBadges(trustBadges, product, tenant);
  }

  renderGallery(galleryMain, galleryThumbs, product);
  initQuantityPicker();

  addButton?.addEventListener("click", () => {
    if (addButton.dataset.quickAddState === "blocked") {
      openProfilePanel(addButton.dataset.quickAddTarget || "deliveryZone");
      return;
    }

    addToCart(buildCartItemPayload(product, Math.max(1, Number(quantityInput?.value || 1))));
  });

  whatsappButton?.addEventListener("click", (event) => {
    if (whatsappButton.dataset.productWhatsappState !== "blocked") {
      return;
    }

    event.preventDefault();
    openProfilePanel(whatsappButton.dataset.quickAddTarget || "deliveryZone");
  });

  requestAnimationFrame(() => {
    updateProductActionState();
  });

  subscribeToCustomerProfile(() => {
    updateProductActionState();
  });
});
