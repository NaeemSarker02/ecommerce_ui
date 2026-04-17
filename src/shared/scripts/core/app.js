import { updateCartCount } from "./cart.js";
import { bindFilterReset } from "./filters.js";
import { initMiniCart } from "./mini-cart.js";
import { initProfilePanel } from "./profile-panel.js";
import { syncSearchForms } from "./search.js";
import { loadStoreData } from "./store-data.js";
import { loadTenantConfig } from "./tenant-loader.js";
import { applyTheme } from "./theme-loader.js";
import { initUiMode } from "./ui-mode.js";
import { initWhatsAppLinks } from "./whatsapp.js";
import { hydrateMediaFrames } from "./renderers.js";
import { getJson, setJson } from "../utils/storage.js";
import { setAttr, setText } from "../utils/dom.js";

const ANNOUNCEMENT_DISMISSALS_KEY = "storefront-announcement-dismissals";

function formatBusinessLabel(value) {
  return String(value || "General Retail")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ensureHeadNode(selector, template) {
  let node = document.head.querySelector(selector);

  if (!node) {
    document.head.insertAdjacentHTML("beforeend", template);
    node = document.head.querySelector(selector);
  }

  return node;
}

function applyTenantBranding(tenant) {
  const faviconHref = tenant.faviconUrl || "/icons/favicon-default.svg";
  const themeColor = tenant.primaryColor || "#111827";
  const applicationName = tenant.storeName || "Storefront";
  const existingTitle = document.title?.trim();

  document.documentElement.style.setProperty("--tenant-brand-color", tenant.primaryColor || themeColor);
  document.documentElement.style.setProperty("--tenant-brand-strong-color", tenant.secondaryColor || themeColor);
  document.documentElement.style.setProperty("--tenant-accent-color", tenant.accentColor || themeColor);

  const favicon = ensureHeadNode('link[rel="icon"]', '<link rel="icon" type="image/svg+xml">');
  favicon?.setAttribute("href", faviconHref);

  const themeColorMeta = ensureHeadNode('meta[name="theme-color"]', '<meta name="theme-color">');
  themeColorMeta?.setAttribute("content", themeColor);

  const appNameMeta = ensureHeadNode('meta[name="application-name"]', '<meta name="application-name">');
  appNameMeta?.setAttribute("content", applicationName);

  const mobileAppTitle = ensureHeadNode('meta[name="apple-mobile-web-app-title"]', '<meta name="apple-mobile-web-app-title">');
  mobileAppTitle?.setAttribute("content", applicationName);

  if (existingTitle && !existingTitle.includes(applicationName)) {
    document.title = `${applicationName} | ${existingTitle}`;
  }
}

async function replacePartial(node) {
  const partialPath = node.dataset.partial;

  if (!partialPath) {
    return;
  }

  try {
    const response = await fetch(partialPath);

    if (!response.ok) {
      return;
    }

    node.outerHTML = await response.text();
  } catch {
    node.innerHTML = "";
  }
}

export async function injectPartials(root = document) {
  while (root.querySelector("[data-partial]")) {
    const partials = Array.from(root.querySelectorAll("[data-partial]"));
    await Promise.all(partials.map((node) => replacePartial(node)));
  }
}

function hydrateTenantBindings(tenant) {
  setText("[data-store-name]", tenant.storeName);
  setText("[data-store-description]", tenant.storeDescription);
  setText("[data-store-description-short]", tenant.businessType ? String(tenant.businessType).replaceAll("-", " ") : tenant.storeDescription);
  setText("[data-store-business-label]", formatBusinessLabel(tenant.businessType));
  setText("[data-contact-phone]", tenant.contactPhone);
  setText("[data-contact-email]", tenant.contactEmail);
  setText("[data-whatsapp-number]", tenant.whatsappNumber);
  setText("[data-address]", tenant.address);
  setText("[data-current-year]", new Date().getFullYear());

  if (tenant.contactPhone) {
    setAttr("[data-contact-phone-link]", "href", `tel:${tenant.contactPhone}`);
  }

  if (tenant.contactEmail) {
    setAttr("[data-contact-email-link]", "href", `mailto:${tenant.contactEmail}`);
  }

  setAttr("[data-store-home-link]", "href", "./index.html");
  hydrateSocialLink("[data-social-facebook-link]", tenant.socialLinks?.facebook);
  hydrateSocialLink("[data-social-instagram-link]", tenant.socialLinks?.instagram);
  hydrateSocialLink("[data-social-x-link]", tenant.socialLinks?.x);

  hydrateStoreLogo(tenant);
}

function hydrateAnnouncementLink(node, href, label, fallbackHref, fallbackLabel) {
  if (!node) {
    return;
  }

  const nextHref = href || fallbackHref;
  const nextLabel = label || fallbackLabel;

  if (!nextHref || !nextLabel) {
    node.hidden = true;
    return;
  }

  node.hidden = false;
  node.textContent = nextLabel;
  node.setAttribute("href", nextHref);
}

function hydrateAnnouncementBar(tenant) {
  const bar = document.querySelector("[data-announcement-bar]");
  const badgeNode = document.querySelector("[data-announcement-badge]");
  const textNode = document.querySelector("[data-announcement-text]");
  const linkNode = document.querySelector("[data-announcement-link]");
  const secondaryLinkNode = document.querySelector("[data-announcement-secondary-link]");
  const dismissButton = document.querySelector("[data-announcement-dismiss]");
  const announcement = tenant.announcementBar || null;

  if (!bar || !textNode || !linkNode || !secondaryLinkNode || !dismissButton) {
    return;
  }

  if (!announcement?.text) {
    bar.hidden = true;
    return;
  }

  const dismissals = getJson(ANNOUNCEMENT_DISMISSALS_KEY, {});
  const announcementKey = `${tenant.tenantId || "tenant"}:${announcement.id || "default"}`;

  if (dismissals[announcementKey]) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  bar.dataset.announcementTone = announcement.tone || "default";
  textNode.textContent = announcement.text;

  if (badgeNode) {
    badgeNode.hidden = !announcement.badgeLabel;
    badgeNode.textContent = announcement.badgeLabel || "";
  }

  hydrateAnnouncementLink(
    linkNode,
    announcement.linkHref,
    announcement.linkLabel,
    "./search.html",
    "Learn more"
  );
  hydrateAnnouncementLink(
    secondaryLinkNode,
    announcement.secondaryLinkHref,
    announcement.secondaryLinkLabel,
    "",
    ""
  );
  dismissButton.hidden = announcement.dismissible === false;

  if (!dismissButton.dataset.ready) {
    dismissButton.dataset.ready = "true";
    dismissButton.addEventListener("click", () => {
      const nextDismissals = getJson(ANNOUNCEMENT_DISMISSALS_KEY, {});
      nextDismissals[announcementKey] = true;
      setJson(ANNOUNCEMENT_DISMISSALS_KEY, nextDismissals);
      bar.hidden = true;
    });
  }
}

function hydrateSocialLink(selector, href) {
  document.querySelectorAll(selector).forEach((node) => {
    if (!href) {
      node.setAttribute("hidden", "hidden");
      return;
    }

    node.removeAttribute("hidden");
    node.setAttribute("href", href);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noreferrer");
  });
}

async function hydrateSharedStorefrontBindings() {
  const { categories } = await loadStoreData();
  const categoryMarkup = categories
    .map((category) => `<a class="footer-link block" href="./category.html?category=${encodeURIComponent(category.slug)}">${category.name}</a>`)
    .join("");

  document.querySelectorAll("[data-footer-category-links]").forEach((node) => {
    node.innerHTML = categoryMarkup;
  });
}

function getStoreInitials(name) {
  const words = String(name || "Storefront")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words.map((word) => word[0]?.toUpperCase() || "").join("") || "ST";
}

function hydrateStoreLogo(tenant) {
  const logos = Array.from(document.querySelectorAll("[data-store-logo]"));
  const fallbacks = Array.from(document.querySelectorAll("[data-store-logo-fallback]"));
  const initials = getStoreInitials(tenant.storeName);

  fallbacks.forEach((node) => {
    node.textContent = initials;
  });

  logos.forEach((logo, index) => {
    if (!tenant.logoUrl) {
      logo.hidden = true;
      fallbacks[index]?.removeAttribute("hidden");
      return;
    }

    logo.alt = `${tenant.storeName || "Store"} logo`;
    logo.hidden = true;
    logo.src = tenant.logoUrl;

    const onLoad = () => {
      logo.hidden = false;
      fallbacks[index]?.setAttribute("hidden", "hidden");
    };

    const onError = () => {
      logo.hidden = true;
      fallbacks[index]?.removeAttribute("hidden");
    };

    if (logo.complete && logo.naturalWidth > 0) {
      onLoad();
      return;
    }

    logo.addEventListener("load", onLoad, { once: true });
    logo.addEventListener("error", onError, { once: true });
  });
}

function initMobileMenu() {
  const toggle = document.querySelector("[data-mobile-menu-toggle]");
  const panel = document.querySelector("[data-mobile-menu]");

  if (!toggle || !panel) {
    return;
  }

  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
}

export function bootstrapPage(pageKey, setupPage = () => {}) {
  window.addEventListener("DOMContentLoaded", async () => {
    const tenant = await loadTenantConfig();
    applyTheme(tenant);
    applyTenantBranding(tenant);
    await injectPartials();
    hydrateTenantBindings(tenant);
    hydrateAnnouncementBar(tenant);
    await hydrateSharedStorefrontBindings();
    document.body.dataset.page = pageKey;
    await setupPage({ pageKey, tenant });

    hydrateMediaFrames();
    initUiMode();
    initWhatsAppLinks(tenant);
    syncSearchForms();
    bindFilterReset();
    updateCartCount();
    initMobileMenu();
    initMiniCart(tenant);
    initProfilePanel(tenant);
  });
}
